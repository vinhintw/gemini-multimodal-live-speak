export class AudioStreamer {
  private context: AudioContext;
  private sampleRate = 24000; // Output sample rate as per API spec
  private audioQueue: AudioBuffer[] = [];
  public isPlaying = false;
  private currentSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode;
  public onComplete = () => {};
  private playbackTimeout: NodeJS.Timeout | null = null;
  private lastPlaybackTime = 0;

  constructor(audioContext: AudioContext) {
    this.context = audioContext;
    this.gainNode = this.context.createGain();
    this.gainNode.connect(this.context.destination);
    this.gainNode.gain.value = 1.0;
  }

  addPCM16(chunk: Uint8Array): void {
    // console.log('🎵 AudioStreamer.addPCM16 called');
    // console.log('Chunk length:', chunk.length, 'bytes');
    // console.log('Audio context state:', this.context.state);
    // console.log('Current queue length:', this.audioQueue.length);
    // console.log('Is currently playing:', this.isPlaying);
    // console.log('Current source exists:', !!this.currentSource);

    // Convert incoming PCM16 data to float32
    const float32Array = new Float32Array(chunk.length / 2);
    const dataView = new DataView(chunk.buffer);

    for (let i = 0; i < chunk.length / 2; i++) {
      try {
        const int16 = dataView.getInt16(i * 2, true);
        float32Array[i] = int16 / 32768;
      } catch (e) {
        console.error("Error converting PCM16:", e);
      }
    }

    console.log("Converted to float32, samples:", float32Array.length);

    // Check if data is not silent (has actual audio content)
    const maxValue = Math.max(...Array.from(float32Array).map(Math.abs));

    if (maxValue < 0.001) {
      // console.log("⚠️ Audio chunk seems silent, skipping");
      return;
    }

    // Create and fill audio buffer
    const audioBuffer = this.context.createBuffer(
      1,
      float32Array.length,
      this.sampleRate
    );
    audioBuffer.getChannelData(0).set(float32Array);

    console.log(
      "Created audio buffer, duration:",
      audioBuffer.duration,
      "seconds"
    );

    // Add to queue
    this.audioQueue.push(audioBuffer);
    // console.log("Audio queue length after push:", this.audioQueue.length);

    // Only start playback if not already playing and no current source
    if (!this.isPlaying && !this.currentSource && this.audioQueue.length > 0) {
      // console.log("🎵 Starting playback (was not playing)");
      this.isPlaying = true;
      this.lastPlaybackTime = this.context.currentTime;
      this.playNextBuffer();
    } else {
      console.log(
        "🎵 Already playing or current source exists, queued for later"
      );
    }
  }

  // Removed checkPlaybackStatus method as it's not needed and can cause interference

  private playNextBuffer(): void {
    // console.log("🎵 AudioStreamer.playNextBuffer called");
    // console.log("Queue length:", this.audioQueue.length);
    // console.log("Currently playing:", this.isPlaying);
    // console.log("Current source exists:", !!this.currentSource);

    if (this.audioQueue.length === 0) {
      // console.log("❌ No more audio buffers to play");
      this.isPlaying = false;
      return;
    }

    // Only stop existing source if we're not currently playing or it's stuck
    if (this.currentSource) {
      // console.log("⚠️ Current source exists, not starting new playback");
      return; // Don't interrupt current playback
    }

    // Update last playback time
    this.lastPlaybackTime = this.context.currentTime;

    try {
      const audioBuffer = this.audioQueue.shift()!;
      // console.log("🎵 Playing audio buffer:");
      // console.log("  - Duration:", audioBuffer.duration, "seconds");

      const source = this.context.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.gainNode);
      this.currentSource = source;

      // When this buffer ends, play the next one
      source.onended = () => {
        // console.log("✅ Audio buffer finished playing");
        this.lastPlaybackTime = this.context.currentTime;

        // Clear current source reference
        if (this.currentSource === source) {
          this.currentSource = null;
        }

        if (this.audioQueue.length > 0) {
          // console.log(
          //   "🎵 More buffers in queue (" +
          //     this.audioQueue.length +
          //     "), continuing..."
          // );
          // Immediately play next buffer
          this.playNextBuffer();
        } else {
          // console.log("🏁 All audio buffers played, stopping");
          this.isPlaying = false;
          this.onComplete();
        }
      };

      // Start playing immediately
      // console.log("🚀 Starting audio source...");
      source.start(0);
      // console.log("✅ Audio source started successfully");
    } catch (error) {
      console.error("❌ Error during playback:", error);
      // Try to recover by playing next buffer
      if (this.audioQueue.length > 0) {
        // console.log("🔄 Retrying with next buffer...");
        setTimeout(() => this.playNextBuffer(), 100);
      } else {
        this.isPlaying = false;
      }
    }
  }

  stop(): void {
    // console.log("🛑 Stopping audio streamer");
    this.isPlaying = false;

    if (this.playbackTimeout) {
      clearTimeout(this.playbackTimeout);
      this.playbackTimeout = null;
    }

    if (this.currentSource) {
      try {
        // console.log("🛑 Stopping current audio source");
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (e) {
        console.log("Source already stopped:", e);
      }
      this.currentSource = null;
    }

    // Clear the queue
    this.audioQueue = [];
    console.log("🗑️ Audio queue cleared");

    // Gradual volume fade to prevent clicks
    this.gainNode.gain.linearRampToValueAtTime(
      0,
      this.context.currentTime + 0.1
    );

    setTimeout(() => {
      this.gainNode.disconnect();
      this.gainNode = this.context.createGain();
      this.gainNode.connect(this.context.destination);
      this.gainNode.gain.value = 1.0;
      // console.log("🔄 Audio gain node reset");
    }, 200);
  }

  async resume(): Promise<void> {
    // console.log("Resuming audio streamer, context state:", this.context.state);

    if (this.context.state === "suspended") {
      await this.context.resume();
      // console.log("Audio context resumed, new state:", this.context.state);
    }

    this.lastPlaybackTime = this.context.currentTime;
    this.gainNode.gain.setValueAtTime(1, this.context.currentTime);

    if (this.audioQueue.length > 0 && !this.isPlaying) {
      console.log(
        "Resuming playback with",
        this.audioQueue.length,
        "buffers in queue"
      );
      this.isPlaying = true;
      this.playNextBuffer();
    }
  }

  complete(): void {
    console.log("Audio streaming complete");
    if (this.audioQueue.length > 0) {
      // Let the remaining buffers play out
      return;
    }
    if (this.playbackTimeout) {
      clearTimeout(this.playbackTimeout);
      this.playbackTimeout = null;
    }
    this.onComplete();
  }
}
