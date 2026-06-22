import React from "react";

const FEATURES = [
  { emoji: "🚀", title: "26 Model AI Gratis", desc: "Nixx AI, Grok, Gemini, Llama, GPT — semua tersedia tanpa biaya." },
  { emoji: "💬", title: "Chat Bahasa Indonesia", desc: "Santai, natural, dan mudah dimengerti — bukan jawaban robot kaku." },
  { emoji: "⚡", title: "Streaming Real-Time", desc: "Respons muncul langsung karakter per karakter, tanpa loading lama." },
  { emoji: "🔒", title: "Aman & Privat", desc: "Percakapanmu tersimpan aman, tidak dibagikan ke pihak manapun." },
];

export default function LandingPage() {
  return (
    <div className="nx-landing">
      {/* Header */}
      <header className="nx-landing-header">
        <div className="nx-landing-logo">
          <div className="nx-landing-logo-icon">🧠</div>
          <span className="nx-landing-logo-text">Nixx AI</span>
        </div>
        <nav className="nx-landing-nav">
          <a href="/sign-in" className="nx-landing-btn-outline">Masuk</a>
          <a href="/sign-up" className="nx-landing-btn-solid">Daftar</a>
        </nav>
      </header>

      {/* Hero */}
      <div className="nx-landing-hero">
        <div className="nx-landing-hero-icon">🧠</div>

        <h1 className="nx-landing-title">
          Selamat datang di <span>Nixx AI</span>
        </h1>
        <p className="nx-landing-sub">
          Asisten AI pintar gratis selamanya — 26 model AI dalam satu platform!
        </p>
        <p className="nx-landing-free">✨ Tanpa biaya · Tanpa iklan · Selamanya gratis</p>

        <a href="/sign-up" className="nx-landing-cta">
          ✨ Mulai Chat Sekarang
        </a>

        <p className="nx-landing-signin">
          Sudah punya akun?{" "}
          <a href="/sign-in">Masuk di sini</a>
        </p>

        {/* Features */}
        <div className="nx-landing-features">
          {FEATURES.map((f) => (
            <div key={f.title} className="nx-landing-feature">
              <span className="nx-landing-feature-icon">{f.emoji}</span>
              <div>
                <div className="nx-landing-feature-title">{f.title}</div>
                <div className="nx-landing-feature-desc">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Model pills */}
        <div className="nx-landing-models">
          <p className="nx-landing-models-title">Model Tersedia</p>
          <div className="nx-landing-pills">
            {["Nixx AI","Christy AI","Grok 4","Gemini 2.5","GPT-4o","Llama-4","Mistral","Copilot","Muslim AI","Venice AI","Ripple AI","+ 15 lagi"].map((m) => (
              <span key={m} className="nx-landing-pill">{m}</span>
            ))}
          </div>
        </div>
      </div>

      <footer className="nx-landing-footer">
        © 2025 Nixx AI · by Nixx Team ·{" "}
        <a href="https://t.me/nixsukakamu" target="_blank" rel="noopener noreferrer"
          style={{ color: "#a855f7", textDecoration: "none" }}>
          t.me/nixsukakamu
        </a>
        {" "}·{" "}
        <a href="/syarat" style={{ color: "#a855f7", textDecoration: "none" }}>
          Syarat &amp; Ketentuan
        </a>
      </footer>
    </div>
  );
}
