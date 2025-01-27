import { revalidatePath } from "next/cache";

import { followUser, unfollowUser } from "@/lib/services/follow";

export const onFollow = async (id: number) => {
  try {
    const followedUser = await followUser(id);

    revalidatePath("/");

    if (followedUser) {
      revalidatePath(`/${followedUser.following.username}`);
    }

    return followedUser;
  } catch (error: unknown) {
    throw new Error("Internal Error" + (error ? `: ${error}` : ""));
  }
};

export const onUnfollow = async (id: number) => {
  try {
    const unfollowedUser = await unfollowUser(id);

    revalidatePath("/");

    if (unfollowedUser) {
      revalidatePath(`/${unfollowedUser.following.username}`);
    }

    return unfollowedUser;
  } catch (error: unknown) {
    throw new Error("Internal Error" + (error ? `: ${error}` : ""));
  }
};
