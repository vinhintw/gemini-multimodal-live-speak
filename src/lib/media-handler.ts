export class MediaHandler {
  private videoElement: HTMLVideoElement | null = null;
  private webcamStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private frameInterval: NodeJS.Timeout | null = null;
  public isWebcamActive = false;
  public isScreenActive = false;

  initialize(videoElement: HTMLVideoElement): void {
    this.videoElement = videoElement;
  }

  async startWebcam(): Promise<boolean> {
    try {
      console.log("Requesting webcam access...");

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia is not supported in this browser");
      }

      this.webcamStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "environment",
        },
        audio: false, // Only video for webcam
      });

      console.log("Webcam stream obtained:", this.webcamStream);

      if (this.videoElement) {
        this.videoElement.srcObject = this.webcamStream;
        this.videoElement.classList.remove("hidden");

        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          if (this.videoElement) {
            this.videoElement.onloadedmetadata = () => {
              console.log("Video metadata loaded");
              resolve();
            };
            this.videoElement.onerror = (e) => {
              console.error("Video element error:", e);
              reject(new Error("Failed to load video"));
            };
          } else {
            reject(new Error("Video element not available"));
          }
        });
      }

      this.isWebcamActive = true;
      console.log("Webcam started successfully");
      return true;
    } catch (error) {
      console.error("Error starting webcam:", error);

      // Provide more specific error messages
      if (error instanceof DOMException) {
        switch (error.name) {
          case "NotAllowedError":
            throw new Error(
              "Camera access denied. Please allow camera permissions and try again."
            );
          case "NotFoundError":
            throw new Error(
              "No camera found. Please connect a camera and try again."
            );
          case "NotReadableError":
            throw new Error("Camera is already in use by another application.");
          case "OverconstrainedError":
            throw new Error("Camera does not meet the required constraints.");
          case "SecurityError":
            throw new Error(
              "Camera access blocked due to security restrictions."
            );
          default:
            throw new Error(`Camera error: ${error.message}`);
        }
      }

      throw error;
    }
  }

  async startScreenShare(): Promise<boolean> {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      if (this.videoElement) {
        this.videoElement.srcObject = this.screenStream;
        this.videoElement.classList.remove("hidden");
      }

      this.isScreenActive = true;
      return true;
    } catch (error) {
      console.error("Error starting screen share:", error);
      return false;
    }
  }

  startFrameCapture(onFrame: (base64Image: string) => void): void {
    if (!this.videoElement) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    this.frameInterval = setInterval(() => {
      if (this.videoElement && (this.isWebcamActive || this.isScreenActive)) {
        canvas.width = this.videoElement.videoWidth;
        canvas.height = this.videoElement.videoHeight;

        ctx.drawImage(this.videoElement, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onload = () => {
                const base64 = (reader.result as string).split(",")[1];
                onFrame(base64);
              };
              reader.readAsDataURL(blob);
            }
          },
          "image/jpeg",
          0.7
        );
      }
    }, 1000); // Capture every second
  }

  stopAll(): void {
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }

    if (this.webcamStream) {
      this.webcamStream.getTracks().forEach((track) => track.stop());
      this.webcamStream = null;
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement.classList.add("hidden");
    }

    this.isWebcamActive = false;
    this.isScreenActive = false;
  }
}
