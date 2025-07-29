"use client";

import { useRef, useEffect, useState } from "react";
import { useGeminiConnection } from "@/hooks/useGeminiConnection";
import { useMessages } from "@/hooks/useMessages";
import { useCameraPermissions } from "@/hooks/useCameraPermissions";
import { ConnectionHeader } from "@/components/ConnectionHeader";
import { VideoPreview } from "@/components/VideoPreview";
import { MessagesPanel } from "./MessagesPanel";

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
    sendTextWithImage,
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

  const handleConnect = () => connect(addMessage, videoRef);
  const handleDisconnect = () => disconnect(addMessage);

  const sendTextWithImageOnce = async () => {
    if (!isConnected) {
      addMessage({
        type: "error",
        content: "Please connect to Gemini API first",
      });
      return;
    }
    if (!isWebcamActive) {
      addMessage({
        type: "error",
        content: "Please start webcam first to capture image",
      });
      return;
    }
    const hardcodedText = "方向指引或者障礙物偵測";
    await sendTextWithImage(hardcodedText);
  };

  const handleToggleAutoSend = () => {
    if (isAutoSending) {
      stopAutoSend();
    } else {
      setIsAutoSending(true);
      sendTextWithImageOnce();
      autoSendIntervalRef.current = setInterval(() => {
        sendTextWithImageOnce();
      }, 10000);
    }
  };

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

      {/* Send Text Message Buttons */}
      <div className="mt-4 flex justify-center gap-4">
        <button
          onClick={handleToggleAutoSend}
          disabled={!isConnected || !isWebcamActive}
          className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
            isConnected && isWebcamActive
              ? isAutoSending
                ? "bg-red-600 hover:bg-red-700 active:bg-red-800"
                : "bg-green-600 hover:bg-green-700 active:bg-green-800"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {isAutoSending ? "⏹ 停止自動偵測" : "▶️ 開始自動偵測"}
        </button>
      </div>
      {/* Video Preview */}
      <VideoPreview
        ref={videoRef}
        isWebcamActive={isWebcamActive}
        connectionStatus={connectionStatus}
      />

      {/* Messages Panel */}
      <MessagesPanel messages={messages} />
    </div>
  );
}
