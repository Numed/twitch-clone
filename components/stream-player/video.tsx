"use client";

import { useEffect, useState } from "react";
import { ConnectionState, Track } from "livekit-client";
import {
  useConnectionState,
  useRemoteParticipant,
  useTracks,
} from "@livekit/components-react";

import { Skeleton } from "@/components/ui/skeleton";
import { useBlockStore } from "@/store/use-block-store";
import { useRouter } from "next/navigation";

import { OfflineVideo } from "./offline-video";
import { LoadingVideo } from "./loading-video";
import { LiveVideo } from "./live-video";
import { getSelf } from "@/lib/auth-service";
import { db } from "@/lib/db";

interface VideoProps {
  hostName: string;
  hostIdentity: string;
}

export const Video = ({ hostName, hostIdentity }: VideoProps) => {
  const connectionState = useConnectionState();
  const participant = useRemoteParticipant(hostIdentity);
  const [isBlocked, setIsBlocked] = useState(false);
  const router = useRouter();
  const { isUserBlocked, addBlockedUser } = useBlockStore();
  const tracks = useTracks([
    Track.Source.Camera,
    Track.Source.Microphone,
  ]).filter((track) => track.participant.identity === hostIdentity);

  useEffect(() => {
    const checkBlocked = async () => {
      try {
        const self = await getSelf();

        // Check if we have blocked the host
        const blockedBySelf = await db.block.findUnique({
          where: {
            blockerId_blockedId: {
              blockerId: self.id,
              blockedId: hostIdentity,
            },
          },
        });

        // Check if the host has blocked us
        const blockedByHost = await db.block.findUnique({
          where: {
            blockerId_blockedId: {
              blockerId: hostIdentity,
              blockedId: self.id,
            },
          },
        });

        const isBlockedNow = !!(blockedBySelf || blockedByHost);

        if (isBlockedNow) {
          setIsBlocked(true);
          addBlockedUser(hostIdentity);
          // Force reload the page
          window.location.href = "/";
        }
      } catch {
        setIsBlocked(false);
      }
    };

    checkBlocked();
    const interval = setInterval(checkBlocked, 1000); // Check more frequently
    return () => clearInterval(interval);
  }, [hostIdentity, addBlockedUser]);

  let content;

  if (isBlocked || isUserBlocked(hostIdentity)) {
    content = <OfflineVideo username={hostName} />;
  } else if (!participant && connectionState === ConnectionState.Connected) {
    content = <OfflineVideo username={hostName} />;
  } else if (!participant || tracks.length === 0) {
    content = <LoadingVideo label={connectionState} />;
  } else {
    content = <LiveVideo participant={participant} />;
  }

  return <div className="aspect-video border-b group relative">{content}</div>;
};

export const VideoSkeleton = () => {
  return (
    <div className="aspect-video border-x border-background">
      <Skeleton className="h-full w-full rounded-none" />
    </div>
  );
};
