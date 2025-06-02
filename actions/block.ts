"use server";

import { revalidatePath } from "next/cache";
import { RoomServiceClient } from "livekit-server-sdk";
import { AxiosError } from "axios";

import { getSelf } from "@/lib/auth-service";
import { blockUser, unblockUser } from "@/lib/block-service";

let roomService: RoomServiceClient | null = null;

if (process.env.LIVEKIT_API_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET) {
  roomService = new RoomServiceClient(
    process.env.LIVEKIT_API_URL,
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET
  );
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const removeParticipantWithRetry = async (roomName: string, identity: string, maxRetries = 3) => {
  if (!roomService) return;

  for (let i = 0; i < maxRetries; i++) {
    try {
      await roomService.removeParticipant(roomName, identity);
      return;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 429) {
        // Exponential backoff: 1s, 2s, 4s
        const backoffTime = Math.pow(2, i) * 1000;
        await sleep(backoffTime);
        continue;
      }
      // For other errors, just return silently
      return;
    }
  }
};

export const onBlock = async (id: string) => {
  const self = await getSelf();

  let blockedUser;

  try {
    blockedUser = await blockUser(id);
  } catch {
    // This means user is a guest
  }

  try {
    if (self.id && id) {
      await removeParticipantWithRetry(self.id, id);
    }
  } catch {
    // This means user is not in the room
  }

  revalidatePath(`/u/${self.username}/community`);

  return blockedUser;
};

export const onUnblock = async (id: string) => {
  const self = await getSelf();
  const unblockedUser = await unblockUser(id);

  revalidatePath(`/u/${self.username}/community`);
  return unblockedUser;
};
