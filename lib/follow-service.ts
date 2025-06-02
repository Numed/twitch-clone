import { db } from "@/lib/db";
import { getSelf } from "@/lib/auth-service";

export const isFollowingUser = async (id: string) => {
  try {
    const self = await getSelf();

    if (!self) {
      return false;
    }

    if (self.id === id) {
      return false;
    }

    const existingFollow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: self.id,
          followingId: id,
        },
      },
    });

    return !!existingFollow;
  } catch {
    return false;
  }
};

export const followUser = async (id: string) => {
  const self = await getSelf();

  if (!self) {
    throw new Error("Not authenticated");
  }

  if (self.id === id) {
    throw new Error("Cannot follow yourself");
  }

  const otherUser = await db.user.findUnique({
    where: { id },
  });

  if (!otherUser) {
    throw new Error("User not found");
  }

  const existingFollow = await db.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: self.id,
        followingId: otherUser.id,
      },
    },
  });

  if (existingFollow) {
    throw new Error("Already following");
  }

  const follow = await db.follow.create({
    data: {
      followerId: self.id,
      followingId: otherUser.id,
    },
    include: {
      following: true,
    },
  });

  return follow;
};

export const unfollowUser = async (id: string) => {
  const self = await getSelf();

  if (!self) {
    throw new Error("Not authenticated");
  }

  if (self.id === id) {
    throw new Error("Cannot unfollow yourself");
  }

  const otherUser = await db.user.findUnique({
    where: { id },
  });

  if (!otherUser) {
    throw new Error("User not found");
  }

  const existingFollow = await db.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: self.id,
        followingId: otherUser.id,
      },
    },
  });

  if (!existingFollow) {
    throw new Error("Not following");
  }

  const unfollow = await db.follow.delete({
    where: {
      id: existingFollow.id,
    },
    include: {
      following: true,
    },
  });

  return unfollow;
};

export const getFollowedUsers = async () => {
  try {
    const self = await getSelf();

    if (!self) {
      return [];
    }

    const followedUsers = await db.follow.findMany({
      where: {
        followerId: self.id,
      },
      include: {
        following: {
          include: {
            stream: {
              select: {
                isLive: true,
              },
            },
          },
        },
      },
    });

    return followedUsers;
  } catch (error) {
    console.error("Error in getFollowedUsers:", error);
    return [];
  }
};
