import { forwardRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Video } from "lucide-react";

interface VideoPreviewProps {
  isWebcamActive: boolean;
  connectionStatus: "disconnected" | "connecting" | "connected";
}

export const VideoPreview = forwardRef<HTMLVideoElement, VideoPreviewProps>(
  ({ isWebcamActive, connectionStatus }, ref) => {
    if (!(isWebcamActive || connectionStatus === "connected")) {
      return null;
    }

    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <video
              ref={ref}
              autoPlay
              playsInline
              muted
              className={`w-full max-w-md mx-auto rounded-lg ${
                isWebcamActive ? "" : "hidden"
              }`}
              style={{ maxHeight: "400px" }}
            />
            {!isWebcamActive && (
              <div className="text-center text-muted-foreground p-8">
                <Video className="w-12 h-12 mx-auto mb-2" />
                <p>Webcam preview will appear here</p>
                <p className="text-xs mt-2">
                  Connect to API and click "Webcam" to start
                </p>
              </div>
            )}
            {isWebcamActive && (
              <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                Live
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

VideoPreview.displayName = "VideoPreview";
