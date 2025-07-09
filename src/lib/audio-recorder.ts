export class AudioRecorder extends EventTarget {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private recordingWorklet: AudioWorkletNode | null = null;
  private sampleRate = 16000; // 16kHz as per original code
  private recording = false;

  async start(): Promise<void> {
    try {
      console.log('Starting audio recorder...');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Could not request user media");
      }

      // Get user media with 16kHz sample rate
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: this.sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      console.log('Got user media stream');

      // Create audio context with 16kHz sample rate
      this.audioContext = new AudioContext({ sampleRate: this.sampleRate });
      await this.audioContext.resume();
      console.log('Created audio context with sample rate:', this.audioContext.sampleRate);

      // Load audio worklet
      await this.audioContext.audioWorklet.addModule('/audio-recording-worklet.js');
      console.log('Loaded audio worklet');

      // Create source node
      this.source = this.audioContext.createMediaStreamSource(this.stream);

      // Create processor node
      this.recordingWorklet = new AudioWorkletNode(this.audioContext, 'audio-recording-worklet');

      // Handle audio data
      this.recordingWorklet.port.onmessage = (event) => {
        const arrayBuffer = event.data.data?.int16arrayBuffer;
        if (arrayBuffer) {
          const base64Data = this.arrayBufferToBase64(arrayBuffer);
          this.dispatchEvent(new CustomEvent('data', { detail: base64Data }));
        }
      };

      // Connect nodes
      this.source.connect(this.recordingWorklet);
      // Don't connect to destination to avoid feedback
      
      this.recording = true;
      console.log('Audio recording started successfully');
    } catch (error) {
      console.error('Error starting audio recording:', error);
      throw error;
    }
  }

  stop(): void {
    console.log('Stopping audio recorder...');
    
    this.recording = false;

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
      this.stream = null;
    }

    if (this.recordingWorklet) {
      this.recordingWorklet = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    console.log('Audio recording stopped');
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // EventTarget compatibility methods
  on(event: string, listener: (data: any) => void): void {
    this.addEventListener(event, (e: any) => listener(e.detail));
  }

  off(event: string, listener: (data: any) => void): void {
    this.removeEventListener(event, (e: any) => listener(e.detail));
  }
}
