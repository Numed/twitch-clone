"use client";

import { Stream, User } from "@prisma/client";
import { LiveKitRoom, useDataChannel } from "@livekit/components-react";
import { cn } from "@/lib/utils";
import { useChatSidebar } from "@/store/use-chat-sidebar";
import { useViewerToken } from "@/hooks/use-viewer-token";
import { InfoCard } from "./info-card";
import { AboutCard } from "./about-card";
import { ChatToggle } from "./chat-toggle";
import { Chat, ChatSkeleton } from "./chat";
import { Video, VideoSkeleton } from "./video";
import { Header, HeaderSkeleton } from "./header";
import { useState, useEffect } from "react";
import { isBlockedByUser } from "@/actions/block";
import { useRouter } from "next/navigation";
import { useBlockStore } from "@/store/use-block-store";
import { toast } from "sonner";

type CustomStream = {
  id: string;
  isChatEnabled: boolean;
  isChatDelayed: boolean;
  isChatFollowersOnly: boolean;
  isLive: boolean;
  thumbnail: string | null;
  title: string;
};

type CustomUser = {
  id: string;
  username: string;
  bio: string | null;
  stream: CustomStream | null;
  imageUrl: string;
  _count: { followedBy: number };
};

interface StreamPlayerProps {
  user: CustomUser;
  stream: CustomStream;
  isFollowing: boolean;
}

const StreamContent = ({
  user,
  stream,
  isFollowing,
  token,
  name,
  identity,
}: StreamPlayerProps & {
  token: string;
  name: string;
  identity: string;
}) => {
  const { collapsed } = useChatSidebar((state) => state);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { isUserBlocked, addBlockedUser } = useBlockStore();

  // Handle LiveKit data messages
  const { message } = useDataChannel();

  useEffect(() => {
    if (!message) return;

    try {
      const data = JSON.parse(new TextDecoder().decode(message.payload));
      if (data.type === "block" && data.blockedUser === identity) {
        toast.error(data.message);
        setIsBlocked(true);
        addBlockedUser(user.id);
        // Force reload the page
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error parsing data message:", error);
    }
  }, [message, identity, user.id, addBlockedUser]);

  useEffect(() => {
    const checkBlocked = async () => {
      try {
        if (isUserBlocked(user.id)) {
          setIsBlocked(true);
          window.location.href = "/";
          return;
        }

        const blocked = await isBlockedByUser(user.id);
        if (blocked) {
          addBlockedUser(user.id);
          setIsBlocked(true);
          window.location.href = "/";
        }
      } catch (error) {
        console.error("Error checking block status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkBlocked();
    const interval = setInterval(checkBlocked, 1000);
    return () => clearInterval(interval);
  }, [user.id, isUserBlocked, addBlockedUser]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (isBlocked || isUserBlocked(user.id)) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg text-muted-foreground">
          You are blocked from viewing this stream
        </p>
      </div>
    );
  }

  return (
    <>
      {collapsed && (
        <div className="hidden lg:block fixed top-[100px] right-2 z-50">
          <ChatToggle />
        </div>
      )}
      <div
        className={cn(
          "grid grid-cols-1 lg:gap-y-0 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 h-full",
          collapsed && "lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2"
        )}
        style={{ height: "100%" }}
      >
        <div className="space-y-4 col-span-1 lg:col-span-2 xl:col-span-2 2xl:col-span-5 lg:overflow-y-auto hidden-scrollbar pb-10">
          <Video hostName={user.username} hostIdentity={user.id} />
          <Header
            hostName={user.username}
            hostIdentity={user.id}
            viewerIdentity={identity}
            imageUrl={user.imageUrl}
            isFollowing={isFollowing}
            name={stream.title}
          />
          <InfoCard
            hostIdentity={user.id}
            viewerIdentity={identity}
            name={stream.title}
            thumbnailUrl={stream.thumbnail}
          />
          <AboutCard
            hostName={user.username}
            hostIdentity={user.id}
            viewerIdentity={identity}
            bio={user.bio}
            followedByCount={user._count.followedBy}
          />
        </div>
        <div className={cn("col-span-1", collapsed && "hidden")}>
          <Chat
            viewerName={name}
            hostName={user.username}
            hostIdentity={user.id}
            isFollowing={isFollowing}
            isChatEnabled={stream.isChatEnabled}
            isChatDelayed={stream.isChatDelayed}
            isChatFollowersOnly={stream.isChatFollowersOnly}
          />
        </div>
      </div>
    </>
  );
};

export const StreamPlayer = ({
  user,
  stream,
  isFollowing,
}: StreamPlayerProps) => {
  const { token, name, identity } = useViewerToken(user.id);

  if (!token || !name || !identity) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg text-muted-foreground">
          {token === null
            ? "You are blocked from viewing this stream"
            : "Loading..."}
        </p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_WS_URL!}
      className="h-full"
    >
      <StreamContent
        user={user}
        stream={stream}
        isFollowing={isFollowing}
        token={token}
        name={name}
        identity={identity}
      />
    </LiveKitRoom>
  );
};

export const StreamPlayerSkeleton = () => {
  return (
    <div className="grid grid-cols-1 lg:gap-y-0 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 h-full">
      <div className="space-y-4 col-span-1 lg:col-span-2 xl:col-span-2 2xl:col-span-5 lg:overflow-y-auto hidden-scrollbar pb-10">
        <VideoSkeleton />
        <HeaderSkeleton />
      </div>
      <div className="col-span-1 bg-background">
        <ChatSkeleton />
      </div>
    </div>
  );
};
