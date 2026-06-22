import React from "react";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { AI_MODELS } from "@/lib/models";
import type { OpenaiConversation } from "@workspace/api-client-react";

interface ConversationSidebarProps {
  conversations: OpenaiConversation[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onNew: () => void;
  onDelete: (id: number) => void;
  onClearChat: () => void;
  selectedModelId: string;
  onModelChange: (id: string) => void;
  open: boolean;
  userImageUrl?: string;
  userName?: string;
  basePath: string;
}

const MENU_ITEMS = [
  { emoji: "👨‍💻", label: "DEVELOPER 🚀", action: () => alert("Developer: Nixx Team\nContact: t.me/nixsukakamu") },
  { emoji: "🏪", label: "STORE MENU 🛍️", action: () => window.open("https://www.privatedomain.my.id", "_blank") },
  { emoji: "👥", label: "COMMUNITY 🌐", action: () => window.open("https://t.me/nixsukakamu", "_blank") },
  { emoji: "💖", label: "SAWERIA ✨", action: () => window.open("https://nixx-donation.vercel.app", "_blank") },
  { emoji: "⬇️", label: "NIXX DR 🚀", action: () => window.open("https://nixdr.vercel.app", "_blank") },
];

export function ConversationSidebar({
  conversations, activeId, onSelect, onNew, onDelete, onClearChat,
  selectedModelId, onModelChange, open, userImageUrl, userName,
}: ConversationSidebarProps) {
  const { logout } = useAuth();

  return (
    <aside className={`nx-sidebar ${open ? "active" : ""}`}>
      <div className="nx-sidebar-user">
        <div className="nx-sidebar-avatar">
          {userImageUrl
            ? <img src={userImageUrl} alt={userName} />
            : (userName?.charAt(0).toUpperCase() ?? "U")}
        </div>
        <div>
          <div className="nx-sidebar-username">{userName}</div>
          <div className="nx-sidebar-sub">Nixx AI</div>
        </div>
      </div>

      <button className="nx-sidebar-btn" onClick={onNew}>
        ✏️ PERCAKAPAN BARU
      </button>

      {conversations.length > 0 && (
        <>
          <div className="nx-sidebar-section">Percakapan</div>
          {conversations.slice(0, 15).map((conv) => (
            <button
              key={conv.id}
              className={`nx-sidebar-btn ${activeId === conv.id ? "active-conv" : ""}`}
              onClick={() => onSelect(conv.id)}
            >
              <span className="nx-conv-item" style={{ width: "100%", display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: 15, flexShrink: 0 }}>💬</span>
                <span className="nx-conv-title" style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: "0 6px" }}>
                  {conv.title || "Percakapan — Nixx AI"}
                </span>
                <button
                  className="nx-conv-del"
                  onClick={(e) => { e.stopPropagation(); if (confirm("Hapus percakapan ini?")) onDelete(conv.id); }}
                  title="Hapus"
                >🗑️</button>
              </span>
            </button>
          ))}
        </>
      )}

      <div className="nx-sidebar-section">Menu</div>
      {MENU_ITEMS.map((item) => (
        <button key={item.label} className="nx-sidebar-btn" onClick={item.action}>
          <span style={{ fontSize: 16 }}>{item.emoji}</span>
          {item.label}
        </button>
      ))}
      <button className="nx-sidebar-btn nx-clear-btn" onClick={onClearChat}>
        🗑️ CLEAR CHAT
      </button>

      <div className="nx-model-selector">
        <span className="nx-model-label">Select AI Model:</span>
        {AI_MODELS.map((model) => (
          <button
            key={model.id}
            className={`nx-model-option ${selectedModelId === model.id ? "active" : ""}`}
            onClick={() => onModelChange(model.id)}
          >
            <span style={{ fontSize: 15 }}>{model.emoji}</span>
            <span style={{ flex: 1, textAlign: "left" }}>{model.label}</span>
            <span className="nx-model-badge">{model.badge}</span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <button className="nx-sidebar-btn nx-clear-btn" onClick={logout}>
          [→ Keluar
        </button>
      </div>
    </aside>
  );
}
