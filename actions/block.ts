"use server";

import { revalidatePath } from "next/cache";
import { RoomServiceClient } from "livekit-server-sdk";
import { AxiosError } from "axios";

import { getSelf } from "@/lib/auth-service";
import { blockUser, unblockUser } from "@/lib/block-service";
import { db } from "@/lib/db";
import { LiveKitRoom } from "@livekit/components-react";

let roomService: RoomServiceClient | null = null;

const getRoomService = () => {
  if (!roomService) {
    roomService = new RoomServiceClient(
      process.env.LIVEKIT_API_URL!,
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!
    );
  }
  return roomService;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const removeParticipantWithRetry = async (roomName: string, identity: string, maxRetries = 5) => {
  if (!roomService) return;

  for (let i = 0; i < maxRetries; i++) {
    try {
      // Try to remove the participant
      await roomService.removeParticipant(roomName, identity);

      // Add a delay to ensure the participant is fully removed
      await sleep(1000);

      // Try to remove again to ensure they're gone
      await roomService.removeParticipant(roomName, identity);

      // Try to remove with viewer prefix
      await roomService.removeParticipant(roomName, `viewer-${identity}`);

      // Try to remove with host prefix
      await roomService.removeParticipant(roomName, `host-${identity}`);

      // Add another delay
      await sleep(1000);

      // Final attempt to remove
      await roomService.removeParticipant(roomName, identity);

      return;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 429) {
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const backoffTime = Math.pow(2, i) * 1000;
        await sleep(backoffTime);
        continue;
      }
      // For other errors, just return silently
      return;
    }
  }
};

export const isBlockedByUser = async (id: string) => {
  try {
    const self = await getSelf();

    const otherUser = await db.user.findUnique({
      where: { id },
    });

    if (!otherUser) {
      throw new Error("User not found");
    }

    if (otherUser.id === self.id) {
      return false;
    }

    const existingBlock = await db.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: otherUser.id,
          blockedId: self.id,
        },
      },
    });

    return !!existingBlock;
  } catch {
    return false;
  }
};

export const onBlock = async (id: string) => {
  const self = await getSelf();

  if (self.id === id) {
    throw new Error("Cannot block yourself");
  }

  const otherUser = await db.user.findUnique({
    where: { id },
  });

  if (!otherUser) {
    throw new Error("User not found");
  }

  const existingBlock = await db.block.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId: self.id,
        blockedId: otherUser.id,
      },
    },
  });

  if (existingBlock) {
    throw new Error("Already blocked");
  }

  const block = await db.block.create({
    data: {
      blockerId: self.id,
      blockedId: otherUser.id,
    },
    include: {
      blocked: true,
    },
  });

  // Force disconnect the blocked user from LiveKit
  try {
    const roomService = getRoomService();

    // Get all rooms
    const rooms = await roomService.listRooms();

    // Find rooms where the blocked user is a participant
    for (const room of rooms) {
      const participants = await roomService.listParticipants(room.name);

      // Check if blocked user is in this room
      const blockedParticipant = participants.find(
        p => p.identity === otherUser.id || p.identity === `viewer-${otherUser.id}`
      );

      if (blockedParticipant) {
        // Remove the blocked user from the room
        await roomService.removeParticipant(room.name, blockedParticipant.sid);
      }
    }
  } catch (error) {
    console.error("Error disconnecting user from LiveKit:", error);
  }

  return block;
};

export const onUnblock = async (id: string) => {
  const self = await getSelf();
  const unblockedUser = await unblockUser(id);

  revalidatePath(`/u/${self.username}/community`);
  revalidatePath("/");
  return unblockedUser;
};
