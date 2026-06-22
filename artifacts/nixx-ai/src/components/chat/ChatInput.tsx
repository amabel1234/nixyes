import React, { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
  };

  return (
    <div className="px-4 py-3 shrink-0"
      style={{ background: "hsl(248,30%,6%)", borderTop: "1px solid hsl(248,25%,13%)" }}>
      <div className="flex items-end gap-2 max-w-2xl mx-auto">
        <div className="flex-1 flex items-end rounded-full px-4 py-2 transition-all focus-within:border-purple-500/50"
          style={{ background: "hsl(248,28%,11%)", border: "1px solid hsl(248,25%,18%)" }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan Anda di sini..."
            disabled={disabled}
            className="flex-1 max-h-[160px] min-h-[24px] bg-transparent resize-none outline-none text-white text-sm py-1 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-gray-500"
            rows={1}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          className="shrink-0 h-11 px-5 rounded-full text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed flex items-center gap-2"
          style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">SEND</span>
        </button>
      </div>
    </div>
  );
}
