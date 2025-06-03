"use client";

import { toast } from "sonner";
import { useTransition, useState } from "react";
import { useAuth } from "@clerk/nextjs";

import { onBlock, onUnblock } from "@/actions/block";
import { onFollow, onUnfollow } from "@/actions/follow";
import { Button } from "@/components/ui/button";

interface ActionsProps {
  isFollowing: boolean;
  userId: string;
}

export const Actions = ({
  isFollowing: initialIsFollowing,
  userId,
}: ActionsProps) => {
  const [isPending, startTransition] = useTransition();
  const { userId: currentUserId } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);

  const handleFollow = () => {
    startTransition(() => {
      onFollow(userId)
        .then((data) => {
          setIsFollowing(true);
          toast.success(`You are now following ${data.following.username}`);
        })
        .catch(() => toast.error("Something went wrong"));
    });
  };

  const handleUnfollow = () => {
    startTransition(() => {
      onUnfollow(userId)
        .then((data) => {
          setIsFollowing(false);
          toast.success(`You have unfollowed ${data.following.username}`);
        })
        .catch(() => toast.error("Something went wrong"));
    });
  };

  const onClick = () => {
    if (currentUserId === userId) return;

    if (isFollowing) {
      handleUnfollow();
    } else {
      handleFollow();
    }
  };

  const handleBlock = () => {
    startTransition(() => {
      onUnblock(userId)
        .then((data) =>
          toast.success(`Unblocked the user ${data.blocked.username}`)
        )
        .catch(() => toast.error("Something went wrong"));
    });
  };

  const isHost = currentUserId === userId;

  return (
    <>
      <Button
        disabled={isPending || isHost}
        onClick={onClick}
        variant="primary"
      >
        {isFollowing ? "Unfollow" : "Follow"}
      </Button>
      <Button onClick={handleBlock} disabled={isPending || isHost}>
        Block
      </Button>
    </>
  );
};
