"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { AudioStreamPlayer, MicrophoneCapture } from "@/lib/audio";
import { GeminiLiveSession } from "@/lib/gemini-live";

type ConnectionState = "idle" | "connecting" | "connected" | "error";

export default function Chat() {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("idle");
  const [micLevel, setMicLevel] = useState(0);
  const [isGeminiSpeaking, setIsGeminiSpeaking] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [callDuration, setCallDuration] = useState(0);
  const [textInput, setTextInput] = useState("");

  const sessionRef = useRef<GeminiLiveSession | null>(null);
  const playerRef = useRef<AudioStreamPlayer | null>(null);
  const micRef = useRef<MicrophoneCapture | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Cleanup on unmount ─────────────────────────────────────────
  useEffect(() => {
    return () => {
      endCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Start Live Call ────────────────────────────────────────────
  const startCall = useCallback(async () => {
    setConnectionState("connecting");
    setStatusText("Bağlantı kuruluyor...");
    setErrorText("");
    setCallDuration(0);

    try {
      // 1. Get API key from server
      const res = await fetch("/api/session");
      const data = await res.json();
      if (!res.ok || !data.apiKey) {
        throw new Error(data.error || "API key alınamadı");
      }

      // 2. Create audio player for Gemini's responses
      playerRef.current = new AudioStreamPlayer(24000);

      // 3. Create Gemini Live session
      const session = new GeminiLiveSession({
        onAudioChunk: (base64Data) => {
          setIsGeminiSpeaking(true);
          playerRef.current?.addChunk(base64Data);
        },
        onText: (text) => {
          setStatusText(text);
        },
        onTurnComplete: () => {
          setIsGeminiSpeaking(false);
          setStatusText("Dinleniyor...");
        },
        onConnectionChange: (connected) => {
          if (!connected && sessionRef.current) {
            // Connection dropped — stop mic to prevent sending to closed socket
            if (micRef.current) {
              micRef.current.stop();
              micRef.current = null;
            }
            setConnectionState("idle");
            setStatusText("Bağlantı kapandı");
          }
        },
        onError: (error) => {
          console.error("[Chat] Gemini error:", error);
          setErrorText(error);
          setConnectionState("error");
        },
        onInterrupted: () => {
          setIsGeminiSpeaking(false);
          if (playerRef.current) {
            playerRef.current.stop();
            playerRef.current = new AudioStreamPlayer(24000);
          }
        },
      });

      sessionRef.current = session;

      // Wait for WebSocket to be fully connected
      console.log("[Chat] Connecting to Gemini...");
      await session.connect(data.apiKey, data.systemPrompt || undefined);
      console.log("[Chat] Connected! Starting microphone...");

      // 4. Start microphone capture ONLY after connection is confirmed
      const mic = new MicrophoneCapture();
      micRef.current = mic;

      await mic.start(
        (base64Chunk) => {
          // Only send if still connected
          if (session.connected) {
            session.sendAudio(base64Chunk);
          }
        },
        (level) => {
          setMicLevel(level);
        }
      );

      // 5. Start call timer
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      setConnectionState("connected");
      setStatusText("Bağlantı kuruldu, asistan konuşmaya başlıyor...");
      console.log("[Chat] Live call started successfully");

      // 6. Trigger Gemini to speak first
      session.sendText("Merhaba, lütfen kendini tanıt ve hastaya nasıl yardımcı olabileceğini söyle.");
    } catch (err) {
      console.error("[Chat] Failed to start call:", err);
      setErrorText(
        err instanceof Error ? err.message : "Bağlantı kurulamadı"
      );
      setConnectionState("error");
      endCall();
    }
  }, []);

  // ── End Call ───────────────────────────────────────────────────
  const endCall = useCallback(() => {
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop microphone
    if (micRef.current) {
      micRef.current.stop();
      micRef.current = null;
    }

    // Stop audio player
    if (playerRef.current) {
      playerRef.current.stop();
      playerRef.current = null;
    }

    // Disconnect session
    if (sessionRef.current) {
      sessionRef.current.disconnect();
      sessionRef.current = null;
    }

    setConnectionState("idle");
    setIsGeminiSpeaking(false);
    setMicLevel(0);
    setCallDuration(0);
    setStatusText("");
  }, []);

  // ── Send text during live call ─────────────────────────────────
  const sendText = useCallback(() => {
    const text = textInput.trim();
    if (!text || !sessionRef.current?.connected) return;
    sessionRef.current.sendText(text);
    setTextInput("");
    setStatusText(`Gönderildi: "${text}"`);
  }, [textInput]);

  // ── Format duration ────────────────────────────────────────────
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ── Idle / Landing Screen ──────────────────────────────────────
  if (connectionState === "idle" || connectionState === "error") {
    return (
      <div className="flex flex-col h-full relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute w-[600px] h-[600px] rounded-full opacity-[0.04] blur-[120px]"
            style={{
              background: "#8b5cf6",
              top: "-15%",
              right: "-15%",
              animation: "float 8s ease-in-out infinite",
            }}
          />
          <div
            className="absolute w-[500px] h-[500px] rounded-full opacity-[0.03] blur-[100px]"
            style={{
              background: "#3b82f6",
              bottom: "-10%",
              left: "-10%",
              animation: "float 10s ease-in-out infinite 2s",
            }}
          />
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
          {/* Logo with pulse */}
          <div className="relative mb-8">
            <div
              className="w-28 h-28 rounded-3xl flex items-center justify-center"
              style={{
                background: "var(--gradient-main)",
                boxShadow:
                  "0 12px 40px rgba(139, 92, 246, 0.4), 0 0 80px rgba(139, 92, 246, 0.15)",
              }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
              >
                <path d="M12 2C8 2 5 5 5 9c0 3 1.5 5 3 6.5S12 22 12 22s2.5-3.5 4-5.5S19 12 19 9c0-4-3-7-7-7z" />
                <circle cx="12" cy="9" r="2" />
              </svg>
            </div>
            {/* Pulse rings */}
            <div
              className="absolute inset-0 rounded-3xl"
              style={{
                background: "var(--gradient-main)",
                animation: "pulse-ring 2.5s ease-out infinite",
                opacity: 0.2,
              }}
            />
            <div
              className="absolute inset-0 rounded-3xl"
              style={{
                background: "var(--gradient-main)",
                animation: "pulse-ring 2.5s ease-out infinite 1s",
                opacity: 0.15,
              }}
            />
          </div>

          <h1
            className="text-4xl font-bold mb-3"
            style={{
              background: "var(--gradient-main)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            DentAI Diş Kliniği
          </h1>

          <p
            className="text-base text-center max-w-md mb-2"
            style={{ color: "var(--text-secondary)" }}
          >
            Yapay zeka destekli diş kliniği asistanınız
          </p>

          <p
            className="text-sm text-center max-w-md mb-10"
            style={{ color: "var(--text-muted)" }}
          >
            Randevu almak, tedaviler hakkında bilgi edinmek veya fiyatlarımızı öğrenmek için
            mikrofon butonuna basın ve konuşmaya başlayın.
          </p>

          {/* Error message */}
          {connectionState === "error" && errorText && (
            <div
              className="px-5 py-3 rounded-xl mb-6 text-sm max-w-md text-center animate-[fadeInUp_0.3s_ease-out]"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#f87171",
              }}
            >
              ❌ {errorText}
            </div>
          )}

          {/* Start Call Button */}
          <button
            onClick={startCall}
            className="group relative w-24 h-24 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              boxShadow:
                "0 8px 30px rgba(34, 197, 94, 0.4), 0 0 60px rgba(34, 197, 94, 0.1)",
            }}
          >
            {/* Phone icon */}
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="white"
              className="transition-transform duration-200 group-hover:scale-110"
            >
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
            </svg>
          </button>

          <p
            className="mt-4 text-sm font-medium"
            style={{ color: "#22c55e" }}
          >
            Aramayı Başlat
          </p>

          {/* Info chips */}
          <div className="flex flex-wrap gap-3 mt-10 justify-center">
            {[
              { icon: "🦷", label: "Tedavi Bilgisi" },
              { icon: "📅", label: "Randevu" },
              { icon: "💰", label: "Fiyat Bilgisi" },
              { icon: "🏥", label: "Kadıköy/İstanbul" },
            ].map((chip) => (
              <div
                key={chip.label}
                className="px-4 py-2 rounded-xl text-xs font-medium"
                style={{
                  background: "var(--bg-glass)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-secondary)",
                }}
              >
                {chip.icon} {chip.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Connecting Screen ──────────────────────────────────────────
  if (connectionState === "connecting") {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="relative mb-8">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: "var(--gradient-main)",
              animation: "pulse-ring 1.5s ease-in-out infinite",
            }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "var(--bg-primary)" }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "var(--gradient-main)" }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                >
                  <path d="M12 2C8 2 5 5 5 9c0 3 1.5 5 3 6.5S12 22 12 22s2.5-3.5 4-5.5S19 12 19 9c0-4-3-7-7-7z" />
                  <circle cx="12" cy="9" r="2" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <p className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>
          {statusText || "Bağlanılıyor..."}
        </p>
        <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
          Mikrofon izni gerekebilir
        </p>
      </div>
    );
  }

  // ── Connected / Live Call Screen ───────────────────────────────
  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Animated background that reacts to state */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[120px] transition-all duration-1000"
          style={{
            background: isGeminiSpeaking ? "#8b5cf6" : "#3b82f6",
            opacity: isGeminiSpeaking ? 0.08 : 0.03,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            animation: isGeminiSpeaking
              ? "float 3s ease-in-out infinite"
              : "float 8s ease-in-out infinite",
          }}
        />
        {/* Mic level reactive glow */}
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[100px] transition-opacity duration-150"
          style={{
            background: "#22c55e",
            opacity: micLevel * 0.06,
            bottom: "10%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        />
      </div>

      {/* Header */}
      <header
        className="relative z-10 flex items-center justify-between px-6 py-4"
        style={{
          background: "rgba(10, 10, 15, 0.6)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "var(--gradient-main)",
              boxShadow: "0 4px 15px rgba(139, 92, 246, 0.3)",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <path d="M12 2C8 2 5 5 5 9c0 3 1.5 5 3 6.5S12 22 12 22s2.5-3.5 4-5.5S19 12 19 9c0-4-3-7-7-7z" />
              <circle cx="12" cy="9" r="2" />
            </svg>
          </div>
          <div>
            <h1
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              DentAI Asistan
            </h1>
            <div className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: "#22c55e",
                  boxShadow: "0 0 6px rgba(34, 197, 94, 0.5)",
                  animation: "dotPulse 2s infinite",
                }}
              />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Canlı · {formatDuration(callDuration)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{
              background: "rgba(139, 92, 246, 0.1)",
              color: "var(--accent-purple)",
              border: "1px solid rgba(139, 92, 246, 0.2)",
            }}
          >
            🦷 Diş Kliniği
          </div>
        </div>
      </header>

      {/* Main call area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Central orb visualization */}
        <div className="relative mb-12">
          {/* Outer mic level ring */}
          <div
            className="absolute inset-[-20px] rounded-full transition-all duration-150"
            style={{
              border: `3px solid rgba(34, 197, 94, ${micLevel * 0.5})`,
              boxShadow: `0 0 ${micLevel * 40}px rgba(34, 197, 94, ${micLevel * 0.2})`,
              transform: `scale(${1 + micLevel * 0.15})`,
            }}
          />

          {/* Gemini speaking rings */}
          {isGeminiSpeaking && (
            <>
              <div
                className="absolute inset-[-30px] rounded-full"
                style={{
                  border: "2px solid rgba(139, 92, 246, 0.3)",
                  animation: "pulse-ring 2s ease-out infinite",
                }}
              />
              <div
                className="absolute inset-[-30px] rounded-full"
                style={{
                  border: "2px solid rgba(139, 92, 246, 0.2)",
                  animation: "pulse-ring 2s ease-out infinite 0.7s",
                }}
              />
            </>
          )}

          {/* Main orb */}
          <div
            className="w-36 h-36 rounded-full flex items-center justify-center transition-all duration-500"
            style={{
              background: isGeminiSpeaking
                ? "linear-gradient(135deg, #8b5cf6, #6d28d9, #ec4899)"
                : `linear-gradient(135deg, rgba(59, 130, 246, ${0.3 + micLevel * 0.7}), rgba(34, 197, 94, ${0.3 + micLevel * 0.7}))`,
              boxShadow: isGeminiSpeaking
                ? "0 0 60px rgba(139, 92, 246, 0.4), 0 0 120px rgba(139, 92, 246, 0.1)"
                : `0 0 ${20 + micLevel * 60}px rgba(34, 197, 94, ${0.1 + micLevel * 0.3})`,
              animation: isGeminiSpeaking
                ? "float 2s ease-in-out infinite"
                : "none",
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              className="transition-transform duration-300"
              style={{
                transform: isGeminiSpeaking ? "scale(1.1)" : "scale(1)",
              }}
            >
              <path d="M12 2C8 2 5 5 5 9c0 3 1.5 5 3 6.5S12 22 12 22s2.5-3.5 4-5.5S19 12 19 9c0-4-3-7-7-7z" />
              <circle cx="12" cy="9" r="2" />
            </svg>
          </div>
        </div>

        {/* Status text */}
        <p
          className="text-lg font-medium mb-2 transition-all duration-300 text-center max-w-md"
          style={{
            color: isGeminiSpeaking
              ? "var(--accent-purple)"
              : "var(--text-primary)",
          }}
        >
          {isGeminiSpeaking
            ? "Asistan konuşuyor..."
            : "Dinleniyor..."}
        </p>

        {statusText && (
          <p
            className="text-sm text-center max-w-lg animate-[fadeInUp_0.3s_ease-out]"
            style={{ color: "var(--text-muted)" }}
          >
            {statusText}
          </p>
        )}

        {/* Live waveform bars */}
        <div className="flex items-center gap-[3px] h-10 mt-8">
          {Array.from({ length: 20 }).map((_, i) => {
            const barHeight = isGeminiSpeaking
              ? Math.sin((i / 19) * Math.PI) * 0.8 + 0.2
              : Math.sin((i / 19) * Math.PI) * micLevel;
            return (
              <div
                key={i}
                className="w-[3px] rounded-full transition-all"
                style={{
                  height: `${Math.max(4, barHeight * 40)}px`,
                  background: isGeminiSpeaking
                    ? "linear-gradient(to top, #8b5cf6, #ec4899)"
                    : `linear-gradient(to top, #22c55e, #3b82f6)`,
                  opacity: 0.4 + barHeight * 0.6,
                  transitionDuration: isGeminiSpeaking ? "300ms" : "75ms",
                  animation: isGeminiSpeaking
                    ? `waveform ${0.3 + (i % 5) * 0.1}s ease-in-out infinite ${i * 0.05}s`
                    : "none",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Bottom controls */}
      <div
        className="relative z-10 px-6 py-6"
        style={{
          background: "rgba(10, 10, 15, 0.6)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid var(--border-color)",
        }}
      >
        <div className="max-w-xl mx-auto">
          {/* Text input for sending text during call */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
              }}
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendText();
                }}
                placeholder="Randevu, tedavi veya fiyat sorusu yazın..."
                className="flex-1 bg-transparent outline-none text-sm"
                style={{
                  color: "var(--text-primary)",
                }}
              />
              {textInput.trim() && (
                <button
                  onClick={sendText}
                  className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer"
                  style={{ background: "var(--gradient-main)" }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* End call button */}
          <div className="flex justify-center">
            <button
              onClick={endCall}
              className="w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                boxShadow: "0 8px 25px rgba(239, 68, 68, 0.4)",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 0 1-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 0 0-2.67-1.85.996.996 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
              </svg>
            </button>
          </div>

          <p
            className="text-center text-[11px] mt-3"
            style={{ color: "var(--text-muted)" }}
          >
            Randevu, tedavi bilgisi veya fiyatlar hakkında sorabilirsiniz
          </p>
        </div>
      </div>
    </div>
  );
}
