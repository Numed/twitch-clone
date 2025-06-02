"use client";

import { toast } from "sonner";
import { useTransition, useState, useEffect } from "react";
import { MinusCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { Hint } from "@/components/hint";
import { onBlock } from "@/actions/block";
import { cn, stringToColor } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getSelf } from "@/lib/auth-service";
import { db } from "@/lib/db";

interface CommunityItemProps {
  hostName: string;
  viewerName: string;
  participantName?: string;
  participantIdentity: string;
}

export const CommunityItem = ({
  hostName,
  viewerName,
  participantIdentity,
  participantName,
}: CommunityItemProps) => {
  const [isPending, startTransition] = useTransition();
  const [isBlocked, setIsBlocked] = useState(false);
  const router = useRouter();

  // Remove viewer- or host- prefix from identity
  const normalizedIdentity = participantIdentity.replace(
    /^(viewer-|host-)/,
    ""
  );

  useEffect(() => {
    const checkBlocked = async () => {
      try {
        const self = await getSelf();
        // Check both directions of blocking
        const blockedBySelf = await db.block.findUnique({
          where: {
            blockerId_blockedId: {
              blockerId: self.id,
              blockedId: normalizedIdentity,
            },
          },
        });

        const blockedByOther = await db.block.findUnique({
          where: {
            blockerId_blockedId: {
              blockerId: normalizedIdentity,
              blockedId: self.id,
            },
          },
        });

        setIsBlocked(!!(blockedBySelf || blockedByOther));
      } catch (error) {
        console.error("Error checking block status:", error);
        setIsBlocked(false);
      }
    };

    checkBlocked();
    const interval = setInterval(checkBlocked, 1000);
    return () => clearInterval(interval);
  }, [normalizedIdentity]);

  const color = stringToColor(participantName || "");
  const isSelf =
    participantName === viewerName || normalizedIdentity === viewerName;
  const isHost = viewerName === hostName;

  const handleBlock = () => {
    if (!participantName || isSelf || !isHost) return;

    startTransition(() => {
      onBlock(normalizedIdentity)
        .then(() => {
          toast.success(`Blocked ${participantName}`);
          setIsBlocked(true);
          // Force a hard refresh to ensure complete disconnection
          window.location.reload();
        })
        .catch((error) => {
          console.error("Block error:", error);
          toast.error(error.message || "Failed to block user");
        });
    });
  };

  if (isBlocked) {
    return null;
  }

  return (
    <div
      className={cn(
        "group flex items-center justify-between w-full p-2 rounded-md text-sm hover:bg-white/5",
        isPending && "opacity-50 pointer-events-none"
      )}
    >
      <p style={{ color: color }}>{participantName}</p>
      {isHost && !isSelf && (
        <Hint label="Block">
          <Button
            variant="ghost"
            disabled={isPending}
            onClick={handleBlock}
            className="h-auto w-auto p-1 opacity-0 group-hover:opacity-100 transition"
          >
            <MinusCircle className="h-4 w-4 text-muted-foreground" />
          </Button>
        </Hint>
      )}
    </div>
  );
};
