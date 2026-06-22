import React from "react";
  import type { LocalConversation } from "@/pages/chat";

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  interface Model {
    id: string; label: string; badge: string; icon: string; off: boolean;
  }

  interface ChatSidebarProps {
    conversations: LocalConversation[];
    activeId: string | null;
    selectedModel: string;
    models: Model[];
    onSelect: (id: string) => void;
    onNewChat: () => void;
    onDelete: (id: string) => void;
    onClearChat: () => void;
    onSelectModel: (modelId: string) => void;
  }

  export default function ChatSidebar({
    conversations, activeId, selectedModel, models,
    onSelect, onNewChat, onDelete, onClearChat, onSelectModel,
  }: ChatSidebarProps) {

    return (
      <>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, paddingBottom:12, borderBottom:"1px solid var(--nx-border)" }}>
          <img src={`${basePath}/logo.svg`} alt="Nixx AI" style={{ width:32, height:32 }}
            onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
          <div>
            <div style={{ fontWeight:800, fontSize:"1.05rem", color:"var(--nx-text)" }}>Nixx AI</div>
            <div style={{ fontSize:".68rem", color:"var(--nx-text-muted)" }}>26 AI Models · Free ✨</div>
          </div>
        </div>

        {/* New Chat */}
        <button className="nx-sidebar-btn" onClick={onNewChat} data-testid="button-new-chat">
          <span>✏️</span> PERCAKAPAN BARU
        </button>

        {/* Conversation list */}
        {conversations.length > 0 && (
          <div style={{ marginBottom:10, maxHeight:"30vh", overflowY:"auto" }}>
            {conversations.map(conv => (
              <button key={conv.id} className="nx-sidebar-btn"
                onClick={() => onSelect(conv.id)}
                style={{
                  fontWeight: activeId===conv.id ? 700 : 400,
                  fontSize:".8rem", marginBottom:4,
                  position:"relative", paddingRight:38,
                  background: activeId===conv.id ? "var(--nx-accent)" : undefined,
                  color: activeId===conv.id ? "#fff" : undefined,
                }}>
                <span>💬</span>
                <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>
                  {conv.title}
                </span>
                <span role="button"
                  onClick={e => { e.stopPropagation(); if (confirm("Hapus percakapan ini?")) onDelete(conv.id); }}
                  style={{ position:"absolute", right:10, fontSize:11, opacity:.55, cursor:"pointer", padding:"2px 4px" }}
                  title="Hapus">🗑</span>
              </button>
            ))}
          </div>
        )}

        {/* Clear Chat */}
        <button className="nx-sidebar-btn nx-clear-btn" onClick={onClearChat}>
          <span>🗑️</span> CLEAR CHAT
        </button>

        {/* Links */}
        <button className="nx-sidebar-btn" onClick={() => alert("Developer: Nixx Team\nContact: t.me/nixsukakamu")}>
          <span>👤</span> DEVELOPER 🚀
        </button>
        <button className="nx-sidebar-btn" onClick={() => window.open("www.privatedomain.my.id","_blank")}>
          <span>📚</span> STORE MENU 🛍️
        </button>
        <button className="nx-sidebar-btn" onClick={() => window.open("https://t.me/nixsukakamu","_blank")}>
          <span>💫</span> COMMUNITY
        </button>
        <button className="nx-sidebar-btn nx-nixdr-btn" onClick={() => window.open("https://nixdr.vercel.app","_blank")}>
          <span>⬇️</span> NIXX DR
        </button>

        {/* Model Selector */}
        <div className="nx-model-selector">
          <span className="nx-model-label">SELECT AI MODEL:</span>
          {models.map(model => (
            <button key={model.id}
              className={`nx-model-option${model.id===selectedModel?" active":""}${model.off?" off":""}`}
              onClick={() => !model.off && onSelectModel(model.id)}
              data-testid={`button-model-${model.id}`}>
              <span>{model.icon}</span>
              {model.label}
              <span className="nx-model-badge">{model.badge}</span>
            </button>
          ))}
        </div>
      </>
    );
  }
  
