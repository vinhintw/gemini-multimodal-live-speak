import { forwardRef } from "react";
import { AspectRatio } from "./ui/aspect-ratio";

interface VideoPreviewProps {
  isWebcamActive: boolean;
  connectionStatus: "disconnected" | "connecting" | "connected";
}

export const VideoPreview = forwardRef<HTMLVideoElement, VideoPreviewProps>(
  ({ isWebcamActive, connectionStatus }, ref) => {
    if (connectionStatus === "disconnected") {
      return null;
    }

    return (
      <AspectRatio ratio={3 / 4} className="bg-muted rounded-lg">
        <video
          ref={ref}
          autoPlay
          playsInline
          muted
          className={`w-full h-full mx-auto rounded-lg ${
            isWebcamActive ? "" : "hidden"
          }`}
        />
        {isWebcamActive && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
            Live
          </div>
        )}
      </AspectRatio>
    );
  }
);

VideoPreview.displayName = "VideoPreview";
