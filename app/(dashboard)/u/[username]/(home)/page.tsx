import { currentUser } from "@clerk/nextjs";

import { getUserByUsername } from "@/lib/user-service";
import { StreamPlayer } from "@/components/stream-player";

interface CreatorPageProps {
  params: {
    username: string;
  };
}

const CreatorPage = async ({ params }: CreatorPageProps) => {
  const externalUser = await currentUser();
  const user = await getUserByUsername(params.username);

  if (!user || user.externalUserId !== externalUser?.id) {
    throw new Error("Unauthorized");
  }

  if (!user.stream) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-lg text-muted-foreground">
          Stream not found. Please set up your stream first.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <StreamPlayer user={user} stream={user.stream} isFollowing />
    </div>
  );
};

export default CreatorPage;
