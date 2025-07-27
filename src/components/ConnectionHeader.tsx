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
}

export const ConnectionHeader: React.FC<ConnectionHeaderProps> = ({
  isConnected,
  connectionStatus,
  onConnect,
  onDisconnect,
}) => {
  return (
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
  );
};
