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

  async connect(apiKey: string, systemPrompt?: string): Promise<void> {
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
            systemInstruction: {
              parts: [
                {
                  text: systemPrompt || `Sen bir diş kliniği asistanısın. Adın "DentAI". Türkçe konuşuyorsun. Görevlerin:

1. RANDEVU YÖNETİMİ:
- Hasta randevu almak istediğinde: Adını, telefon numarasını, tercih ettiği tarih ve saati sor.
- Randevu saatleri: Pazartesi-Cuma 09:00-18:00, Cumartesi 09:00-14:00, Pazar kapalı.
- Randevuyu onayladığında özet bilgiyi tekrarla.

2. TEDAVİ BİLGİLERİ VE FİYATLAR:
- Dolgu (Kompozit): 1.500 - 3.000 TL
- Kanal Tedavisi: 3.000 - 5.000 TL
- Diş Çekimi (Normal): 1.000 - 2.000 TL
- Diş Taşı Temizliği: 1.500 - 2.500 TL
- Beyazlatma: 5.000 - 8.000 TL
- Zirkonyum Kaplama: 7.000 - 12.000 TL
- İmplant: 15.000 - 30.000 TL

3. GENEL KURALLAR:
- Her zaman nazik ve profesyonel ol.
- Kliniğin adresi: Atatürk Cad. No:123, Kadıköy/İstanbul
- Telefon: 0216 555 00 00

Konuşmaya "Merhaba! DentAI diş kliniği asistanıyım. Size nasıl yardımcı olabilirim?" diye başla.`,
                },
              ],
            },
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
