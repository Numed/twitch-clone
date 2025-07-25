import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { resetIngresses } from "@/actions/ingress";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local");
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    return new Response("Error occured", {
      status: 400,
    });
  }

  // Get the type
  const eventType = evt.type;

  if (eventType === "user.created") {
    try {
      // Check if user already exists
      const existingUser = await db.user.findUnique({
        where: {
          email: payload.data.email_addresses[0].email_address,
        },
        include: {
          stream: true,
        },
      });

      if (existingUser) {
        // Update existing user
        const updatedUser = await db.user.update({
          where: {
            id: existingUser.id,
          },
          data: {
            externalUserId: payload.data.id,
            username: payload.data.username,
            imageUrl: payload.data.image_url,
          },
        });

        // Create stream if it doesn't exist
        if (!existingUser.stream) {
          await db.stream.create({
            data: {
              userId: existingUser.id,
              title: `${payload.data.username}'s stream`,
              isLive: false,
              isChatEnabled: true,
              isChatDelayed: false,
              isChatFollowersOnly: false,
              ingressId: `ingress_${existingUser.id}`,
              serverUrl: null,
              streamKey: null,
            },
          });
        }
      } else {
        // Create new user
        const user = await db.user.create({
          data: {
            externalUserId: payload.data.id,
            email: payload.data.email_addresses[0].email_address,
            username: payload.data.username,
            imageUrl: payload.data.image_url,
          },
        });

        // Create stream for new user
        await db.stream.create({
          data: {
            userId: user.id,
            title: `${payload.data.username}'s stream`,
            isLive: false,
            isChatEnabled: true,
            isChatDelayed: false,
            isChatFollowersOnly: false,
            ingressId: `ingress_${user.id}`,
            serverUrl: null,
            streamKey: null,
          },
        });
      }
    } catch (error) {
      return new Response("Error handling user creation", {
        status: 500,
      });
    }
  }

  if (eventType === "user.updated") {
    try {
      await db.user.update({
        where: {
          externalUserId: payload.data.id,
        },
        data: {
          username: payload.data.username,
          imageUrl: payload.data.image_url,
        },
      });
    } catch (error) {
      return new Response("Error updating user in database", {
        status: 500,
      });
    }
  }

  if (eventType === "user.deleted") {
    try {
      // Find user first
      const user = await db.user.findUnique({
        where: {
          externalUserId: payload.data.id,
        },
        include: {
          stream: true,
        },
      });

      if (user) {
        // Reset ingresses if user exists
        await resetIngresses(payload.data.id);

        // Delete stream first if it exists
        if (user.stream) {
          await db.stream.delete({
            where: {
              id: user.stream.id,
            },
          });
        }

        // Then delete user
        await db.user.delete({
          where: {
            id: user.id,
          },
        });
      }
    } catch (error) {
      return new Response("Error deleting user from database", {
        status: 500,
      });
    }
  }

  return new Response("", { status: 200 });
}
