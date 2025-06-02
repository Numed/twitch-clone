import { notFound } from "next/navigation";

import { getUserByUsername } from "@/lib/user-service";
import { isFollowingUser } from "@/lib/follow-service";
import { isBlockedByUser } from "@/lib/block-service";
import { StreamPlayer } from "@/components/stream-player";

interface UserPageProps {
  params: {
    username: string;
  };
}

const UserPage = async ({ params }: UserPageProps) => {
  const user = await getUserByUsername(params.username);

  if (!user || !user.stream) {
    notFound();
  }

  const isFollowing = await isFollowingUser(user.id);
  const isBlocked = await isBlockedByUser(user.id);

  if (isBlocked) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg text-muted-foreground">
          You are blocked from viewing this stream
        </p>
      </div>
    );
  }

  return (
    <StreamPlayer user={user} stream={user.stream} isFollowing={isFollowing} />
  );
};

export default UserPage;
