'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  Phone,
  PhoneOff,
  Send,
} from 'lucide-react';

import { GeminiLiveAPI } from '@/lib/gemini-live-api';
import { AudioRecorder } from '@/lib/audio-recorder';
import { MediaHandler } from '@/lib/media-handler';
import { 
  getWeather, 
  getStockPrice, 
  sendObstacleAlert, 
  sendEnvironmentInfo, 
  readTextContent, 
  sendNavigationGuidance 
} from '@/lib/api-tools';
import { cameraWalkingPrompt, walkingFunctionDeclarations } from '@/lib/aiprompt';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'function' | 'error';
  content: string;
  timestamp: Date;
  functionName?: string;
  functionParams?: Record<string, any>;
  apiResponse?: any;
}

export default function GeminiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [textMessage, setTextMessage] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // API and media handlers
  const geminiAPIRef = useRef<GeminiLiveAPI | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const mediaHandlerRef = useRef<MediaHandler | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const [initialized, setInitialized] = useState(false);
  const messageCounterRef = useRef(0);

  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const endpoint = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;

  useEffect(() => {
    const initializeMediaHandler = () => {
      if (videoRef.current) {
        try {
          const handler = new MediaHandler();
          handler.initialize(videoRef.current);
          mediaHandlerRef.current = handler;
          console.log('MediaHandler initialized successfully');
        } catch (error) {
          console.error('Failed to initialize MediaHandler:', error);
        }
      }
    };
    
    initializeMediaHandler();
    
    // Check camera permissions on component mount
    checkCameraPermissions();
  }, []);

  const checkCameraPermissions = async () => {
    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        console.log('Camera permission status:', permission.state);
        
        if (permission.state === 'denied') {
          addMessage({
            type: 'error',
            content: 'Camera access is denied. Please enable camera permissions in your browser settings.'
          });
        }
      }
    } catch (error) {
      console.log('Could not check camera permissions:', error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    messageCounterRef.current += 1;
    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}-${messageCounterRef.current}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const ensureAudioInitialized = async () => {
    if (!initialized) {
      console.log('Initializing audio context...');
      try {
        // Use 24kHz for playback (as per Gemini spec)
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        console.log('Created AudioContext with sample rate:', audioContextRef.current.sampleRate);
        
        // Resume context if needed
        await audioContextRef.current.resume();
        console.log('Audio context state:', audioContextRef.current.state);
        
        setInitialized(true);
        console.log('Audio initialization complete');
      } catch (error) {
        console.error('Failed to initialize audio:', error);
        throw error;
      }
    }
  };


  const setupGeminiHandlers = (api: GeminiLiveAPI) => {
    api.onSetupComplete = () => {
      setConnectionStatus('connected');
      setIsConnected(true);
      addMessage({
        type: 'assistant',
        content: 'Connected! You can start talking now.'
      });
    };

    // Audio is now handled directly in GeminiLiveAPI class
    api.onAudioData = async (audioData: string) => {
      addMessage({
        type: 'assistant',
        content: '🔊 Gemini is speaking...'
      });
    };

    api.onInterrupted = () => {
      // Stop current audio playback when interrupted
      if (geminiAPIRef.current) {
        geminiAPIRef.current.stopCurrentAudio();
        console.log('🔇 Audio stopped due to interruption');
      }
      
      addMessage({
        type: 'assistant',
        content: 'Interrupted'
      });
    };

    api.onTurnComplete = () => {
      // Log audio status when turn completes
      if (geminiAPIRef.current) {
        const audioStatus = geminiAPIRef.current.getAudioStatus();
      }
      
      addMessage({
        type: 'assistant',
        content: 'Finished speaking'
      });
    };

    api.onError = (message: string) => {
      addMessage({
        type: 'error',
        content: message
      });
    };

    api.onClose = () => {
      setConnectionStatus('disconnected');
      setIsConnected(false);
      addMessage({
        type: 'error',
        content: 'Connection closed'
      });
    };

    api.onToolCall = async (toolCall: any) => {
      const functionCalls = toolCall.functionCalls;
      const functionResponses = [];

      for (const call of functionCalls) {
        addMessage({
          type: 'function',
          content: `Function: ${call.name}`,
          functionName: call.name,
          functionParams: call.args
        });

        if (call.name === 'get_weather') {
          const weather = await getWeather(call.args.city);
          
          addMessage({
            type: 'function',
            content: weather.error ? `API Error: ${weather.error}` : 
              `Weather in ${weather.city}: ${weather.temperature}°C, ${weather.description}`,
            apiResponse: weather
          });

          functionResponses.push({
            id: call.id,
            name: call.name,
            response: { result: { object_value: weather } }
          });
        } else if (call.name === 'get_stock_price') {
          const stockData = await getStockPrice(call.args.symbol);
          
          addMessage({
            type: 'function',
            content: stockData.error ? `API Error: ${stockData.error}` : 
              `${stockData.symbol}: $${stockData.currentPrice} (${stockData.change > 0 ? '+' : ''}${stockData.change})`,
            apiResponse: stockData
          });

          functionResponses.push({
            id: call.id,
            name: call.name,
            response: { result: { object_value: stockData } }
          });
        } else if (call.name === 'send_obstacle_alert') {
          sendObstacleAlert(call.args);
          
          addMessage({
            type: 'function',
            content: `🚨 障礙物警報: ${call.args.type} (${call.args.severity}) - ${call.args.action}`,
            functionName: call.name,
            functionParams: call.args
          });

          functionResponses.push({
            id: call.id,
            name: call.name,
            response: { result: { object_value: { status: 'alert_sent', ...call.args } } }
          });
        } else if (call.name === 'send_environment_info') {
          sendEnvironmentInfo(call.args);
          
          addMessage({
            type: 'function',
            content: `🌍 環境資訊: ${call.args.environment_type} - ${call.args.description}`,
            functionName: call.name,
            functionParams: call.args
          });

          functionResponses.push({
            id: call.id,
            name: call.name,
            response: { result: { object_value: { status: 'environment_info_sent', ...call.args } } }
          });
        } else if (call.name === 'read_text_content') {
          readTextContent(call.args);
          
          addMessage({
            type: 'function',
            content: `📖 文字內容: "${call.args.text_content}" (${call.args.text_type})`,
            functionName: call.name,
            functionParams: call.args
          });

          functionResponses.push({
            id: call.id,
            name: call.name,
            response: { result: { object_value: { status: 'text_read', ...call.args } } }
          });
        } else if (call.name === 'send_navigation_guidance') {
          sendNavigationGuidance(call.args);
          
          addMessage({
            type: 'function',
            content: `🧭 導航指引: ${call.args.instruction} (信心度: ${(call.args.confidence * 100).toFixed(1)}%)`,
            functionName: call.name,
            functionParams: call.args
          });

          functionResponses.push({
            id: call.id,
            name: call.name,
            response: { result: { object_value: { status: 'navigation_sent', ...call.args } } }
          });
        }
      }

      api.sendToolResponse(functionResponses);
    };
  };

  const connect = async () => {
    if (!GEMINI_API_KEY) {
      addMessage({
        type: 'error',
        content: 'Please set NEXT_PUBLIC_GEMINI_API_KEY in your environment variables'
      });
      return;
    }

    setConnectionStatus('connecting');
    
    try {
      // Initialize audio first
      await ensureAudioInitialized();
      
      const api = new GeminiLiveAPI(endpoint, false);
      geminiAPIRef.current = api;
      
      // Initialize audio context in GeminiLiveAPI
      await api.initializeAudioContext();
      
      setupGeminiHandlers(api);

      const setupMessage = {
        setup: {
          model: "models/gemini-2.0-flash-exp",
          system_instruction: {
            role: "user",
            parts: [{ text: cameraWalkingPrompt }]
          },
          tools: [{
            functionDeclarations: walkingFunctionDeclarations
          }, {
            codeExecution: {}
          }, {
            googleSearch: {}
          }],
          generation_config: {
            response_modalities: ["audio"],
            speech_config: {
              language_code: "cmn-CN",
              voice_config: {
                prebuilt_voice_config: {
                  voice_name: "Puck"
                }
              }
            }
          }
        }
      };

      api.sendSetupMessage(setupMessage);
    } catch (error) {
      setConnectionStatus('disconnected');
      addMessage({
        type: 'error',
        content: `Connection failed: ${(error as Error).message}`
      });
    }
  };

  const disconnect = () => {
    if (geminiAPIRef.current) {
      // Stop audio before closing connection
      geminiAPIRef.current.stopCurrentAudio();
      console.log('🔇 Audio stopped before disconnect');
      
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
    setConnectionStatus('disconnected');
    addMessage({
      type: 'assistant',
      content: 'Disconnected'
    });
  };

  const toggleRecording = async () => {
    if (!isConnected || !geminiAPIRef.current) {
      addMessage({
        type: 'error',
        content: 'Please connect first'
      });
      return;
    }

    if (isRecording) {
      // Stop recording
      if (audioRecorderRef.current) {
        audioRecorderRef.current.stop();
        audioRecorderRef.current = null;
      }
      geminiAPIRef.current.sendEndMessage();
      setIsRecording(false);
      addMessage({
        type: 'user',
        content: 'Recording stopped'
      });
    } else {
      // Start recording
      try {
        await ensureAudioInitialized();
        
        audioRecorderRef.current = new AudioRecorder();
        await audioRecorderRef.current.start();

        audioRecorderRef.current.on('data', (base64Data: string) => {
          if (geminiAPIRef.current) {
            geminiAPIRef.current.sendAudioChunk(base64Data);
          } else {
            console.error('❌ No Gemini API available to send audio!');
          }
        });

        setIsRecording(true);
        addMessage({
          type: 'user',
          content: 'Recording started...'
        });
      } catch (error) {
        addMessage({
          type: 'error',
          content: `Recording failed: ${(error as Error).message}`
        });
      }
    }
  };

  const toggleWebcam = async () => {
    console.log('toggleWebcam called, mediaHandlerRef:', mediaHandlerRef.current);
    
    if (!mediaHandlerRef.current) {
      // Try to initialize again if it's null
      if (videoRef.current) {
        try {
          const handler = new MediaHandler();
          handler.initialize(videoRef.current);
          mediaHandlerRef.current = handler;
          console.log('MediaHandler re-initialized');
        } catch (error) {
          console.error('Failed to re-initialize MediaHandler:', error);
          addMessage({
            type: 'error',
            content: 'Failed to initialize media handler'
          });
          return;
        }
      } else {
        addMessage({
          type: 'error',
          content: 'Video element not ready. Please try again.'
        });
        return;
      }
    }

    if (!isConnected) {
      addMessage({
        type: 'error',
        content: 'Please connect to Gemini API first'
      });
      return;
    }

    if (isWebcamActive) {
      mediaHandlerRef.current.stopAll();
      setIsWebcamActive(false);
      addMessage({
        type: 'user',
        content: 'Webcam stopped'
      });
    } else {
      try {
        addMessage({
          type: 'user',
          content: 'Starting webcam...'
        });
        
        const success = await mediaHandlerRef.current.startWebcam();
        if (success) {
          setIsWebcamActive(true);
          addMessage({
            type: 'user',
            content: 'Webcam started successfully'
          });
          
          // Start frame capture for Gemini
          mediaHandlerRef.current.startFrameCapture((base64Image) => {
            if (geminiAPIRef.current?.ws.readyState === WebSocket.OPEN) {
              const message = {
                realtimeInput: {
                  mediaChunks: [{
                    mime_type: "image/jpeg",
                    data: base64Image
                  }]
                }
              };
              geminiAPIRef.current.ws.send(JSON.stringify(message));
            }
          });
        } else {
          addMessage({
            type: 'error',
            content: 'Failed to start webcam. Please check permissions and try again.'
          });
        }
      } catch (error) {
        addMessage({
          type: 'error',
          content: `Webcam error: ${(error as Error).message}`
        });
      }
    }
  };

  const sendTextMessage = () => {
    if (!textMessage.trim()) return;
    
    if (!geminiAPIRef.current || !isConnected) {
      addMessage({
        type: 'error',
        content: 'Not connected to Gemini API'
      });
      return;
    }

    // Add user message to chat
    addMessage({
      type: 'user',
      content: textMessage
    });

    // Send to Gemini API
    geminiAPIRef.current.sendTextMessage(textMessage);
    
    // Clear input
    setTextMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  const getMessageStyle = (type: Message['type']) => {
    switch (type) {
      case 'user':
        return 'bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-800';
      case 'assistant':
        return 'bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800';
      case 'function':
        return 'bg-purple-100 dark:bg-purple-900 border-purple-200 dark:border-purple-800';
      case 'error':
        return 'bg-red-100 dark:bg-red-900 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Gemini Multimodal Chat</span>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
              <Badge variant={isConnected ? "default" : "secondary"}>
                {connectionStatus}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Real-time multimodal interaction with Gemini API. Supports voice, webcam, screen sharing, and function calls for weather and stock data.
          </p>
          
          {/* Connection Controls */}
          <div className="flex gap-2 mb-4">
            {!isConnected ? (
              <Button onClick={connect} disabled={connectionStatus === 'connecting'}>
                <Phone className="w-4 h-4 mr-2" />
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect'}
              </Button>
            ) : (
              <Button onClick={disconnect} variant="destructive">
                <PhoneOff className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            )}
          </div>

          {/* Media Controls */}
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={toggleRecording} 
              disabled={!isConnected}
              variant={isRecording ? "destructive" : "default"}
            >
              {isRecording ? (
                <MicOff className="w-4 h-4 mr-2" />
              ) : (
                <Mic className="w-4 h-4 mr-2" />
              )}
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>

            <Button 
              onClick={toggleWebcam} 
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

          {/* Text Message Input */}
          <div className="flex gap-2 mt-4">
            <Input
              value={textMessage}
              onChange={(e) => setTextMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button 
              onClick={sendTextMessage} 
              disabled={!textMessage.trim() || !isConnected}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Video Preview */}
      {(isWebcamActive || connectionStatus === 'connected') && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted
                className={`w-full max-w-md mx-auto rounded-lg ${isWebcamActive ? '' : 'hidden'}`}
                style={{ maxHeight: '400px' }}
              />
              {!isWebcamActive && (
                <div className="text-center text-muted-foreground p-8">
                  <Video className="w-12 h-12 mx-auto mb-2" />
                  <p>Webcam preview will appear here</p>
                  <p className="text-xs mt-2">Connect to API and click "Webcam" to start</p>
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
      )}

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 w-full pr-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  Connect and start recording to begin the conversation
                </p>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={`p-3 rounded-lg border ${getMessageStyle(message.type)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {message.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                    
                    {message.functionParams && (
                      <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                        <strong>Parameters:</strong> {JSON.stringify(message.functionParams)}
                      </div>
                    )}
                    
                    {message.apiResponse && (
                      <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                        <strong>API Response:</strong> {JSON.stringify(message.apiResponse, null, 2)}
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
