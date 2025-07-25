"use client";

import { useMemo, useState } from "react";
import { useDebounce } from "usehooks-ts";
import { useParticipants } from "@livekit/components-react";
import { LocalParticipant, RemoteParticipant } from "livekit-client";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

import { CommunityItem } from "./community-item";

interface ChatCommunityProps {
  hostName: string;
  viewerName: string;
  isHidden: boolean;
}

export const ChatCommunity = ({
  hostName,
  viewerName,
  isHidden,
}: ChatCommunityProps) => {
  const [value, setValue] = useState("");
  const debouncedValue = useDebounce<string>(value, 500);

  const participants = useParticipants();

  const onChange = (newValue: string) => {
    setValue(newValue);
  };

  const filteredParticipants = useMemo(() => {
    // Create a map to store unique participants by their normalized identity
    const uniqueParticipants = new Map<
      string,
      RemoteParticipant | LocalParticipant
    >();

    participants.forEach((participant) => {
      // Normalize the identity by removing host- or viewer- prefix
      const normalizedIdentity = participant.identity.replace(
        /^(host-|viewer-)/,
        ""
      );

      // Only add if we haven't seen this identity before
      if (!uniqueParticipants.has(normalizedIdentity)) {
        uniqueParticipants.set(normalizedIdentity, participant);
      }
    });

    // Convert map values to array and filter by search
    return Array.from(uniqueParticipants.values()).filter((participant) => {
      return participant.name
        ?.toLowerCase()
        .includes(debouncedValue.toLowerCase());
    });
  }, [participants, debouncedValue]);

  if (isHidden) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Community is disabled</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Input
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search community"
        className="border-white/10"
      />
      <ScrollArea className="gap-y-2 mt-4">
        <p className="text-center text-sm text-muted-foreground hidden last:block p-2">
          No results
        </p>
        {filteredParticipants.map((participant) => (
          <CommunityItem
            key={participant.identity}
            hostName={hostName}
            viewerName={viewerName}
            participantName={participant.name}
            participantIdentity={participant.identity}
          />
        ))}
      </ScrollArea>
    </div>
  );
};
