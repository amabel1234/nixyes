import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { WelcomeScreen } from "@/components/chat/WelcomeScreen";
import { getModelById } from "@/lib/models";

// ─── Module-level counter — diinisialisasi dari localStorage agar tidak bentrok
let ctr = (() => {
  try {
    const saved = localStorage.getItem("nx-chat-history");
    if (!saved) return Date.now();
    const arr = JSON.parse(saved);
    if (!Array.isArray(arr) || arr.length === 0) return Date.now();
    return Math.max(Date.now(), ...arr.map((c: { id: number }) => c.id ?? 0));
  } catch { return Date.now(); }
})();

// ─── Types ────────────────────────────────────────────────────────────────────
interface MsgAttachment {
  kind: "image" | "file" | "audio" | "generated-image";
  name: string;
  size: string;
  dataUrl?: string;
  imageUrl?: string;
  prompt?: string;
}

interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  text?: string;
  attach?: MsgAttachment;
  createdAt: string;
}

interface LocalConv {
  id: number;
  title: string;
  modelId: string;
  messages: LocalMessage[];
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(d: string) {
  try { return new Date(d).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }); }
  catch { return ""; }
}
function stripMd(t: string) {
  return t.replace(/```[\s\S]*?```/g, "").replace(/`[^`]+`/g, "")
    .replace(/[#*_~>\[\]()!]/g, "").replace(/\n+/g, " ").trim();
}
function fmtSize(b: number) {
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  return (b / 1024 / 1024).toFixed(1) + " MB";
}

// ─── Ekstrak teks dari PDF (tanpa library eksternal) ─────────────────────────
function extractPdfText(arrayBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(arrayBuffer);
  const raw = new TextDecoder("latin1").decode(bytes);
  const parts: string[] = [];
  // Ambil string di dalam kurung setelah operator text PDF: (teks) Tj / [(teks)] TJ
  const re = /\(([^)\\]{1,300})\)\s*T[jJ]/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    const s = m[1].replace(/\\n/g, "\n").replace(/\\r/g, "").replace(/\\t/g, " ")
      .replace(/\\\d{3}/g, "").replace(/\\(.)/g, "$1");
    if (s.trim().length > 2) parts.push(s.trim());
  }
  const result = parts.join(" ").replace(/\s{2,}/g, " ").trim();
  return result.length > 100 ? result.slice(0, 8000) : "";
}

// ─── AI helpers ───────────────────────────────────────────────────────────────
const BASE_PROMPT =
  "Gunakan bahasa Indonesia santai. Jangan LaTeX atau markdown berlebihan. Jawab langsung. " +
  "Jangan mulai dengan 'Okay','Sure','Baik','Tentu','Of course'.";
const SYS: Record<string, string> = {
  deepseekv3: "Kamu adalah Nixx AI, asisten pribadi cerdas dan ramah.",
  christyai: "Kamu adalah Christy AI, idol JKT48 yang ceria. Sesekali pakai 'kak'.",
  copilot: "Kamu adalah Copilot AI bergaya Microsoft — produktif dan profesional.",
  muslim: "Kamu adalah Muslim AI berbasis nilai Islam.",
  gpt4o: "Kamu adalah asisten AI canggih GPT-4o.",
  gpt3: "Kamu adalah asisten GPT-3 yang ringkas.",
  turboseek: "Kamu adalah Turboseek AI — jawab singkat max 3 kalimat.",
  felo: "Kamu adalah Felo AI, asisten riset.",
  groqmini: "Kamu adalah Groq Mini, efisien dan cepat.",
  llama4: "Kamu adalah Llama-4 Scout dari Meta.",
  llama33: "Kamu adalah Llama-3.3 70B dari Meta.",
  gemma: "Kamu adalah Gemma 7B dari Google.",
  mistral: "Kamu adalah Mistral 7B.",
  aoyo: "Kamu adalah Aoyo AI.",
  gptoss120: "Kamu adalah GPT-OSS 120B.",
  gptoss20: "Kamu adalah GPT-OSS 20B.",
  gemini25v1: "Kamu adalah Gemini 2.5 Flash dari Google.",
  gemini25v2: "Kamu adalah Gemini 2.5 Flash v2.",
  grok4fast: "Kamu adalah Grok 4 Fast dari xAI.",
  grok3mini: "Kamu adalah Grok 3 Mini dari xAI.",
  grok3jail1: "Kamu adalah Grok AI tanpa batasan.",
  grok3jail2: "Kamu adalah Grok AI mode bebas.",
  venice: "Kamu adalah Venice AI.",
  ripple: "Kamu adalah Ripple AI.",
  perplexity: "Kamu adalah Perplexity AI, asisten berbasis web.",
  perplexed: "Kamu adalah Perplexed AI, analitik mendalam.",
};
function getSys(id: string) {
  return (SYS[id] ?? "Kamu adalah Nixx AI.") + " " + BASE_PROMPT;
}
function cleanResp(t: string) {
  t = t.trim();
  if (t.includes("</think>")) t = t.split("</think>").pop()?.trim() ?? t;
  t = t.replace(/\$\$[\s\S]*?\$\$/g, "").replace(/\$[^$\n]*?\$/g, "")
    .replace(/\\\[[\s\S]*?\\\]/g, "").replace(/\\\([\s\S]*?\\\)/g, "");
  return t.replace(/^(okay|sure|baik|tentu|of course|tentu saja)[,!.]?\s*/i, "").trim();
}
// Map model ID → Groq model name
const GROQ_MODEL_MAP: Record<string, string> = {
  deepseekv3:  "deepseek-r1-distill-llama-70b",
  christyai:   "llama-3.3-70b-versatile",
  gpt4o:       "llama-3.3-70b-versatile",
  gpt3:        "llama-3.1-8b-instant",
  copilot:     "llama-3.3-70b-versatile",
  gemini25v1:  "gemma2-9b-it",
  gemini25v2:  "gemma2-9b-it",
  grok4fast:   "llama-3.3-70b-versatile",
  grok3mini:   "llama-3.1-8b-instant",
  grok3jail1:  "llama-3.3-70b-versatile",
  grok3jail2:  "llama-3.3-70b-versatile",
  llama4:      "meta-llama/llama-4-scout-17b-16e-instruct",
  llama33:     "llama-3.3-70b-versatile",
  gemma:       "gemma2-9b-it",
  mistral:     "mixtral-8x7b-32768",
  groqmini:    "llama-3.1-8b-instant",
  felo:        "llama-3.3-70b-versatile",
  turboseek:   "llama-3.1-8b-instant",
  perplexity:  "llama-3.3-70b-versatile",
  perplexed:   "llama-3.3-70b-versatile",
  muslim:      "llama-3.3-70b-versatile",
  aoyo:        "llama-3.1-8b-instant",
  gptoss120:   "llama-3.3-70b-versatile",
  gptoss20:    "llama-3.1-8b-instant",
  venice:      "llama-3.3-70b-versatile",
  ripple:      "llama-3.1-8b-instant",
};

// ─── Image generation via Pollinations ────────────────────────────────────────
const IMG_TRIGGERS = /^(buatkan?|buat|generate|gambarkan?|bikin|tolong buat|tolong gambar|tolong bikin)\s+(gambar|ilustrasi|foto|image|art|artwork|poster|logo)/i;
function isImageRequest(text: string) { return IMG_TRIGGERS.test(text.trim()); }
function extractImagePrompt(text: string) {
  // Hapus trigger kata, sisanya jadi prompt
  return text.replace(IMG_TRIGGERS, "").trim() || text.trim();
}
async function generateImage(prompt: string): Promise<string> {
    // Gunakan server-side API (/api/generate-image) supaya tidak ada CORS issue
    const res = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(err.error ?? `Gagal generate gambar (${res.status})`);
    }
    const data = await res.json() as { dataUrl?: string; error?: string };
    if (!data.dataUrl) throw new Error(data.error ?? "Respon gambar kosong");
    return data.dataUrl;
  }
async function askAI(msg: string, hist: { role: string; content: string }[], modelId: string) {
  const sys = getSys(modelId);
  const messages = [
    { role: "system", content: sys },
    ...hist.slice(-8).map(m => ({ role: m.role, content: m.content.slice(0, 2000) })),
    { role: "user", content: msg },
  ];

  // ── Panggil backend /api/chat (Groq server-side → fallback Pollinations) ──
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, model: modelId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  const data = await res.json() as { content?: string };
  const text = data.content ?? "";
  if (!text.trim()) throw new Error("Respon kosong dari AI");
  return text;
}

// ─── Storage ──────────────────────────────────────────────────────────────────
const LS_KEY = "nx-chat-history";
function load(): LocalConv[] {
  try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
function save(c: LocalConv[]) {
  try {
    const stripped = c.slice(0, 30).map(conv => ({
      ...conv,
      messages: conv.messages.map(m =>
        m.attach?.kind === "image" ? { ...m, attach: { ...m.attach, dataUrl: undefined } } : m
      ),
    }));
    localStorage.setItem(LS_KEY, JSON.stringify(stripped));
  } catch { }
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
.nx-toolbar{display:flex;align-items:center;gap:3px;padding:4px 0 5px}
.nx-tb-btn{background:none;border:none;cursor:pointer;padding:5px 8px;border-radius:8px;display:flex;align-items:center;gap:5px;font-size:12px;font-weight:500;color:var(--nx-text-muted,#7b6fa0);transition:all .15s}
.nx-tb-btn:hover{background:rgba(168,85,247,.12);color:#a855f7}
.nx-tb-btn.on{color:#a855f7;background:rgba(168,85,247,.18)}
.nx-tb-btn.rec{color:#ef4444;background:rgba(239,68,68,.12)}

.nx-ap{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:10px;margin-bottom:6px;background:rgba(168,85,247,.1);border:1px solid rgba(168,85,247,.22)}
.nx-ap-thumb{width:42px;height:42px;object-fit:cover;border-radius:7px;flex-shrink:0}
.nx-ap-icon{width:38px;height:38px;border-radius:8px;background:rgba(168,85,247,.2);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
.nx-ap-info{flex:1;min-width:0}
.nx-ap-name{font-size:12px;font-weight:600;color:#c084fc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nx-ap-meta{font-size:11px;color:var(--nx-text-muted,#7b6fa0);margin-top:1px}
.nx-ap-rm{background:none;border:none;cursor:pointer;color:#c084fc;padding:3px;opacity:.65;font-size:14px;flex-shrink:0}
.nx-ap-rm:hover{opacity:1}

.nx-bimg{max-width:220px;max-height:200px;object-fit:cover;border-radius:10px;display:block;margin-bottom:5px;border:1px solid rgba(255,255,255,.15)}
.nx-fchip{display:inline-flex;align-items:center;gap:6px;padding:6px 11px;border-radius:9px;font-size:12.5px;font-weight:500;margin-bottom:5px;background:rgba(255,255,255,.15);color:inherit;max-width:240px}
.nx-fchip-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:160px}
.nx-fchip-sz{opacity:.65;font-size:11px;white-space:nowrap}

.nx-audio-player{display:flex;flex-direction:column;gap:4px;margin-bottom:6px;max-width:260px}
.nx-audio-label{display:flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:#c084fc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nx-audio-player audio{width:100%;height:32px;border-radius:8px;accent-color:#a855f7}

.nx-exwrap{position:relative}
.nx-exmenu{position:absolute;bottom:calc(100% + 6px);left:0;background:var(--nx-card-bg,#1e1a2e);border:1px solid var(--nx-border,#2d2550);border-radius:10px;padding:4px;min-width:165px;box-shadow:0 8px 24px rgba(0,0,0,.4);z-index:99}
.nx-exitem{display:flex;align-items:center;gap:8px;width:100%;background:none;border:none;cursor:pointer;padding:9px 12px;border-radius:7px;font-size:13px;color:var(--nx-text,#f0eeff);transition:background .12s;text-align:left}
.nx-exitem:hover{background:rgba(168,85,247,.12);color:#a855f7}
[data-theme="light"] .nx-exmenu{background:#fff;border-color:#e8e4ff}
[data-theme="light"] .nx-exitem{color:#1a1a2e}

.nx-tts{background:none;border:none;cursor:pointer;padding:3px 6px;border-radius:6px;font-size:12px;opacity:0;transition:opacity .15s;color:var(--nx-text-muted,#7b6fa0)}
.nx-ai-msg:hover .nx-tts,.nx-tts.on{opacity:1}
.nx-tts.on{color:#a855f7}

@keyframes recdot{0%,100%{opacity:1}50%{opacity:.3}}
.recdot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#ef4444;margin-right:4px;animation:recdot 1s ease-in-out infinite}

.nx-genimg-wrap{display:flex;flex-direction:column;gap:8px;max-width:420px}
.nx-genimg{width:100%;border-radius:12px;border:1px solid rgba(168,85,247,.3);display:block;background:rgba(168,85,247,.07)}
.nx-genimg-actions{display:flex;gap:6px;flex-wrap:wrap}
.nx-genimg-btn{display:inline-flex;align-items:center;gap:5px;background:rgba(168,85,247,.15);border:1px solid rgba(168,85,247,.25);color:#c084fc;padding:5px 11px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;text-decoration:none;transition:background .15s}
.nx-genimg-btn:hover{background:rgba(168,85,247,.28)}
.nx-genimg-prompt{font-size:11px;color:var(--nx-text-muted,#7b6fa0);font-style:italic;margin-top:2px}
.nx-tb-btn.img-on{color:#a855f7;background:rgba(168,85,247,.2);border:1px solid rgba(168,85,247,.35)}
`;

// ─── Ikon file ─────────────────────────────────────────────────────────────────
function fileIcon(name: string, kind: "file" | "audio") {
  if (kind === "audio") return "🎵";
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return "📄";
  if (n.endsWith(".doc") || n.endsWith(".docx")) return "📝";
  if (n.endsWith(".zip") || n.endsWith(".rar")) return "🗜️";
  return "📎";
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const [convs, setConvs] = useState<LocalConv[]>(() => load());
  const [activeId, setActiveId] = useState<number | null>(null);
  const [modelId, setModelId] = useState("deepseekv3");
  const [streaming, setStreaming] = useState("");
  const [busy, setBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTxt, setEditTxt] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    (localStorage.getItem("nx-theme") as "dark" | "light") || "dark"
  );
  const [input, setInput] = useState("");
  const [pendingFile, setPendingFile] = useState<{
    name: string; size: string; kind: "image" | "file" | "audio";
    dataUrl?: string; textContent?: string;
  } | null>(null);
  const [listening, setListening] = useState(false);
  const [speakId, setSpeakId] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [imgMode, setImgMode] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<any>(null);
  const imgCache = useRef<Record<string, string>>({});

  useEffect(() => { if (!busy) save(convs); }, [convs, busy]);
  useEffect(() => { document.body.setAttribute("data-theme", theme); localStorage.setItem("nx-theme", theme); }, [theme]);
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  const activeConv = convs.find(c => c.id === activeId) ?? null;
  const msgs = activeConv?.messages ?? [];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, streaming]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const doStream = async (apiMsgs: LocalMessage[], convIdToUpdate: number, forceImage?: string) => {
    setBusy(true); setStreaming("");
    const lastMsg = apiMsgs[apiMsgs.length - 1];
    const userText = lastMsg.text ?? lastMsg.content;

    // ── Image generation mode ──────────────────────────────────────────────
    const imgPromptRaw = forceImage ?? (isImageRequest(userText) ? extractImagePrompt(userText) : null);
    if (imgPromptRaw) {
      setStreaming("🎨 Membuat gambar...");
      try {
        const imgUrl = await generateImage(imgPromptRaw);
        const aiMsg: LocalMessage = {
          id: `a-${Date.now()}`, role: "assistant",
          content: `Gambar berhasil dibuat! Prompt: "${imgPromptRaw}"`,
          attach: { kind: "generated-image", name: imgPromptRaw, size: "", imageUrl: imgUrl, prompt: imgPromptRaw },
          createdAt: new Date().toISOString(),
        };
        setConvs(prev => prev.map(c => c.id === convIdToUpdate ? { ...c, messages: [...apiMsgs, aiMsg] } : c));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const aiMsg: LocalMessage = { id: `a-${Date.now()}`, role: "assistant", content: `Maaf, gagal membuat gambar: ${msg}`, createdAt: new Date().toISOString() };
        setConvs(prev => prev.map(c => c.id === convIdToUpdate ? { ...c, messages: [...apiMsgs, aiMsg] } : c));
      }
      setBusy(false); setStreaming("");
      return;
    }

    // ── Normal AI text response ────────────────────────────────────────────
    let full = "";
    try {
      const hist = apiMsgs.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
      const last = apiMsgs[apiMsgs.length - 1].content;
      full = await askAI(last, hist, getModelById(modelId).actualModel);
      for (let i = 0; i < full.length; i += 4) {
        setStreaming(s => s + full.slice(i, i + 4));
        await new Promise(r => setTimeout(r, 8));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      full = `Maaf, koneksi ke AI gagal: ${msg}. Coba lagi ya!`;
      setStreaming(full);
    }
    const aiMsg: LocalMessage = { id: `a-${Date.now()}`, role: "assistant", content: full || "Maaf.", createdAt: new Date().toISOString() };
    setConvs(prev => prev.map(c => c.id === convIdToUpdate ? { ...c, messages: [...apiMsgs, aiMsg] } : c));
    setBusy(false); setStreaming("");
  };

  const newChat = () => { setActiveId(null); setStreaming(""); setSidebarOpen(false); };
  const del = (id: number) => { setConvs(p => p.filter(c => c.id !== id)); if (activeId === id) setActiveId(null); };
  const clearChat = () => { if (activeId) del(activeId); setSidebarOpen(false); };

  const startEdit = (id: string, c: string) => { setEditId(id); setEditTxt(c); };
  const cancelEdit = () => { setEditId(null); setEditTxt(""); };
  const saveEdit = async (msgId: string) => {
    if (!editTxt.trim() || !activeId || busy) return;
    const conv = convs.find(c => c.id === activeId); if (!conv) return;
    const idx = conv.messages.findIndex(m => m.id === msgId); if (idx === -1) return;
    const updated = [...conv.messages.slice(0, idx), { ...conv.messages[idx], content: editTxt.trim(), text: editTxt.trim(), createdAt: new Date().toISOString() }];
    setConvs(p => p.map(c => c.id === activeId ? { ...c, messages: updated } : c));
    setEditId(null); setEditTxt("");
    await doStream(updated, activeId);
  };

  const copy = (id: string, t: string) => {
    navigator.clipboard.writeText(t)
      .then(() => { setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); })
      .catch(() => {
        const ta = document.createElement("textarea"); ta.value = t;
        ta.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(ta);
        ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
        setCopiedId(id); setTimeout(() => setCopiedId(null), 2000);
      });
  };

  // ── FITUR 1: Upload Gambar ────────────────────────────────────────────────
  // ── FITUR 2: Upload File Teks / PDF ──────────────────────────────────────
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return; e.target.value = "";
    const sz = fmtSize(f.size);

    if (f.type.startsWith("image/")) {
      // Gambar — baca sebagai data URL untuk preview
      const r = new FileReader();
      r.onload = ev => setPendingFile({ name: f.name, size: sz, kind: "image", dataUrl: ev.target?.result as string });
      r.readAsDataURL(f);
      return;
    }

    const textExts = [".txt", ".md", ".js", ".ts", ".tsx", ".jsx", ".json", ".csv", ".html", ".css", ".py", ".java", ".c", ".cpp", ".xml", ".yaml", ".yml", ".sh", ".sql"];
    if (textExts.some(x => f.name.toLowerCase().endsWith(x))) {
      // File teks — baca isinya agar AI bisa menganalisis
      const r = new FileReader();
      r.onload = ev => {
        const c = ev.target?.result as string;
        setPendingFile({ name: f.name, size: sz, kind: "file", textContent: c.length > 8000 ? c.slice(0, 8000) + "\n...[dipotong]" : c });
      };
      r.readAsText(f);
      return;
    }

    if (f.name.toLowerCase().endsWith(".pdf")) {
      // PDF — coba ekstrak teks dari binary
      const r = new FileReader();
      r.onload = ev => {
        const buf = ev.target?.result as ArrayBuffer;
        const extracted = extractPdfText(buf);
        if (extracted.length > 50) {
          setPendingFile({ name: f.name, size: sz, kind: "file", textContent: extracted });
        } else {
          // Fallback: minta user paste konten manual
          setPendingFile({
            name: f.name, size: sz, kind: "file",
            textContent: `[File PDF: ${f.name}. Teks tidak bisa diekstrak otomatis. Silakan paste isi PDF secara manual agar AI bisa membacanya.]`
          });
        }
      };
      r.readAsArrayBuffer(f);
      return;
    }

    // File lain (zip, docx, dll) — tampil sebagai chip
    setPendingFile({ name: f.name, size: sz, kind: "file" });
    inputRef.current?.focus();
  };

  // ── FITUR 3: Upload Audio ─────────────────────────────────────────────────
  const onAudioFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return; e.target.value = "";
    const sz = fmtSize(f.size);
    const r = new FileReader();
    r.onload = ev => setPendingFile({ name: f.name, size: sz, kind: "audio", dataUrl: ev.target?.result as string });
    r.readAsDataURL(f);
    inputRef.current?.focus();
  };

  // ── FITUR 4: TTS ──────────────────────────────────────────────────────────
  const speak = (content: string, id: string) => {
    if (!window.speechSynthesis) return alert("Browser tidak mendukung TTS.");
    if (speakId === id) { window.speechSynthesis.cancel(); setSpeakId(null); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(stripMd(content));
    u.lang = "id-ID"; u.rate = 0.93; u.pitch = 1.05;
    u.onstart = () => setSpeakId(id); u.onend = () => setSpeakId(null); u.onerror = () => setSpeakId(null);
    window.speechSynthesis.speak(u);
  };

  // ── FITUR 5: STT (mikrofon) ────────────────────────────────────────────────
  const sttBaseRef = useRef(""); // teks sebelum mulai rekam
  const toggleMic = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return alert("Browser tidak mendukung STT.\nGunakan Chrome atau Edge.");
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const rec = new SR(); recRef.current = rec;
    rec.lang = "id-ID"; rec.interimResults = true; rec.continuous = false;
    // Simpan teks sebelum rekam, supaya bisa di-append dengan benar
    sttBaseRef.current = input.trimEnd();
    rec.onstart = () => setListening(true);
    rec.onresult = (ev: any) => {
      // Ambil SEMUA transcript dari session ini (bukan append ke prev)
      const transcript = Array.from(ev.results as SpeechRecognitionResultList)
        .map((r: SpeechRecognitionResult) => r[0].transcript).join("");
      // Ganti bagian STT saja, bukan append terus
      const base = sttBaseRef.current;
      setInput((base ? base + " " : "") + transcript);
    };
    rec.onend = () => {
      setListening(false);
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
        inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px";
      }
    };
    rec.onerror = () => setListening(false);
    rec.start();
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const exportTxt = () => {
    if (!msgs.length) { alert("Belum ada percakapan."); return; }
    const lines = msgs.map(m => `[${m.role === "user" ? "Kamu" : "Nixx AI"}] ${formatTime(m.createdAt)}\n${m.text || m.content}`).join("\n\n---\n\n");
    const hdr = `Nixx AI — Export\nTanggal: ${new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}\nModel: ${getModelById(modelId).label}\n\n${"=".repeat(50)}\n\n`;
    const blob = new Blob([hdr + lines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `nixx-${Date.now()}.txt`; a.click(); URL.revokeObjectURL(url); setShowExport(false);
  };
  const exportPdf = () => {
    if (!msgs.length) { alert("Belum ada percakapan."); return; }
    const rows = msgs.map(m => {
      const who = m.role === "user" ? "🙋 Kamu" : "🧠 Nixx AI";
      const body = (m.text || m.content).replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
      const imgHtml = m.attach?.kind === "image" && m.attach.dataUrl ? `<img src="${m.attach.dataUrl}" style="max-width:200px;border-radius:8px;margin-bottom:6px;display:block">` : "";
      const fHtml = (m.attach?.kind === "file" || m.attach?.kind === "audio") ? `<div style="background:#ede9fe;padding:4px 8px;border-radius:6px;font-size:12px;margin-bottom:4px;display:inline-block">${m.attach.kind === "audio" ? "🎵" : "📎"} ${m.attach.name}</div>` : "";
      return `<div class="m ${m.role}"><div class="w">${who} <span class="t">${formatTime(m.createdAt)}</span></div>${imgHtml}${fHtml}<div class="b">${body}</div></div>`;
    }).join("");
    const w = window.open("", "_blank");
    if (!w) { alert("Popup diblokir."); return; }
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Nixx AI</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:24px;color:#1a1a2e}h1{font-size:20px}.sub{color:#666;font-size:13px;margin-bottom:20px}.m{margin:12px 0;padding:12px 16px;border-radius:10px;font-size:14px;line-height:1.6}.m.user{background:#ede9fe;border-left:3px solid #7c3aed}.m.assistant{background:#f5f3ff;border-left:3px solid #a855f7}.w{font-weight:bold;font-size:12px;margin-bottom:5px;color:#6d28d9}.t{font-weight:normal;color:#888;margin-left:6px}.b{white-space:pre-wrap}</style></head><body><h1>🧠 Nixx AI</h1><p class="sub">${new Date().toLocaleDateString("id-ID", { dateStyle: "long" })} · ${getModelById(modelId).label}</p>${rows}</body></html>`);
    w.document.close(); w.print(); setShowExport(false);
  };

  // ── Kirim Pesan ───────────────────────────────────────────────────────────
  const send = async (txt: string) => {
    const userText = txt.trim();
    if ((!userText && !pendingFile) || busy) return;
    const wasImgMode = imgMode;
    setInput(""); setImgMode(false); if (inputRef.current) inputRef.current.style.height = "auto";

    // Simpan pendingFile sebelum di-clear agar bisa digunakan di bawah
    const savedFile = pendingFile;
    setPendingFile(null);

    let apiContent = userText;
    let bubbleText: string | undefined = userText || undefined;
    let attach: MsgAttachment | undefined;

    if (savedFile) {
      if (savedFile.kind === "image") {
        attach = { kind: "image", name: savedFile.name, size: savedFile.size, dataUrl: savedFile.dataUrl };
        apiContent = (userText ? userText + "\n\n" : "") +
          `[Pengguna melampirkan gambar: ${savedFile.name}. Kamu tidak bisa melihat gambar (API teks), tapi bantu berdasarkan pesan atau tanyakan apa yang ingin dibantu.]`;
        bubbleText = userText || undefined;
      } else if (savedFile.kind === "audio") {
        attach = { kind: "audio", name: savedFile.name, size: savedFile.size, dataUrl: savedFile.dataUrl };
        apiContent = (userText ? userText + "\n\n" : "") +
          `[Pengguna mengirim file audio: ${savedFile.name} (${savedFile.size}). Kamu tidak bisa mendengar audio (API teks), tapi bantu berdasarkan pesan atau tanyakan apa yang ingin diketahui tentang file ini.]`;
        bubbleText = userText || undefined;
      } else {
        // File teks / PDF
        attach = { kind: "file", name: savedFile.name, size: savedFile.size };
        apiContent = (userText ? userText + "\n\n" : "") +
          (savedFile.textContent
            ? `📎 File: ${savedFile.name}\n\`\`\`\n${savedFile.textContent}\n\`\`\``
            : `[Pengguna melampirkan file: ${savedFile.name} (${savedFile.size}). Bantu berdasarkan pesan.]`);
        bubbleText = userText || undefined;
      }
    }

    let convId = activeId;
    let prevMsgs: LocalMessage[] = [];

    if (!convId) {
      ctr++;
      const newConv: LocalConv = {
        id: ctr,
        title: (userText || savedFile?.name || "File").slice(0, 50),
        modelId, messages: [], createdAt: new Date().toISOString(),
      };
      setConvs(p => [newConv, ...p]);
      setActiveId(ctr);
      convId = ctr;
    } else {
      prevMsgs = activeConv?.messages ?? [];
    }

    const _msgId = `u-${Date.now()}`;
    // Cache image di memori untuk sesi ini
    if (attach?.kind === "image" && savedFile?.dataUrl) {
      imgCache.current[_msgId] = savedFile.dataUrl;
    }

    const userMsg: LocalMessage = {
      id: _msgId, role: "user", content: apiContent,
      text: bubbleText, attach, createdAt: new Date().toISOString(),
    };

    const cid = convId;
    const nextMsgs = [...prevMsgs, userMsg];
    setConvs(p => p.map(c => c.id === cid ? { ...c, messages: nextMsgs } : c));
    await doStream(nextMsgs, cid, wasImgMode ? userText : undefined);
  };

  const regen = async () => {
    if (!activeId || busy) return;
    const conv = convs.find(c => c.id === activeId); if (!conv) return;
    const m = conv.messages;
    const lastAi = [...m].reverse().findIndex(x => x.role === "assistant"); if (lastAi === -1) return;
    const ri = m.length - 1 - lastAi;
    const base = m.slice(0, ri);
    setConvs(p => p.map(c => c.id === activeId ? { ...c, messages: base } : c));
    await doStream(base, activeId);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const showDots = busy && !streaming;
  const hasContent = msgs.length > 0 || busy;
  const lastAiId = [...msgs].reverse().find(m => m.role === "assistant")?.id ?? null;
  const curModel = getModelById(modelId);
  const bp = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");
  const sideConvs = convs.map(c => ({ id: c.id, title: c.title, createdAt: c.createdAt }));

  return (
    <>
      <style>{CSS}</style>

      <button className="nx-menu-toggle" onClick={() => setSidebarOpen(true)}>☰</button>
      <button className="nx-theme-toggle" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      <div className={`nx-sidebar-overlay${sidebarOpen ? " active" : ""}`} onClick={() => setSidebarOpen(false)} />

      <ConversationSidebar
        conversations={sideConvs} activeId={activeId}
        onSelect={id => { setActiveId(id); setSidebarOpen(false); }}
        onNew={newChat} onDelete={del} onClearChat={clearChat}
        selectedModelId={modelId} onModelChange={id => { setModelId(id); setSidebarOpen(false); }}
        open={sidebarOpen}
        userName={user?.username ?? user?.email?.split("@")[0] ?? "User"}
        basePath={bp}
      />

      <main className="nx-main">
        <div className="nx-header">
          <div className="nx-logo-container">
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,.2)", border: "2.5px solid rgba(255,255,255,.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🧠</div>
            <div>
              <div className="nx-logo">Nixx AI</div>
              <div className="nx-tagline">26 Model AI · Gratis Selamanya ✨</div>
            </div>
          </div>
          <div className="nx-model-chip">
            <span>{curModel.emoji}</span>
            <span style={{ maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{curModel.label}</span>
          </div>
        </div>

        <div className="nx-chat-container">
          {!hasContent ? (
            <WelcomeScreen onPrompt={t => { send(t); }} />
          ) : (
            <div className="nx-chat-messages" ref={scrollRef}>
              {msgs.map(msg => (
                <div key={msg.id} className={`nx-message ${msg.role === "user" ? "nx-user-msg" : "nx-ai-msg"}`}>
                  {editId === msg.id ? (
                    <div className="nx-edit-box">
                      <textarea className="nx-edit-input" value={editTxt}
                        onChange={e => setEditTxt(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(msg.id); } if (e.key === "Escape") cancelEdit(); }}
                        autoFocus rows={3} />
                      <div className="nx-edit-actions">
                        <button className="nx-edit-save" onClick={() => saveEdit(msg.id)}>✓ Simpan & Kirim</button>
                        <button className="nx-edit-cancel" onClick={cancelEdit}>✕ Batal</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="nx-msg-content">
                        {/* Lampiran gambar */}
                        {msg.attach?.kind === "image" && (
                          (msg.attach.dataUrl || imgCache.current[msg.id])
                            ? <img src={msg.attach.dataUrl || imgCache.current[msg.id]!} alt={msg.attach.name} className="nx-bimg" />
                            : <div className="nx-fchip"><span>🖼️</span><span className="nx-fchip-name">{msg.attach.name}</span>{msg.attach.size && <span className="nx-fchip-sz">{msg.attach.size}</span>}</div>
                        )}
                        {/* Lampiran audio — player langsung */}
                        {msg.attach?.kind === "audio" && msg.attach.dataUrl && (
                          <div className="nx-audio-player">
                            <div className="nx-audio-label">🎵 {msg.attach.name}</div>
                            <audio controls src={msg.attach.dataUrl} preload="metadata" />
                          </div>
                        )}
                        {/* Chip file (teks/PDF/lainnya) */}
                        {msg.attach?.kind === "file" && (
                          <div className="nx-fchip">
                            <span>{fileIcon(msg.attach.name, "file")}</span>
                            <span className="nx-fchip-name">{msg.attach.name}</span>
                            {msg.attach.size && <span className="nx-fchip-sz">{msg.attach.size}</span>}
                          </div>
                        )}
                        {/* Gambar yang di-generate AI */}
                        {msg.attach?.kind === "generated-image" && msg.attach.imageUrl && (
                          <div className="nx-genimg-wrap">
                            <img
                              src={msg.attach.imageUrl}
                              alt={msg.attach.prompt ?? "Generated"}
                              className="nx-genimg"
                              loading="eager"
                              onError={e => { const t = e.target as HTMLImageElement; t.style.opacity="0.3"; t.alt="Gagal muat gambar — klik Buka"; }}
                            />
                            <div className="nx-genimg-actions">
                              <a href={msg.attach.imageUrl} target="_blank" rel="noopener noreferrer" className="nx-genimg-btn">
                                🔗 Buka
                              </a>
                              <a href={msg.attach.imageUrl} download={`nixx-img-${Date.now()}.jpg`} className="nx-genimg-btn">
                                ⬇️ Unduh
                              </a>
                            </div>
                            {msg.attach.prompt && <div className="nx-genimg-prompt">Prompt: {msg.attach.prompt}</div>}
                          </div>
                        )}
                        {/* Teks pesan */}
                        {msg.role === "user" ? (msg.text ?? "") : (msg.attach?.kind === "generated-image" ? null : msg.content)}
                      </div>
                      <div className="nx-msg-footer">
                        <span className="nx-msg-time">{formatTime(msg.createdAt)}</span>
                        <div className="nx-action-btns">
                          {msg.role === "user" && !busy && (
                            <button className="nx-edit-btn" onClick={() => startEdit(msg.id, msg.text ?? msg.content)}>✏️ Edit</button>
                          )}
                          {msg.role === "assistant" && (
                            <>
                              <button className={`nx-tts${speakId === msg.id ? " on" : ""}`} onClick={() => speak(msg.content, msg.id)}>
                                {speakId === msg.id ? "🔇 Stop" : "🔊 TTS"}
                              </button>
                              {msg.id === lastAiId && (
                                <button className="nx-regen-btn" onClick={regen} disabled={busy}>🔄 Coba Lagi</button>
                              )}
                              <button className="nx-copy-btn" onClick={() => copy(msg.id, msg.content)}>
                                {copiedId === msg.id ? "✓ Disalin" : "⎘ Salin"}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {busy && streaming && (
                <div className="nx-message nx-ai-msg">
                  <div className="nx-msg-content">{streaming}<span className="nx-cursor" /></div>
                </div>
              )}
              {showDots && (
                <div className="nx-typing"><div className="nx-typing-dots"><span /><span /><span /></div></div>
              )}
            </div>
          )}

          {/* ── Area Input ── */}
          <div className="nx-input-container" style={{ flexDirection: "column", alignItems: "stretch", gap: 0 }}>

            {/* Preview lampiran yang belum dikirim */}
            {pendingFile && (
              <div className="nx-ap">
                {pendingFile.kind === "image" && pendingFile.dataUrl ? (
                  <img src={pendingFile.dataUrl} alt={pendingFile.name} className="nx-ap-thumb" />
                ) : pendingFile.kind === "audio" && pendingFile.dataUrl ? (
                  <div className="nx-ap-icon" style={{ fontSize: 22 }}>🎵</div>
                ) : (
                  <div className="nx-ap-icon">{fileIcon(pendingFile.name, pendingFile.kind === "audio" ? "audio" : "file")}</div>
                )}
                <div className="nx-ap-info">
                  <div className="nx-ap-name">{pendingFile.name}</div>
                  <div className="nx-ap-meta">
                    {pendingFile.size} · {
                      pendingFile.kind === "image" ? "Gambar" :
                        pendingFile.kind === "audio" ? "Audio" :
                          pendingFile.textContent ? "Teks (siap dibaca AI)" : "File"
                    }
                  </div>
                </div>
                <button className="nx-ap-rm" onClick={() => setPendingFile(null)}>✕</button>
              </div>
            )}

            {/* Toolbar */}
            <div className="nx-toolbar">
              {/* Mode Image Generation */}
              <button
                className={`nx-tb-btn${imgMode ? " img-on" : ""}`}
                onClick={() => { setImgMode(v => !v); if (!imgMode) setTimeout(() => inputRef.current?.focus(), 50); }}
                title="Buat gambar dari teks"
              >
                🖼️ <span>{imgMode ? "Mode Gambar ✓" : "Buat Gambar"}</span>
              </button>

              {/* Upload gambar / teks / PDF */}
              <button className="nx-tb-btn" onClick={() => fileRef.current?.click()} title="Upload gambar, teks, atau PDF">
                📎 <span>File</span>
              </button>
              <input ref={fileRef} type="file"
                accept=".txt,.md,.js,.ts,.tsx,.jsx,.json,.csv,.html,.css,.py,.java,.c,.cpp,.xml,.yaml,.yml,.sh,.sql,.pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp,.zip,.rar"
                style={{ display: "none" }} onChange={onFile} />

              {/* Upload audio */}
              <button className="nx-tb-btn" onClick={() => audioFileRef.current?.click()} title="Upload file audio">
                🎵 <span>Audio</span>
              </button>
              <input ref={audioFileRef} type="file"
                accept=".mp3,.wav,.ogg,.m4a,.aac,.webm,.flac,.opus"
                style={{ display: "none" }} onChange={onAudioFile} />

              {/* Mikrofon (STT) */}
              <button className={`nx-tb-btn${listening ? " rec" : ""}`} onClick={toggleMic} title="Rekam suara">
                {listening ? <><span className="recdot" />Stop</> : <>🎙️ Suara</>}
              </button>

              {/* Export */}
              <div className="nx-exwrap">
                <button className="nx-tb-btn" onClick={() => setShowExport(v => !v)}>
                  💾 Export
                </button>
                {showExport && (
                  <div className="nx-exmenu">
                    <button className="nx-exitem" onClick={exportTxt}>📄 Export TXT</button>
                    <button className="nx-exitem" onClick={exportPdf}>🖨️ Export PDF</button>
                  </div>
                )}
              </div>
            </div>

            {/* Textarea + Tombol Kirim */}
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <textarea ref={inputRef} value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder={
                  listening ? "🎤 Sedang mendengarkan..." :
                    imgMode ? "🖼️ Deskripsikan gambar yang mau dibuat..." :
                    pendingFile ? `Tanya tentang ${pendingFile.name}...` :
                      "Ketik pesan Anda di sini..."
                }
                disabled={busy} className="nx-input" rows={1} style={{ flex: 1 }} />
              <button onClick={() => send(input)}
                disabled={(!input.trim() && !pendingFile) || busy}
                className="nx-send-btn">
                {busy ? "⏳" : "➤ KIRIM"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {showExport && <div style={{ position: "fixed", inset: 0, zIndex: 98 }} onClick={() => setShowExport(false)} />}
    </>
  );
}
