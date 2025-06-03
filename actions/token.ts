"use server";

import { ObjectId } from "mongodb";

import { AccessToken } from "livekit-server-sdk";
import { getSelf } from "@/lib/auth-service";
import { getUserById } from "@/lib/user-service";
import { isBlockedByUser } from "@/lib/block-service";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export const createViewerToken = async (hostIdentity: string) => {
  let self;

  try {
    self = await getSelf();
  } catch {
    const id = uuidv4();
    const username = `guest-${Math.random().toString(36).substring(2, 8)}`;
    self = { id, username };
  }

  const host = await db.user.findUnique({
    where: { id: hostIdentity },
  });

  if (!host) {
    throw new Error("Host not found");
  }

  // Check both directions of blocking
  const blockedByHost = await db.block.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId: host.id,
        blockedId: self.id,
      },
    },
  });

  const blockedByViewer = await db.block.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId: self.id,
        blockedId: host.id,
      },
    },
  });

  if (blockedByHost || blockedByViewer) {
    return null;
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
