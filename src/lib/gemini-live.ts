import {
  GoogleGenAI,
  Modality,
  MediaResolution,
  type Session,
  type LiveServerMessage,
} from "@google/genai";

export type LiveChatCallbacks = {
  onAudioChunk: (base64Data: string) => void;
  onText: (text: string) => void;
  onTurnComplete: () => void;
  onConnectionChange: (connected: boolean) => void;
  onError: (error: string) => void;
  onInterrupted: () => void;
};

export class GeminiLiveSession {
  private session: Session | null = null;
  private callbacks: LiveChatCallbacks;
  private _isConnected = false;

  constructor(callbacks: LiveChatCallbacks) {
    this.callbacks = callbacks;
  }

  async connect(apiKey: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const ai = new GoogleGenAI({ apiKey });

      let resolved = false;

      ai.live
        .connect({
          model: "models/gemini-3.1-flash-live-preview",
          callbacks: {
            onopen: () => {
              console.log("[Gemini] WebSocket connected");
              this._isConnected = true;
              this.callbacks.onConnectionChange(true);
              if (!resolved) {
                resolved = true;
                resolve();
              }
            },
            onmessage: (message: LiveServerMessage) => {
              this.handleMessage(message);
            },
            onerror: (e: ErrorEvent) => {
              console.error("[Gemini] WebSocket error:", e.message || e);
              this._isConnected = false;
              this.callbacks.onError(
                e.message || "WebSocket bağlantı hatası"
              );
              if (!resolved) {
                resolved = true;
                reject(new Error(e.message || "Connection failed"));
              }
            },
            onclose: (e: CloseEvent) => {
              console.log(
                `[Gemini] WebSocket closed: code=${e.code} reason="${e.reason}"`
              );
              this._isConnected = false;
              this.callbacks.onConnectionChange(false);
              if (!resolved) {
                resolved = true;
                reject(
                  new Error(`Connection closed: ${e.reason || e.code}`)
                );
              }
            },
          },
          config: {
            responseModalities: [Modality.AUDIO],
            mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: "Orus",
                },
              },
            },
          },
        })
        .then((session) => {
          this.session = session;
          console.log("[Gemini] Session created");
        })
        .catch((err) => {
          console.error("[Gemini] Connect failed:", err);
          this._isConnected = false;
          if (!resolved) {
            resolved = true;
            reject(err);
          }
        });
    });
  }

  sendAudio(base64PCM: string) {
    if (!this.session || !this._isConnected) return;

    try {
      this.session.sendRealtimeInput({
        audio: {
          data: base64PCM,
          mimeType: "audio/pcm;rate=16000",
        },
      });
    } catch {
      // WebSocket might have closed between the check and send — ignore
    }
  }

  sendText(text: string) {
    if (!this.session || !this._isConnected) return;

    try {
      this.session.sendClientContent({
        turns: [text],
      });
    } catch {
      // Ignore if connection is closing
    }
  }

  disconnect() {
    this._isConnected = false;
    if (this.session) {
      try {
        this.session.close();
      } catch {
        // Already closed
      }
      this.session = null;
    }
  }

  get connected() {
    return this._isConnected;
  }

  private handleMessage(message: LiveServerMessage) {
    if (message.serverContent?.modelTurn?.parts) {
      for (const part of message.serverContent.modelTurn.parts) {
        if (part?.inlineData?.data) {
          this.callbacks.onAudioChunk(part.inlineData.data);
        }
        if (part?.text) {
          this.callbacks.onText(part.text);
        }
      }
    }

    if (message.serverContent?.turnComplete) {
      this.callbacks.onTurnComplete();
    }

    if (message.serverContent?.interrupted) {
      this.callbacks.onInterrupted();
    }
  }
}
