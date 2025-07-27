import { useState, useRef, useCallback } from "react";
import { GeminiLiveAPI } from "@/lib/gemini-live-api";
import { AudioRecorder } from "@/lib/audio-recorder";
import { MediaHandler } from "@/lib/media-handler";
import { Message, setupModel } from "@/lib/setup-model";
import { endpoint, GEMINI_API_KEY } from "@/lib/ai-config";
import {
  navigationAssistantPrompt,
  walkingFunctionDeclarations,
} from "@/lib/aiprompt";
import { sendObstacleAlert, sendNavigationGuidance } from "@/lib/api-tools";

export const useGeminiConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [initialized, setInitialized] = useState(false);

  // API and media handlers
  const geminiAPIRef = useRef<GeminiLiveAPI | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const mediaHandlerRef = useRef<MediaHandler | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const ensureAudioInitialized = useCallback(async () => {
    if (!initialized) {
      console.log("Initializing audio context...");
      try {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        await audioContextRef.current.resume();
        setInitialized(true);
      } catch (error) {
        console.error("Failed to initialize audio:", error);
        throw error;
      }
    }
  }, [initialized]);

  const setupGeminiHandlers = useCallback(
    (
      api: GeminiLiveAPI,
      addMessage: (message: Omit<Message, "id" | "timestamp">) => void
    ) => {
      api.onSetupComplete = () => {
        setConnectionStatus("connected");
        setIsConnected(true);
        addMessage({
          type: "assistant",
          content: "Connected! You can start talking now.",
        });
      };

      api.onAudioData = async (audioData: string) => {};

      api.onInterrupted = () => {
        if (geminiAPIRef.current) {
          geminiAPIRef.current.stopCurrentAudio();
          console.log("🔇 Audio stopped due to interruption");
        }
        addMessage({
          type: "assistant",
          content: "Interrupted",
        });
      };

      api.onTurnComplete = () => {
        addMessage({
          type: "assistant",
          content: "Finished speaking",
        });
      };

      api.onError = (message: string) => {
        addMessage({
          type: "error",
          content: message,
        });
      };

      api.onClose = () => {
        setConnectionStatus("disconnected");
        setIsConnected(false);
        addMessage({
          type: "error",
          content: "Connection closed",
        });
      };

      api.onToolCall = async (toolCall: any) => {
        const functionCalls = toolCall.functionCalls;
        const functionResponses = [];

        for (const call of functionCalls) {
          addMessage({
            type: "function",
            content: `Function: ${call.name}`,
            functionName: call.name,
            functionParams: call.args,
          });
          if (window.ReactNativeWebView) {
            const message = {
              type: "WALKING_FUNCTION_CALL",
              data: {
                name: call.name,
                args: call.args,
                id: call.id,
              },
            };
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
          }

          if (call.name === "send_obstacle_alert") {
            sendObstacleAlert(call.args);
            addMessage({
              type: "function",
              content: `🚨 障礙物警報: ${call.args.type} (${call.args.severity}) - ${call.args.action}`,
              functionName: call.name,
              functionParams: call.args,
            });
            functionResponses.push({
              id: call.id,
              name: call.name,
              response: {
                result: {
                  object_value: { status: "alert_sent", ...call.args },
                },
              },
            });
          } else if (call.name === "send_navigation_guidance") {
            sendNavigationGuidance(call.args);
            addMessage({
              type: "function",
              content: `🧭 導航指引: ${call.args.instruction}`,
              functionName: call.name,
              functionParams: call.args,
            });
            functionResponses.push({
              id: call.id,
              name: call.name,
              response: {
                result: {
                  object_value: { status: "navigation_sent", ...call.args },
                },
              },
            });
          }
        }

        api.sendToolResponse(functionResponses);
      };
    },
    []
  );

  const connect = useCallback(
    async (
      addMessage: (message: Omit<Message, "id" | "timestamp">) => void,
      videoRef: React.RefObject<HTMLVideoElement>
    ) => {
      if (!GEMINI_API_KEY) {
        addMessage({
          type: "error",
          content:
            "Please set NEXT_PUBLIC_GEMINI_API_KEY in your environment variables",
        });
        return;
      }

      setConnectionStatus("connecting");

      try {
        await ensureAudioInitialized();
        const api = new GeminiLiveAPI(endpoint, false);
        geminiAPIRef.current = api;
        await api.initializeAudioContext();
        setupGeminiHandlers(api, addMessage);

        const setupMessage = setupModel({
          voice_name: "Puck",
          system_instruction: navigationAssistantPrompt,
          functionDeclarations: walkingFunctionDeclarations,
        });

        api.sendSetupMessage(setupMessage);

        // Automatically start recording
        if (!isRecording) {
          try {
            await ensureAudioInitialized();
            audioRecorderRef.current = new AudioRecorder();
            await audioRecorderRef.current.start();

            audioRecorderRef.current.on("data", (base64Data: string) => {
              if (geminiAPIRef.current) {
                geminiAPIRef.current.sendAudioChunk(base64Data);
              } else {
                console.error("❌ No Gemini API available to send audio!");
              }
            });

            setIsRecording(true);
            addMessage({
              type: "user",
              content: "Recording started...",
            });
          } catch (error) {
            addMessage({
              type: "error",
              content: `Recording failed: ${(error as Error).message}`,
            });
          }
        }

        // Automatically start webcam
        if (!isWebcamActive) {
          if (!mediaHandlerRef.current) {
            if (videoRef.current) {
              try {
                const handler = new MediaHandler();
                handler.initialize(videoRef.current);
                mediaHandlerRef.current = handler;
              } catch (error) {
                console.error("Failed to re-initialize MediaHandler:", error);
                addMessage({
                  type: "error",
                  content: "Failed to initialize media handler",
                });
                return;
              }
            } else {
              addMessage({
                type: "error",
                content: "Video element not ready. Please try again.",
              });
              return;
            }
          }

          try {
            addMessage({
              type: "user",
              content: "Starting webcam...",
            });

            const success = await mediaHandlerRef.current.startWebcam();
            if (success) {
              setIsWebcamActive(true);
              addMessage({
                type: "user",
                content: "Webcam started successfully",
              });

              mediaHandlerRef.current.startFrameCapture((base64Image) => {
                if (geminiAPIRef.current?.ws.readyState === WebSocket.OPEN) {
                  const message = {
                    realtimeInput: {
                      mediaChunks: [
                        {
                          mime_type: "image/jpeg",
                          data: base64Image,
                        },
                      ],
                    },
                  };
                  geminiAPIRef.current.ws.send(JSON.stringify(message));
                }
              });
            } else {
              addMessage({
                type: "error",
                content:
                  "Failed to start webcam. Please check permissions and try again.",
              });
            }
          } catch (error) {
            addMessage({
              type: "error",
              content: `Webcam error: ${(error as Error).message}`,
            });
          }
        }
      } catch (error) {
        setConnectionStatus("disconnected");
        addMessage({
          type: "error",
          content: `Connection failed: ${(error as Error).message}`,
        });
      }
    },
    [ensureAudioInitialized, setupGeminiHandlers, isRecording, isWebcamActive]
  );

  const disconnect = useCallback(
    (addMessage: (message: Omit<Message, "id" | "timestamp">) => void) => {
      if (geminiAPIRef.current) {
        geminiAPIRef.current.stopCurrentAudio();
        geminiAPIRef.current.close();
        geminiAPIRef.current = null;
      }
      if (audioRecorderRef.current) {
        audioRecorderRef.current.stop();
        audioRecorderRef.current = null;
      }
      if (mediaHandlerRef.current) {
        mediaHandlerRef.current.stopAll();
      }
      setIsRecording(false);
      setIsConnected(false);
      setIsWebcamActive(false);
      setConnectionStatus("disconnected");
      addMessage({
        type: "assistant",
        content: "Disconnected",
      });
    },
    []
  );

  const toggleRecording = useCallback(
    async (
      addMessage: (message: Omit<Message, "id" | "timestamp">) => void
    ) => {
      if (!isConnected || !geminiAPIRef.current) {
        addMessage({
          type: "error",
          content: "Please connect first",
        });
        return;
      }

      if (isRecording) {
        if (audioRecorderRef.current) {
          audioRecorderRef.current.stop();
          audioRecorderRef.current = null;
        }
        geminiAPIRef.current.sendEndMessage();
        setIsRecording(false);
        addMessage({
          type: "user",
          content: "Recording stopped",
        });
      } else {
        try {
          await ensureAudioInitialized();
          audioRecorderRef.current = new AudioRecorder();
          await audioRecorderRef.current.start();

          audioRecorderRef.current.on("data", (base64Data: string) => {
            if (geminiAPIRef.current) {
              geminiAPIRef.current.sendAudioChunk(base64Data);
            } else {
              console.error("❌ No Gemini API available to send audio!");
            }
          });

          setIsRecording(true);
          addMessage({
            type: "user",
            content: "Recording started...",
          });
        } catch (error) {
          addMessage({
            type: "error",
            content: `Recording failed: ${(error as Error).message}`,
          });
        }
      }
    },
    [isConnected, isRecording, ensureAudioInitialized]
  );

  const toggleWebcam = useCallback(
    async (
      videoRef: React.RefObject<HTMLVideoElement>,
      addMessage: (message: Omit<Message, "id" | "timestamp">) => void
    ) => {
      console.log(
        "toggleWebcam called, mediaHandlerRef:",
        mediaHandlerRef.current
      );

      if (!mediaHandlerRef.current) {
        if (videoRef.current) {
          try {
            const handler = new MediaHandler();
            handler.initialize(videoRef.current);
            mediaHandlerRef.current = handler;
            console.log("MediaHandler re-initialized");
          } catch (error) {
            console.error("Failed to re-initialize MediaHandler:", error);
            addMessage({
              type: "error",
              content: "Failed to initialize media handler",
            });
            return;
          }
        } else {
          addMessage({
            type: "error",
            content: "Video element not ready. Please try again.",
          });
          return;
        }
      }

      if (!isConnected) {
        addMessage({
          type: "error",
          content: "Please connect to Gemini API first",
        });
        return;
      }

      if (isWebcamActive) {
        mediaHandlerRef.current.stopAll();
        setIsWebcamActive(false);
        addMessage({
          type: "user",
          content: "Webcam stopped",
        });
      } else {
        try {
          addMessage({
            type: "user",
            content: "Starting webcam...",
          });

          const success = await mediaHandlerRef.current.startWebcam();
          if (success) {
            setIsWebcamActive(true);
            addMessage({
              type: "user",
              content: "Webcam started successfully",
            });

            mediaHandlerRef.current.startFrameCapture((base64Image) => {
              if (geminiAPIRef.current?.ws.readyState === WebSocket.OPEN) {
                const message = {
                  realtimeInput: {
                    mediaChunks: [
                      {
                        mime_type: "image/jpeg",
                        data: base64Image,
                      },
                    ],
                  },
                };
                geminiAPIRef.current.ws.send(JSON.stringify(message));
              }
            });
          } else {
            addMessage({
              type: "error",
              content:
                "Failed to start webcam. Please check permissions and try again.",
            });
          }
        } catch (error) {
          addMessage({
            type: "error",
            content: `Webcam error: ${(error as Error).message}`,
          });
        }
      }
    },
    [isConnected, isWebcamActive]
  );

  const initializeMediaHandler = useCallback(
    (videoRef: React.RefObject<HTMLVideoElement>) => {
      if (videoRef.current) {
        try {
          const handler = new MediaHandler();
          handler.initialize(videoRef.current);
          mediaHandlerRef.current = handler;
          console.log("MediaHandler initialized successfully");
        } catch (error) {
          console.error("Failed to initialize MediaHandler:", error);
        }
      }
    },
    []
  );

  return {
    // States
    isConnected,
    isRecording,
    isWebcamActive,
    connectionStatus,

    // Actions
    connect,
    disconnect,
    toggleRecording,
    toggleWebcam,
    initializeMediaHandler,
  };
};

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
    toggleCall?: () => Promise<void>;
  }
}
