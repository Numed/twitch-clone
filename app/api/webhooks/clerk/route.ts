import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createClientSSR } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  const supabase = await createClientSSR();

  if (!SIGNING_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET is missing");
    return new Response("Server configuration error", { status: 500 });
  }

  const wh = new Webhook(SIGNING_SECRET);
  const headerPayload = await headers();

  const svixHeaders = {
    "svix-id": headerPayload.get("svix-id") || "",
    "svix-timestamp": headerPayload.get("svix-timestamp") || "",
    "svix-signature": headerPayload.get("svix-signature") || "",
  };

  if (
    !svixHeaders["svix-id"] ||
    !svixHeaders["svix-timestamp"] ||
    !svixHeaders["svix-signature"]
  ) {
    console.error("Missing Svix headers");
    return new Response("Invalid request headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(body, svixHeaders) as WebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response("Invalid webhook signature", { status: 400 });
  }

  switch (evt.type) {
    case "user.created": {
      const { id, username, image_url } = payload.data;
      const { error, status } = await supabase
        .from("user")
        .insert([{ user_id: id, username: username, image_url: image_url }]);
      console.log("status", status);
      if (error) console.error("Error inserting data:", error);
      break;
    }
    case "user.updated": {
      const { id, username, image_url } = payload.data;
      const { error } = await supabase
        .from("user")
        .update({ username, image_url })
        .eq("user_id", id);
      if (error) console.error("Error updating data:", error);
      break;
    }
    case "user.deleted": {
      const { id } = payload.data;
      const { error } = await supabase.from("users").delete().eq("user_id", id);
      if (error) console.error("Error deleting data:", error);
      break;
    }
    default:
      console.warn("Unhandled event type:", evt.type);
  }

  return new Response("Webhook processed", { status: 200 });
}
