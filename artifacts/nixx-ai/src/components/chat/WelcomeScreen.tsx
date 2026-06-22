import React from "react";

const SAMPLE_PROMPTS = [
  { emoji: "📝", text: "Buatkan cerita pendek yang menarik" },
  { emoji: "💻", text: "Bantu saya belajar coding Python" },
  { emoji: "🎨", text: "Ide bisnis online yang menguntungkan" },
  { emoji: "📚", text: "Jelaskan konsep ini dengan mudah" },
];

interface WelcomeScreenProps {
  onPrompt?: (text: string) => void;
}

export function WelcomeScreen({ onPrompt }: WelcomeScreenProps) {
  return (
    <div className="nx-welcome">
      <div className="nx-welcome-icon">🧠</div>
      <h2 className="nx-welcome-title">
        Halo! Ada yang bisa <span>dibantu?</span>
      </h2>
      <p className="nx-welcome-desc">
        Pilih salah satu pertanyaan di bawah atau ketik sendiri
      </p>
      <div className="nx-welcome-features">
        {SAMPLE_PROMPTS.map((p) => (
          <button
            key={p.text}
            className="nx-welcome-feature"
            onClick={() => onPrompt?.(p.text)}
          >
            <span className="nx-welcome-feature-icon">{p.emoji}</span>
            {p.text}
          </button>
        ))}
      </div>
    </div>
  );
}
