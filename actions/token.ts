"use server";

import { ObjectId } from "mongodb";

import { AccessToken } from "livekit-server-sdk";
import { getSelf } from "@/lib/auth-service";
import { getUserById } from "@/lib/user-service";
import { isBlockedByUser } from "@/lib/block-service";
import { db } from "@/lib/db";

export const createViewerToken = async (hostIdentity: string) => {
  let self;

  try {
    self = await getSelf();
  } catch {
    const id = new ObjectId();
    const username = `guest-${Math.floor(Math.random() * 100000)}`;
    self = { id: id.toString(), username };
  }

  const host = await getUserById(hostIdentity);
  if (!host) {
    throw new Error("Host not found");
  }

  // Check if host has blocked viewer
  const blockedByHost = await db.block.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId: host.id,
        blockedId: self.id,
      },
    },
  });

  // Check if viewer has blocked host
  const blockedByViewer = await db.block.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId: self.id,
        blockedId: host.id,
      },
    },
  });

  if (blockedByHost || blockedByViewer) {
    throw new Error("User is blocked");
  }

  const isHost = self.id === host.id;

  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    {
      identity: isHost ? `host-${self.id}` : `viewer-${self.id}`,
      name: self.username,
    }
  );

  token.addGrant({
    room: host.id,
    roomJoin: true,
    canPublish: false,
    canPublishData: true,
  });

  return token.toJwt();
};
