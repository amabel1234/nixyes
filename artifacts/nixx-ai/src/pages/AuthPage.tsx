import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function AuthPage({ defaultMode }: { defaultMode: "login" | "register" }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(defaultMode);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        if (password.length < 6) throw new Error("Password minimal 6 karakter");
        await register(email, username, password);
      }
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(m => m === "login" ? "register" : "login");
    setError("");
    setEmail(""); setUsername(""); setPassword("");
  };

  return (
    <div className="nx-auth-bg">
      <div className="nx-auth-glow" />
      <div className="nx-auth-card">
        <div className="nx-auth-logo-wrap">
          <div className="nx-auth-logo-icon">🧠</div>
          <span className="nx-auth-logo-text">Nixx AI</span>
        </div>

        <h2 className="nx-auth-heading">
          {mode === "login" ? "Selamat Datang" : "Buat Akun Baru"}
        </h2>
        <p className="nx-auth-subtext">
          {mode === "login" ? "Masuk untuk mulai chat AI gratis" : "Daftar gratis, langsung bisa pakai!"}
        </p>

        <form onSubmit={handleSubmit} className="nx-auth-form">
          <div className="nx-auth-field">
            <label className="nx-auth-label">Email</label>
            <input
              type="email"
              className="nx-auth-input"
              placeholder="contoh@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {mode === "register" && (
            <div className="nx-auth-field">
              <label className="nx-auth-label">Username</label>
              <input
                type="text"
                className="nx-auth-input"
                placeholder="Username kamu"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                minLength={3}
                autoComplete="username"
              />
            </div>
          )}

          <div className="nx-auth-field">
            <label className="nx-auth-label">Password</label>
            <div className="nx-auth-pass-wrap">
              <input
                type={showPass ? "text" : "password"}
                className="nx-auth-input nx-auth-pass-input"
                placeholder={mode === "login" ? "Password kamu" : "Min. 6 karakter"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                className="nx-auth-pass-toggle"
                onClick={() => setShowPass(s => !s)}
                tabIndex={-1}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {error && (
            <div className="nx-auth-error">
              ⚠️ {error}
            </div>
          )}

          <button type="submit" className="nx-auth-submit" disabled={loading}>
            {loading ? (
              <span className="nx-auth-spinner" />
            ) : (
              mode === "login" ? "✓ Masuk" : "✓ Daftar Sekarang"
            )}
          </button>
        </form>

        <div className="nx-auth-divider">
          <span>{mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}</span>
          <button className="nx-auth-switch-btn" onClick={switchMode}>
            {mode === "login" ? "Daftar di sini" : "Masuk di sini"}
          </button>
        </div>

        <a href="/" className="nx-auth-back-link">← Kembali ke beranda</a>
      </div>
    </div>
  );
}
