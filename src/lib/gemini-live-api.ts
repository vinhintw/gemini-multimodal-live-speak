export interface GeminiSetupConfig {
  model?: string;
  system_instruction?: {
    role: string;
    parts: Array<{ text: string }>;
  };
  tools?: Array<any>;
  generation_config?: {
    response_modalities?: string[];
    speech_config?: {
      language_code?: string;
      voice_config?: {
        prebuilt_voice_config?: {
          voice_name?: string;
        };
      };
    };
  };
}

export interface ToolCall {
  functionCalls: Array<{
    id: string;
    name: string;
    args: Record<string, any>;
  }>;
}

export interface FunctionResponse {
  id: string;
  name: string;
  response: {
    result: {
      object_value: any;
    };
  };
}

export class GeminiLiveAPI {
  public ws: WebSocket;
  public onSetupComplete: () => void = () => {};
  public onAudioData: (audioData: string) => void = () => {};
  public onInterrupted: () => void = () => {};
  public onTurnComplete: () => void = () => {};
  public onError: (message: string) => void = () => {};
  public onClose: (event: CloseEvent) => void = () => {};
  public onToolCall: (toolCall: ToolCall) => void = () => {};
  
  private pendingSetupMessage: any = null;
  private autoSetup: boolean;
  private setupConfig: GeminiSetupConfig | null;
  
  // Enhanced Audio playback properties
  private audioContext: AudioContext | null = null;
  private audioQueue: Float32Array[] = [];
  private currentSource: AudioBufferSourceNode | null = null;
  private isPlaying: boolean = false;

  constructor(endpoint: string, autoSetup = true, setupConfig: GeminiSetupConfig | null = null) {
    this.ws = new WebSocket(endpoint);
    this.autoSetup = autoSetup;
    this.setupConfig = setupConfig;
    this.setupWebSocket();
  }

  private setupWebSocket(): void {
    this.ws.onopen = () => {
      console.log('WebSocket connection is opening...');
      if (this.autoSetup) {
        this.sendDefaultSetup();
      } else if (this.pendingSetupMessage) {
        console.log('Sending pending setup message:', this.pendingSetupMessage);
        this.ws.send(JSON.stringify(this.pendingSetupMessage));
        this.pendingSetupMessage = null;
      }
    };

    this.ws.onmessage = async (event) => {
      try {
        let wsResponse: any;
        if (event.data instanceof Blob) {
          const responseText = await event.data.text();
          wsResponse = JSON.parse(responseText);
        } else {
          wsResponse = JSON.parse(event.data);
        }

        if (wsResponse.setupComplete) {
          this.onSetupComplete();
        } else if (wsResponse.toolCall) {
          console.log('🔧 Tool call received:', wsResponse.toolCall);
          this.onToolCall(wsResponse.toolCall);
        } else if (wsResponse.serverContent) {
          if (wsResponse.serverContent.interrupted) {
            console.log('⛔ Interruption received');
            this.onInterrupted();
            return;
          }

          if (wsResponse.serverContent.turnComplete) {
            console.log('✅ Turn complete received');
            this.onTurnComplete();
            return;
          }

          if (wsResponse.serverContent.modelTurn && 
              wsResponse.serverContent.modelTurn.parts) {
            
            for (const part of wsResponse.serverContent.modelTurn.parts) {
              
              if (part.inlineData && part.inlineData.mimeType && 
                  part.inlineData.mimeType.startsWith('audio/pcm')) {
                this.onAudioData(part.inlineData.data);
                // Enhanced audio playback
                this.playAudioResponse(part.inlineData.data);
              } else if (part.text) {
                console.log('📝 Text part:', part.text);
              } else {
                console.log('❓ Unknown part type:', part);
              }
            }
          } else {
            console.log('❌ Server content without modelTurn.parts:', wsResponse.serverContent);
          }
        } else {
          console.log('❓ Unknown message type:', wsResponse);
        }
      } catch (error) {
        console.error('❌ Error processing WebSocket message:', error);
        this.onError('Error processing message: ' + (error as Error).message);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.onError('WebSocket error occurred');
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
      this.onClose(event);
    };
  }

  public sendSetupMessage(setupMessage: any): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      console.log('Sending setup message:', setupMessage);
      this.ws.send(JSON.stringify(setupMessage));
    } else {
      console.log('WebSocket not ready, storing setup message');
      this.pendingSetupMessage = setupMessage;
    }
  }

  private sendDefaultSetup(): void {
    const defaultSetup = this.setupConfig || {
      model: "models/gemini-2.0-flash-exp",
      generation_config: {
        response_modalities: ["audio"]
      }
    };

    this.sendSetupMessage({ setup: defaultSetup });
  }

  public sendAudioChunk(base64Data: string): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      const message = {
        realtimeInput: {
          mediaChunks: [{
            mimeType: "audio/pcm",
            data: base64Data
          }]
        }
      };
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('❌ WebSocket not open, cannot send audio chunk. State:', this.ws.readyState);
    }
  }

  public sendEndMessage(): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      const endMessage = {
        realtimeInput: {
          mediaChunks: []
        }
      };
      this.ws.send(JSON.stringify(endMessage));
    }
  }

  public sendToolResponse(functionResponses: FunctionResponse[]): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      const message = {
        toolResponse: {
          functionResponses: functionResponses
        }
      };
      console.log('Sending tool response:', message);
      this.ws.send(JSON.stringify(message));
    }
  }

  public close(): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
    
    // Stop audio playback
    this.stopAudioPlayback();
  }

  // Enhanced Audio context initialization
  public async initializeAudioContext(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({
        sampleRate: 24000,
      });
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    }
  }

  // Enhanced audio playback with better queue management
  public async startAudioPlayback(): Promise<void> {
    if (!this.audioContext) {
      await this.initializeAudioContext();
    }
    
    this.playNextInQueue();
  }

  // Enhanced audio response processing with level detection
  public playAudioResponse(base64Data: string): void {
    if (!this.audioContext) {
      console.error('Audio context not initialized');
      return;
    }

    try {
      // Convert base64 to binary
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert PCM16 to Float32
      const pcmData = new Int16Array(bytes.buffer);
      const float32Data = new Float32Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        float32Data[i] = pcmData[i] / 32768.0;
      }

      // Add to queue
      this.audioQueue.push(float32Data);
      
      // Start playing only if not currently playing
      if (!this.isPlaying) {
        this.playNextInQueue();
      }
    } catch (error) {
      console.error('Error processing audio response:', error);
    }
  }

  // Enhanced queue processing with audio level monitoring
  private async playNextInQueue(): Promise<void> {
    if (
      !this.audioContext ||
      this.audioQueue.length === 0 ||
      this.isPlaying
    ) {
      return;
    }

    try {
      this.isPlaying = true;
      
      const float32Data = this.audioQueue.shift()!;

      // Create audio buffer
      const audioBuffer = this.audioContext.createBuffer(
        1,
        float32Data.length,
        24000
      );
      audioBuffer.getChannelData(0).set(float32Data);

      // Create and play source
      this.currentSource = this.audioContext.createBufferSource();
      this.currentSource.buffer = audioBuffer;
      this.currentSource.connect(this.audioContext.destination);

      this.currentSource.onended = () => {
        this.currentSource = null;
        this.isPlaying = false;
        
        // Continue playing next in queue
        this.playNextInQueue();
      };

      this.currentSource.start();
    } catch (error) {
      console.error('[WebSocket] Error playing audio:', error);
      this.currentSource = null;
      this.isPlaying = false;
      this.playNextInQueue();
    }
  }

  // Enhanced audio stopping with proper cleanup
  public async stopAudioPlayback(): Promise<void> {
    
    // Stop current playing audio
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
      this.currentSource.disconnect();
      this.currentSource = null;
    }

    // Clear audio queue and playing state
    this.audioQueue = [];
    this.isPlaying = false;

    // Close audio context
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
    
    console.log('🎵 Audio playback stopped and cleaned up');
  }

  // Stop only current audio but keep context for future playback
  public stopCurrentAudio(): void {
    // Stop any playing audio
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
      this.currentSource = null;
    }

    this.audioQueue = [];
    this.isPlaying = false;
  }

  // Legacy method for backward compatibility
  public queueAudioData(audioData: Float32Array): void {
    this.audioQueue.push(audioData);
    if (!this.isPlaying) {
      this.playNextInQueue();
    }
  }

  // Get current audio playback status
  public getAudioStatus(): { isPlaying: boolean; queueLength: number; hasContext: boolean } {
    return {
      isPlaying: this.isPlaying,
      queueLength: this.audioQueue.length,
      hasContext: !!this.audioContext
    };
  }

  public sendTextMessage(message: string): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      const contentMessage = {
        client_content: {
          turns: [{
            role: "user",
            parts: [{ text: message }]
          }],
          turn_complete: true
        }
      };

      console.log('Sending content message:', contentMessage);
      this.ws.send(JSON.stringify(contentMessage));
    } else {
      console.error('❌ WebSocket not open, cannot send text message. State:', this.ws.readyState);
    }
  }

}