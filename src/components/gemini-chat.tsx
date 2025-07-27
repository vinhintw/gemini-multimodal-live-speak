"use client";

import { useRef, useEffect, useState } from "react";
import { useGeminiConnection } from "@/hooks/useGeminiConnection";
import { useMessages } from "@/hooks/useMessages";
import { useCameraPermissions } from "@/hooks/useCameraPermissions";
import { ConnectionHeader } from "@/components/ConnectionHeader";
import { VideoPreview } from "@/components/VideoPreview";

export default function GeminiChat() {
  const videoRef = useRef<HTMLVideoElement>(
    null
  ) as React.RefObject<HTMLVideoElement>;
  const [isAutoSending, setIsAutoSending] = useState(false);
  const autoSendIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Custom hooks
  const { messages, addMessage } = useMessages();
  const { checkCameraPermissions } = useCameraPermissions();
  const {
    isConnected,
    isRecording,
    isWebcamActive,
    connectionStatus,
    connect,
    disconnect,
    initializeMediaHandler,
  } = useGeminiConnection();

  // Initialize media handler and check permissions
  useEffect(() => {
    initializeMediaHandler(videoRef);
    checkCameraPermissions(addMessage);
  }, [initializeMediaHandler, checkCameraPermissions, addMessage]);

  // Auto-send cleanup
  const stopAutoSend = () => {
    setIsAutoSending(false);
    if (autoSendIntervalRef.current) {
      clearInterval(autoSendIntervalRef.current);
      autoSendIntervalRef.current = null;
    }
  };

  // Cleanup interval on unmount or when connection is lost
  useEffect(() => {
    if (!isConnected && isAutoSending) {
      stopAutoSend();
    }
  }, [isConnected, isAutoSending]);

  useEffect(() => {
    return () => {
      if (autoSendIntervalRef.current) {
        clearInterval(autoSendIntervalRef.current);
      }
    };
  }, []);

  // Handler functions
  const handleConnect = () => connect(addMessage, videoRef);
  const handleDisconnect = () => disconnect(addMessage);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Connection Header */}
      <ConnectionHeader
        isConnected={isConnected}
        isRecording={isRecording}
        isWebcamActive={isWebcamActive}
        connectionStatus={connectionStatus}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />

      {/* Video Preview */}
      <VideoPreview
        ref={videoRef}
        isWebcamActive={isWebcamActive}
        connectionStatus={connectionStatus}
      />

      {/* Messages Panel */}
      {/* <MessagesPanel messages={messages} /> */}
    </div>
  );
}
