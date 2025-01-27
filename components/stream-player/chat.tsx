import { ChatFormSkeleton } from "./chat-form";
import { ChatHeaderSkeleton } from "./chat-header";
import { ChatListSkeleton } from "./chat-list";

export const ChatSkeleton = () => {
  return (
    <div className="flex flex-col border-l border-b pt-0 h-[calc(100vh-80px)] border-2">
      <ChatHeaderSkeleton />
      <ChatListSkeleton />
      <ChatFormSkeleton />
    </div>
  );
};
