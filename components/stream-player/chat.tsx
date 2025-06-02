"use client";

import { useEffect, useMemo, useState } from "react";
import { ConnectionState } from "livekit-client";
import { useMediaQuery } from "usehooks-ts";
import {
  useChat,
  useConnectionState,
  useRemoteParticipant,
} from "@livekit/components-react";

import { ChatVariant, useChatSidebar } from "@/store/use-chat-sidebar";
import { getSelf } from "@/lib/auth-service";
import { db } from "@/lib/db";

import { ChatForm, ChatFormSkeleton } from "./chat-form";
import { ChatList, ChatListSkeleton } from "./chat-list";
import { ChatHeader, ChatHeaderSkeleton } from "./chat-header";
import { ChatCommunity } from "./chat-community";

interface ChatProps {
  hostName: string;
  hostIdentity: string;
  viewerName: string;
  isFollowing: boolean;
  isChatEnabled: boolean;
  isChatDelayed: boolean;
  isChatFollowersOnly: boolean;
}

export const Chat = ({
  hostName,
  hostIdentity,
  viewerName,
  isFollowing,
  isChatEnabled,
  isChatDelayed,
  isChatFollowersOnly,
}: ChatProps) => {
  const matches = useMediaQuery("(max-width: 1024px)");
  const { variant, onExpand } = useChatSidebar((state) => state);
  const connectionState = useConnectionState();
  const participant = useRemoteParticipant(hostIdentity);
  const [isBlocked, setIsBlocked] = useState(false);

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

        setIsBlocked(!!(blockedBySelf || blockedByHost));
      } catch {
        setIsBlocked(false);
      }
    };

    checkBlocked();
    const interval = setInterval(checkBlocked, 1000); // Check more frequently
    return () => clearInterval(interval);
  }, [hostIdentity]);

  const isOnline = participant && connectionState === ConnectionState.Connected;

  const isHidden = !isChatEnabled || !isOnline || isBlocked;

  const [value, setValue] = useState("");
  const { chatMessages: messages, send } = useChat();

  useEffect(() => {
    if (matches) {
      onExpand();
    }
  }, [matches, onExpand]);

  const reversedMessages = useMemo(() => {
    return messages.sort((a, b) => b.timestamp - a.timestamp);
  }, [messages]);

  const onSubmit = () => {
    if (!send) return;

    send(value);
    setValue("");
  };

  const onChange = (value: string) => {
    setValue(value);
  };

  return (
    <div className="flex flex-col bg-background border-l border-b pt-0 h-[calc(100vh-80px)]">
      <ChatHeader />
      {variant === ChatVariant.CHAT && (
        <>
          <ChatList messages={reversedMessages} isHidden={isHidden} />
          <ChatForm
            onSubmit={onSubmit}
            value={value}
            onChange={onChange}
            isHidden={isHidden}
            isFollowersOnly={isChatFollowersOnly}
            isDelayed={isChatDelayed}
            isFollowing={isFollowing}
          />
        </>
      )}
      {variant === ChatVariant.COMMUNITY && (
        <ChatCommunity
          viewerName={viewerName}
          hostName={hostName}
          isHidden={isHidden}
        />
      )}
    </div>
  );
};

export const ChatSkeleton = () => {
  return (
    <div className="flex flex-col border-l border-b pt-0 h-[calc(100vh-80px)] border-2">
      <ChatHeaderSkeleton />
      <ChatListSkeleton />
      <ChatFormSkeleton />
    </div>
  );
};
