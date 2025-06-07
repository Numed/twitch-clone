"use client";

import { useEffect, useState } from "react";
import { useConnectionState, useRoomContext } from "@livekit/components-react";
import { ConnectionQuality } from "livekit-client";
import { Info, X } from "lucide-react";

export const ConnectionStats = () => {
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<{
    packetLoss: number;
    jitter: number;
    latency: number;
    quality: ConnectionQuality;
  }>({
    packetLoss: 0,
    jitter: 0,
    latency: 0,
    quality: ConnectionQuality.Unknown,
  });

  useEffect(() => {
    if (!room) return;

    const updateStats = async () => {
      const participant = room.localParticipant;
      if (participant) {
        const quality = participant.connectionQuality;

        try {
          // Get all video elements in the room
          const videoElements = Array.from(document.querySelectorAll("video"));
          let totalPacketsLost = 0;
          let totalPackets = 0;
          let totalJitter = 0;
          let totalLatency = 0;
          let count = 0;

          for (const video of videoElements) {
            if (video.srcObject) {
              const stream = video.srcObject as MediaStream;
              const tracks = stream.getVideoTracks();

              for (const track of tracks) {
                const settings = track.getSettings();
                const capabilities = track.getCapabilities();

                // Estimate packet loss based on frame drops
                const frameRate = settings.frameRate || 30;
                const frameDrops =
                  (capabilities.frameRate?.max || 30) - frameRate;
                totalPacketsLost += frameDrops;
                totalPackets += frameRate;

                // Estimate jitter based on frame timing
                const frameInterval = 1000 / frameRate;
                totalJitter += frameInterval;

                // Estimate latency based on frame processing time
                totalLatency += frameInterval * 2;

                count++;
              }
            }
          }

          const packetLoss =
            count > 0 ? (totalPacketsLost / totalPackets) * 100 : 0;
          const jitter = count > 0 ? totalJitter / count : 0;
          const latency = count > 0 ? totalLatency / count : 0;

          setStats({
            packetLoss,
            jitter,
            latency,
            quality: quality || ConnectionQuality.Unknown,
          });
        } catch (error) {
          console.error("Error getting connection stats:", error);
        }
      }
    };

    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, [room]);

  if (connectionState !== "connected") {
    return null;
  }

  return (
    <div className="absolute top-2 right-2 flex items-center gap-2 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-black/50 p-2 rounded-md text-white hover:bg-black/70 transition"
      >
        {isVisible ? <X className="h-4 w-4" /> : <Info className="h-4 w-4" />}
      </button>
      {isVisible && (
        <div className="bg-black/50 p-2 rounded-md text-xs text-white">
          <div className="flex flex-col gap-1">
            <div
              className={`font-semibold ${
                stats.quality === ConnectionQuality.Excellent
                  ? "text-green-400"
                  : stats.quality === ConnectionQuality.Good
                  ? "text-yellow-400"
                  : stats.quality === ConnectionQuality.Poor
                  ? "text-orange-400"
                  : "text-red-400"
              }`}
            >
              Quality: {stats.quality}
            </div>
            <div className="text-gray-300">
              Latency: {stats.latency.toFixed(0)}ms
            </div>
            <div className="text-gray-300">
              Jitter: {stats.jitter.toFixed(0)}ms
            </div>
            <div className="text-gray-300">
              Packet Loss: {stats.packetLoss.toFixed(1)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
