import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Copy, Check, Volume2, VolumeX, Mic, MicOff,
  Paperclip, Download, FileText, X, ChevronDown,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
  attachment?: { name: string; type: string };
}

interface ChatThreadProps {
  conversationId: number;
  selectedModel: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getTime() {
  const n = new Date();
  return n.getHours().toString().padStart(2, "0") + ":" + n.getMinutes().toString().padStart(2, "0");
}

function stripMarkdown(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/[#*_~>\[\]()!]/g, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .trim();
}

// ─── Inline CSS ───────────────────────────────────────────────────────────────
const THREAD_CSS = `
  @keyframes msgIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes tDot { 0%,80%,100%{transform:scale(0.6);opacity:.4} 40%{transform:scale(1);opacity:1} }
  @keyframes curBlink { 0%,100%{opacity:1} 50%{opacity:0} }
  .nx-msg-bubble { animation: msgIn .25s ease both; }
  .nx-typing-dot { animation: tDot 1.4s ease-in-out infinite; }
  .nx-typing-dot:nth-child(2) { animation-delay: .15s; }
  .nx-typing-dot:nth-child(3) { animation-delay: .3s; }
  .nx-cursor { display:inline-block; width:2px; height:1em; background:currentColor; margin-left:2px; vertical-align:middle; animation:curBlink .7s step-end infinite; }
  .nx-send-animated:not(:disabled):hover { transform:scale(1.08); }
  .nx-send-animated { transition:transform .15s,background .15s; }
  .nx-input-grow { resize:none; overflow-y:hidden; }
  .nx-ai-msg:hover .copy-btn { opacity:1 !important; }
  .nx-msg-content .prose h1,.nx-msg-content .prose h2,.nx-msg-content .prose h3 { margin-top:0.8em; margin-bottom:0.3em; }
  .nx-msg-content .prose ul,.nx-msg-content .prose ol { padding-left:1.4em; }
  .nx-msg-content .prose p:last-child { margin-bottom:0; }
  .nx-msg-content .prose p:first-child { margin-top:0; }
  .nx-tts-btn { background:none; border:none; cursor:pointer; padding:3px 5px; border-radius:6px; transition:all .15s; opacity:0; }
  .nx-ai-msg:hover .nx-tts-btn { opacity:1; }
  .nx-tts-btn:hover { background: rgba(168,85,247,0.15); }
  .nx-tts-btn.speaking { opacity:1; color:#a855f7; }
  .nx-toolbar-btn { background:none; border:none; cursor:pointer; border-radius:8px; padding:5px 7px; transition:all .15s; display:flex; align-items:center; justify-content:center; color:var(--nx-text-muted); }
  .nx-toolbar-btn:hover { background:rgba(168,85,247,0.12); color:#a855f7; }
  .nx-toolbar-btn.active { color:#a855f7; background:rgba(168,85,247,0.18); }
  .nx-export-dropdown { position:absolute; bottom:calc(100% + 6px); left:0; background:var(--nx-card-bg,#1e1a2e); border:1px solid var(--nx-border,#2d2550); border-radius:10px; padding:4px; min-width:160px; box-shadow:0 8px 24px rgba(0,0,0,.35); z-index:50; }
  .nx-export-item { display:flex; align-items:center; gap:8px; width:100%; background:none; border:none; cursor:pointer; padding:8px 12px; border-radius:7px; font-size:13px; color:var(--nx-text,#f0eeff); transition:background .12s; text-align:left; }
  .nx-export-item:hover { background:rgba(168,85,247,0.12); color:#a855f7; }
  .nx-attach-pill { display:inline-flex; align-items:center; gap:5px; padding:3px 10px 3px 8px; border-radius:20px; font-size:11.5px; font-weight:500; margin-bottom:5px; }
  .nx-attach-pill-remove { background:none; border:none; cursor:pointer; padding:0 0 0 4px; display:flex; align-items:center; opacity:.6; }
  .nx-attach-pill-remove:hover { opacity:1; }
  @keyframes micPulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.4)} 50%{box-shadow:0 0 0 6px rgba(239,68,68,0)} }
  .nx-mic-active { animation: micPulse 1.2s ease-in-out infinite; }
`;

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ChatThread({ conversationId, selectedModel }: ChatThreadProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core chat state
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Feature states
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string; type: string } | null>(null);
  const [showExport, setShowExport] = useState(false);

  // Refs for features
  const recognitionRef = useRef<any>(null);

  // Reset messages when conversation changes
  useEffect(() => {
    setMessages([]);
    setInput("");
    setAttachedFile(null);
    inputRef.current?.focus();
  }, [conversationId]);

  // Scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamContent]);

  // Stop TTS when component unmounts
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  // ── Auto-grow textarea ──────────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  // ── Copy handler ────────────────────────────────────────────────────────────
  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── FEATURE 1: Upload File ──────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const textExts = [".txt", ".md", ".js", ".ts", ".tsx", ".jsx", ".json", ".csv",
      ".html", ".css", ".py", ".java", ".c", ".cpp", ".xml", ".yaml", ".yml", ".sh", ".sql"];
    const isText = textExts.some(ext => file.name.toLowerCase().endsWith(ext));

    if (isText) {
      const reader = new FileReader();
      reader.onload = ev => {
        const content = ev.target?.result as string;
        const truncated = content.length > 8000 ? content.slice(0, 8000) + "\n... [dipotong]" : content;
        setAttachedFile({ name: file.name, content: truncated, type: "text" });
      };
      reader.readAsText(file);
    } else if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = ev => {
        setAttachedFile({ name: file.name, content: ev.target?.result as string, type: "image" });
      };
      reader.readAsDataURL(file);
    } else if (file.name.endsWith(".pdf")) {
      setAttachedFile({ name: file.name, content: "[File PDF terlampir — jelaskan isi atau pertanyaanmu tentang file ini]", type: "binary" });
    } else if (file.name.endsWith(".doc") || file.name.endsWith(".docx")) {
      setAttachedFile({ name: file.name, content: "[File Word terlampir — jelaskan isi atau pertanyaanmu tentang file ini]", type: "binary" });
    } else {
      setAttachedFile({ name: file.name, content: `[File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]`, type: "binary" });
    }
    inputRef.current?.focus();
  };

  // ── FEATURE 2: Text to Speech ───────────────────────────────────────────────
  const handleSpeak = (content: string, id: string) => {
    if (!window.speechSynthesis) return alert("Browser kamu tidak mendukung Text to Speech.");
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(stripMarkdown(content));
    utter.lang = "id-ID";
    utter.rate = 0.93;
    utter.pitch = 1.05;
    utter.onstart = () => setSpeakingId(id);
    utter.onend = () => setSpeakingId(null);
    utter.onerror = () => setSpeakingId(null);
    window.speechSynthesis.speak(utter);
  };

  // ── FEATURE 3: Speech to Text ───────────────────────────────────────────────
  const handleMicToggle = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return alert("Browser kamu tidak mendukung Speech to Text.\nCoba gunakan Chrome atau Edge.");

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = "id-ID";
    rec.interimResults = true;
    rec.continuous = false;

    let finalText = "";
    rec.onstart = () => setIsListening(true);
    rec.onresult = (evt: any) => {
      const transcript = Array.from(evt.results as SpeechRecognitionResultList)
        .map((r: SpeechRecognitionResult) => r[0].transcript)
        .join("");
      if (evt.results[evt.results.length - 1].isFinal) {
        finalText = transcript;
      }
      setInput(prev => {
        const base = prev.replace(/\[suara: .*?\]/g, "").trimEnd();
        return (base ? base + " " : "") + transcript;
      });
    };
    rec.onend = () => {
      setIsListening(false);
      if (finalText) {
        setInput(prev => {
          const base = prev.replace(/\[suara: .*?\]/g, "").trimEnd();
          return (base ? base + " " : "") + finalText;
        });
      }
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
        inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 140) + "px";
      }
    };
    rec.onerror = () => { setIsListening(false); };
    rec.start();
  };

  // ── FEATURE 4: Export Chat ──────────────────────────────────────────────────
  const exportTxt = () => {
    if (!messages.length) return alert("Belum ada percakapan untuk diekspor.");
    const lines = messages.map(m =>
      `[${m.role === "user" ? "Kamu" : "Nixx AI"}] ${m.time}\n${m.content}`
    ).join("\n\n---\n\n");
    const header = `Nixx AI — Export Percakapan\nTanggal: ${new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}\nModel: ${selectedModel}\n\n${"=".repeat(50)}\n\n`;
    const blob = new Blob([header + lines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `nixx-chat-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  const exportPdf = () => {
    if (!messages.length) return alert("Belum ada percakapan untuk diekspor.");
    const rows = messages.map(m => {
      const who = m.role === "user" ? "🙋 Kamu" : "🧠 Nixx AI";
      const safe = m.content.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
      return `<div class="msg ${m.role}"><div class="who">${who} <span class="t">${m.time}</span></div><div class="body">${safe}</div></div>`;
    }).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Nixx AI Chat</title>
    <style>
      body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:24px;color:#1a1a2e}
      h1{font-size:20px;margin-bottom:4px}p.sub{color:#666;font-size:13px;margin-bottom:20px}
      .msg{margin:12px 0;padding:12px 16px;border-radius:10px;font-size:14px;line-height:1.6}
      .msg.user{background:#ede9fe;border-left:3px solid #7c3aed}
      .msg.assistant{background:#f5f3ff;border-left:3px solid #a855f7}
      .who{font-weight:bold;font-size:12px;margin-bottom:5px;color:#6d28d9}
      .t{font-weight:normal;color:#888;margin-left:6px}
      .body{white-space:pre-wrap}
      @media print{body{padding:0}}
    </style></head><body>
    <h1>🧠 Nixx AI — Export Percakapan</h1>
    <p class="sub">Tanggal: ${new Date().toLocaleDateString("id-ID", { dateStyle: "long" })} · Model: ${selectedModel} · ${messages.length} pesan</p>
    ${rows}
    </body></html>`;
    const w = window.open("", "_blank");
    if (!w) return alert("Popup diblokir browser. Izinkan popup lalu coba lagi.");
    w.document.write(html);
    w.document.close();
    w.print();
    setShowExport(false);
  };

  // ── Send Message ────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = input.trim();
    if ((!text && !attachedFile) || isStreaming) return;

    // Build user message content
    let userContent = text;
    if (attachedFile) {
      if (attachedFile.type === "text") {
        userContent = (text ? text + "\n\n" : "") +
          `📎 **File: ${attachedFile.name}**\n\`\`\`\n${attachedFile.content}\n\`\`\``;
      } else if (attachedFile.type === "image") {
        userContent = (text ? text + "\n\n" : "") + `📎 [Gambar dilampirkan: ${attachedFile.name}]`;
      } else {
        userContent = (text ? text + "\n\n" : "") + attachedFile.content;
      }
    }

    const userMsg: LocalMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userContent,
      time: getTime(),
      attachment: attachedFile ? { name: attachedFile.name, type: attachedFile.type } : undefined,
    };

    const nextMsgs = [...messages, userMsg];
    setMessages(nextMsgs);
    setInput("");
    setAttachedFile(null);
    if (inputRef.current) inputRef.current.style.height = "auto";
    setIsStreaming(true);
    setStreamContent("");

    const apiMessages = nextMsgs.map(m => ({ role: m.role, content: m.content }));
    let fullResponse = "";

    try {
      const res = await fetch("/api/openai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, model: selectedModel }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);

      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.replace(/^data: /, "").trim();
          if (!line) continue;
          try {
            const evt = JSON.parse(line) as { content?: string; done?: boolean };
            if (evt.content) { fullResponse += evt.content; setStreamContent(s => s + evt.content); }
          } catch { /* skip */ }
        }
      }
    } catch {
      fullResponse = "Server AI sedang sibuk. Coba lagi ya! 🙏";
      setStreamContent(fullResponse);
    }

    const aiMsg: LocalMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: fullResponse || "Maaf, tidak ada respons.",
      time: getTime(),
    };
    setMessages(prev => [...prev, aiMsg]);
    setIsStreaming(false);
    setStreamContent("");
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{THREAD_CSS}</style>

      {/* ── Messages ── */}
      <div className="nx-chat-messages">
        {messages.length === 0 && !isStreaming && (
          <div style={{ textAlign: "center", color: "var(--nx-text-muted)", fontSize: 13, marginTop: 40, opacity: .7 }}>
            💬 Ketik pesan pertama kamu…
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`nx-msg-bubble nx-message ${msg.role === "user" ? "nx-user-msg" : "nx-ai-msg"}`}>
            {msg.role === "assistant" && (
              <div style={{ fontSize: "0.7rem", color: "var(--nx-text-muted)", marginBottom: 4, display: "flex", alignItems: "center", gap: 5, opacity: .7 }}>
                <span style={{ fontSize: "0.9rem" }}>🧠</span> Nixx AI
              </div>
            )}

            {msg.role === "assistant" ? (
              <div className="nx-msg-content" style={{ position: "relative" }}>
                <div className="prose prose-sm max-w-none prose-invert prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent prose-headings:font-bold prose-headings:text-white prose-strong:text-white prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code(props: any) {
                        const { children, className, inline } = props;
                        const match = /language-(\w+)/.exec(className || "");
                        const codeStr = String(children).replace(/\n$/, "");
                        if (!inline && match) {
                          return (
                            <div className="relative group/code rounded-xl overflow-hidden my-3"
                              style={{ border: "1px solid hsl(248,25%,22%)" }}>
                              <div className="flex items-center justify-between px-3 py-2"
                                style={{ background: "hsl(248,30%,7%)", borderBottom: "1px solid hsl(248,25%,22%)" }}>
                                <span className="text-xs font-mono" style={{ color: "hsl(248,15%,55%)" }}>{match[1]}</span>
                                <button onClick={() => navigator.clipboard.writeText(codeStr)}
                                  className="h-6 w-6 flex items-center justify-center rounded opacity-0 group-hover/code:opacity-100 transition-opacity"
                                  style={{ color: "hsl(248,15%,60%)" }}>
                                  <Copy style={{ width: 12, height: 12 }} />
                                </button>
                              </div>
                              <SyntaxHighlighter language={match[1]} style={vscDarkPlus}
                                customStyle={{ margin: 0, background: "transparent", padding: "12px 16px", fontSize: "12px" }}>
                                {codeStr}
                              </SyntaxHighlighter>
                            </div>
                          );
                        }
                        return (
                          <code className="px-1.5 py-0.5 rounded text-xs font-mono"
                            style={{ background: "hsl(248,25%,18%)", color: "#a855f7" }}>
                            {children}
                          </code>
                        );
                      },
                      table(props: any) {
                        return <div style={{ overflowX: "auto", margin: "8px 0" }}><table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.8rem" }}>{props.children}</table></div>;
                      },
                      th(props: any) {
                        return <th style={{ padding: "6px 12px", borderBottom: "2px solid hsl(248,25%,25%)", textAlign: "left", color: "hsl(248,15%,80%)", fontWeight: 600 }}>{props.children}</th>;
                      },
                      td(props: any) {
                        return <td style={{ padding: "6px 12px", borderBottom: "1px solid hsl(248,25%,18%)", color: "hsl(0,0%,85%)" }}>{props.children}</td>;
                      },
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {/* TTS + Copy buttons */}
                <div style={{ position: "absolute", top: 0, right: 0, display: "flex", gap: 2 }}>
                  {/* 🔊 Text to Speech */}
                  <button
                    className={`nx-tts-btn${speakingId === msg.id ? " speaking" : ""}`}
                    onClick={() => handleSpeak(msg.content, msg.id)}
                    title={speakingId === msg.id ? "Stop bicara" : "Baca dengan suara"}
                    style={{ color: speakingId === msg.id ? "#a855f7" : "hsl(248,15%,60%)" }}
                  >
                    {speakingId === msg.id
                      ? <VolumeX style={{ width: 12, height: 12 }} />
                      : <Volume2 style={{ width: 12, height: 12 }} />}
                  </button>
                  {/* Copy */}
                  <button
                    onClick={() => handleCopy(msg.content, msg.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "3px 5px", borderRadius: 6, opacity: 0, transition: "opacity .15s", color: "hsl(248,15%,60%)" }}
                    className="copy-btn"
                    title="Salin"
                  >
                    {copiedId === msg.id
                      ? <Check style={{ width: 12, height: 12, color: "#4ade80" }} />
                      : <Copy style={{ width: 12, height: 12 }} />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="nx-msg-content">
                {msg.attachment && (
                  <div className="nx-attach-pill" style={{ background: "rgba(168,85,247,0.18)", color: "#c084fc" }}>
                    <Paperclip style={{ width: 10, height: 10 }} />
                    {msg.attachment.name}
                  </div>
                )}
                <div>{input !== msg.content ? msg.content.replace(/📎 \*\*File:.*?\*\*\n```[\s\S]*?```/g, "").replace(/📎 \[Gambar dilampirkan:.*?\]/g, "").replace(/📎 .*\n/g, "").trim() || msg.content : msg.content}</div>
              </div>
            )}

            <div className="nx-msg-time">{msg.time}</div>
          </div>
        ))}

        {/* Streaming bubble */}
        {isStreaming && streamContent && (
          <div className="nx-msg-bubble nx-message nx-ai-msg">
            <div style={{ fontSize: "0.7rem", color: "var(--nx-text-muted)", marginBottom: 4, display: "flex", alignItems: "center", gap: 5, opacity: .7 }}>
              <span style={{ fontSize: "0.9rem" }}>🧠</span> Nixx AI
            </div>
            <div className="nx-msg-content">
              <div className="prose prose-sm max-w-none prose-invert prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent prose-headings:font-bold prose-headings:text-white prose-strong:text-white prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamContent}</ReactMarkdown>
              </div>
              <span className="nx-cursor" />
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {isStreaming && !streamContent && (
          <div className="nx-message nx-ai-msg nx-typing" style={{ padding: "12px 16px" }}>
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              {[0, 1, 2].map(i => (
                <span key={i} className="nx-typing-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--nx-accent)", display: "inline-block" }} />
              ))}
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* ── Input Area ── */}
      <div style={{ padding: "8px 12px 10px", borderTop: "1px solid var(--nx-border)", background: "var(--nx-card-bg)", flexShrink: 0 }}>

        {/* Attachment preview */}
        {attachedFile && (
          <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
            <div className="nx-attach-pill" style={{ background: "rgba(168,85,247,0.15)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.25)" }}>
              <Paperclip style={{ width: 11, height: 11 }} />
              <span>{attachedFile.name}</span>
              <button className="nx-attach-pill-remove" onClick={() => setAttachedFile(null)} title="Hapus lampiran">
                <X style={{ width: 10, height: 10, color: "#c084fc" }} />
              </button>
            </div>
          </div>
        )}

        {/* Toolbar buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 5 }}>

          {/* 📎 Upload File */}
          <button
            className="nx-toolbar-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Upload file (TXT, gambar, PDF, Word)"
          >
            <Paperclip style={{ width: 15, height: 15 }} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.js,.ts,.tsx,.jsx,.json,.csv,.html,.css,.py,.java,.c,.cpp,.xml,.yaml,.yml,.sh,.sql,.pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp"
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />

          {/* 🎤 Speech to Text */}
          <button
            className={`nx-toolbar-btn${isListening ? " active" : ""}${isListening ? " nx-mic-active" : ""}`}
            onClick={handleMicToggle}
            title={isListening ? "Stop rekam suara" : "Input dengan suara"}
            style={isListening ? { color: "#ef4444", background: "rgba(239,68,68,0.12)" } : {}}
          >
            {isListening ? <MicOff style={{ width: 15, height: 15 }} /> : <Mic style={{ width: 15, height: 15 }} />}
          </button>

          {/* ⬇️ Export Chat */}
          <div style={{ position: "relative" }}>
            <button
              className="nx-toolbar-btn"
              onClick={() => setShowExport(v => !v)}
              title="Export percakapan"
            >
              <Download style={{ width: 15, height: 15 }} />
            </button>
            {showExport && (
              <div className="nx-export-dropdown">
                <button className="nx-export-item" onClick={exportTxt}>
                  <FileText style={{ width: 14, height: 14, color: "#a855f7" }} />
                  Export sebagai TXT
                </button>
                <button className="nx-export-item" onClick={exportPdf}>
                  <Download style={{ width: 14, height: 14, color: "#a855f7" }} />
                  Export sebagai PDF
                </button>
              </div>
            )}
          </div>

          {/* Label status */}
          <span style={{ fontSize: 11, color: "var(--nx-text-muted)", marginLeft: 4, opacity: .7 }}>
            {isListening ? "🔴 Merekam..." : attachedFile ? `📎 ${attachedFile.name}` : ""}
          </span>
        </div>

        {/* Text input + Send */}
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea
            ref={inputRef}
            className="nx-input nx-input-grow"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKey}
            placeholder={isListening ? "🎤 Sedang mendengarkan..." : "Ketik pesan… (Enter kirim, Shift+Enter baris baru)"}
            rows={1}
            disabled={isStreaming}
            style={{ flex: 1, minHeight: 42, maxHeight: 140, borderRadius: 12, padding: "10px 14px", lineHeight: 1.5 }}
          />
          <button
            className="nx-send-btn nx-send-animated"
            onClick={handleSend}
            disabled={(!input.trim() && !attachedFile) || isStreaming}
            style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", padding: 0 }}
          >
            {isStreaming ? "⏳" : "➤"}
          </button>
        </div>
      </div>

      {/* Close export dropdown on outside click */}
      {showExport && (
        <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setShowExport(false)} />
      )}
    </>
  );
}
