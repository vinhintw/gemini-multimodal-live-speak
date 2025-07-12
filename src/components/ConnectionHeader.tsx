import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Video, VideoOff, Phone, PhoneOff } from "lucide-react";
import { getStatusColor } from "@/lib/utils";

interface ConnectionHeaderProps {
  isConnected: boolean;
  isRecording: boolean;
  isWebcamActive: boolean;
  connectionStatus: "disconnected" | "connecting" | "connected";
  onConnect: () => void;
  onDisconnect: () => void;
  onToggleRecording: () => void;
  onToggleWebcam: () => void;
}

export const ConnectionHeader: React.FC<ConnectionHeaderProps> = ({
  isConnected,
  isRecording,
  isWebcamActive,
  connectionStatus,
  onConnect,
  onDisconnect,
  onToggleRecording,
  onToggleWebcam,
}) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${getStatusColor(
                connectionStatus
              )}`}
            ></div>
            <Badge variant={isConnected ? "default" : "secondary"}>
              {connectionStatus}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Connection Controls */}
        <div className="flex gap-2 mb-4">
          {!isConnected ? (
            <Button
              onClick={onConnect}
              disabled={connectionStatus === "connecting"}
            >
              <Phone className="w-4 h-4 mr-2" />
              {connectionStatus === "connecting" ? "Connecting..." : "Connect"}
            </Button>
          ) : (
            <Button onClick={onDisconnect} variant="destructive">
              <PhoneOff className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          )}
        </div>

        {/* Media Controls */}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={onToggleRecording}
            disabled={!isConnected}
            variant={isRecording ? "destructive" : "default"}
          >
            {isRecording ? (
              <MicOff className="w-4 h-4 mr-2" />
            ) : (
              <Mic className="w-4 h-4 mr-2" />
            )}
            {isRecording ? "Stop Recording" : "Start Recording"}
          </Button>

          <Button
            onClick={onToggleWebcam}
            disabled={!isConnected}
            variant={isWebcamActive ? "destructive" : "outline"}
          >
            {isWebcamActive ? (
              <VideoOff className="w-4 h-4 mr-2" />
            ) : (
              <Video className="w-4 h-4 mr-2" />
            )}
            Webcam
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
