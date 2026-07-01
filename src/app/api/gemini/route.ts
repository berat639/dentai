import {
  GoogleGenAI,
  Modality,
  MediaResolution,
  type LiveServerMessage,
} from "@google/genai";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const { message, audioData } = body;

  if (!message && !audioData) {
    return Response.json(
      { error: "Message or audioData is required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "GEMINI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  const responseQueue: LiveServerMessage[] = [];
  const audioParts: string[] = [];
  let textResponse = "";

  try {
    const session = await ai.live.connect({
      model: "models/gemini-3.1-flash-live-preview",
      callbacks: {
        onopen: () => {},
        onmessage: (msg: LiveServerMessage) => {
          responseQueue.push(msg);
        },
        onerror: (e: ErrorEvent) => {
          console.error("Gemini error:", e.message);
        },
        onclose: () => {},
      },
      config: {
        responseModalities: [Modality.AUDIO, Modality.TEXT],
        mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Orus",
            },
          },
        },
        contextWindowCompression: {
          triggerTokens: "104857",
          slidingWindow: { targetTokens: "52428" },
        },
      },
    });

    if (audioData) {
      // Send audio input via realtime input
      // audioData is an array of base64 PCM chunks
      const chunks: string[] = Array.isArray(audioData)
        ? audioData
        : [audioData];

      for (const chunk of chunks) {
        session.sendRealtimeInput({
          media: {
            data: chunk,
            mimeType: "audio/pcm;rate=16000",
          },
        });
      }

      // Signal end of audio by sending a small silence then waiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } else {
      // Send text input
      session.sendClientContent({
        turns: [message],
      });
    }

    // Wait for turn to complete
    let turnComplete = false;
    const timeout = 30000;
    const start = Date.now();

    while (!turnComplete && Date.now() - start < timeout) {
      const msg = responseQueue.shift();
      if (msg) {
        if (msg.serverContent?.modelTurn?.parts) {
          for (const part of msg.serverContent.modelTurn.parts) {
            if (part?.inlineData?.data) {
              audioParts.push(part.inlineData.data);
            }
            if (part?.text) {
              textResponse += part.text;
            }
          }
        }
        if (msg.serverContent?.turnComplete) {
          turnComplete = true;
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    session.close();

    return Response.json({
      text: textResponse || null,
      audio: audioParts.length > 0 ? audioParts : null,
      mimeType: "audio/L16;rate=24000",
    });
  } catch (error) {
    console.error("Gemini API error:", error);
    return Response.json(
      { error: "Failed to get response from Gemini" },
      { status: 500 }
    );
  }
}
