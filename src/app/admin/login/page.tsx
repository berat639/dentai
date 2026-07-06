"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Giriş başarısız");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#06060b",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient glow effects */}
      <div style={{
        position: "absolute",
        top: "-30%",
        left: "-10%",
        width: "500px",
        height: "500px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)",
        filter: "blur(60px)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        bottom: "-20%",
        right: "-10%",
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 70%)",
        filter: "blur(60px)",
        pointerEvents: "none",
      }} />

      {/* Login Card */}
      <div style={{
        width: "100%",
        maxWidth: "400px",
        padding: "0 24px",
        position: "relative",
        zIndex: 1,
        animation: "adminFadeIn 0.5s ease-out",
      }}>
        <div style={{
          background: "#0d0d14",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: "24px",
          padding: "40px 36px",
          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.5)",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Gradient top line */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: "linear-gradient(90deg, #8b5cf6, #6366f1, #3b82f6)",
            borderRadius: "24px 24px 0 0",
          }} />

          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "18px",
              background: "linear-gradient(135deg, #8b5cf6, #6366f1, #3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 8px 24px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 2C8 2 5 5 5 9c0 3 1.5 5 3 6.5S12 22 12 22s2.5-3.5 4-5.5S19 12 19 9c0-4-3-7-7-7z" />
                <circle cx="12" cy="9" r="2" />
              </svg>
            </div>
            <h1 style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#eeeef2",
              letterSpacing: "-0.03em",
              marginBottom: "6px",
            }}>
              DentAI Admin
            </h1>
            <p style={{
              fontSize: "13px",
              color: "#5a5a72",
              fontWeight: 400,
            }}>
              Yönetim paneline giriş yapın
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.15)",
              borderRadius: "12px",
              padding: "10px 14px",
              marginBottom: "20px",
              fontSize: "12px",
              color: "#f87171",
              fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "18px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#a1a1b5", marginBottom: "7px", letterSpacing: "0.02em" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@dentai.com"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  color: "#eeeef2",
                  background: "#06060b",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  outline: "none",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(139, 92, 246, 0.4)"; e.target.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.08)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255, 255, 255, 0.06)"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#a1a1b5", marginBottom: "7px", letterSpacing: "0.02em" }}>
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  color: "#eeeef2",
                  background: "#06060b",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  outline: "none",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(139, 92, 246, 0.4)"; e.target.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.08)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255, 255, 255, 0.06)"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: 600,
                color: "white",
                background: "linear-gradient(135deg, #8b5cf6, #6366f1, #3b82f6)",
                border: "none",
                cursor: loading ? "wait" : "pointer",
                transition: "all 0.25s",
                boxShadow: "0 4px 16px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
                opacity: loading ? 0.7 : 1,
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255,255,255,0.15)"; }}}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)"; }}
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>

          <p style={{
            textAlign: "center",
            marginTop: "24px",
            fontSize: "11px",
            color: "#5a5a72",
            letterSpacing: "0.02em",
          }}>
            🦷 DentAI Diş Kliniği Yönetim Paneli
          </p>
        </div>
      </div>
    </div>
  );
}
