"use server";

import { revalidatePath } from "next/cache";

import { followUser, unfollowUser } from "@/lib/follow-service";
import { getSelf } from "@/lib/auth-service";

export const onFollow = async (id: string) => {
  try {
    const self = await getSelf();
    const followedUser = await followUser(id);

    revalidatePath("/");
    revalidatePath(`/u/${self.username}/community`);

    if (followedUser) {
      revalidatePath(`/${followedUser.following.username}`);
    }

    return followedUser;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Internal Error");
  }
};

export const onUnfollow = async (id: string) => {
  try {
    const self = await getSelf();
    const unfollowedUser = await unfollowUser(id);

    revalidatePath("/");
    revalidatePath(`/u/${self.username}/community`);

    if (unfollowedUser) {
      revalidatePath(`/${unfollowedUser.following.username}`);
    }

    return unfollowedUser;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Internal Error");
  }
};
