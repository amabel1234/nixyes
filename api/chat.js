// Vercel Serverless Function — /api/chat
  // Groq (jika ada GROQ_API_KEY) → fallback Pollinations GET (no key needed)

  const GROQ_MODELS = {
    deepseekv3:"llama-3.3-70b-versatile", christyai:"llama-3.3-70b-versatile",
    gpt4o:"llama-3.3-70b-versatile", gpt3:"llama-3.1-8b-instant",
    copilot:"llama-3.3-70b-versatile", gemini25v1:"llama-3.3-70b-versatile",
    gemini25v2:"llama-3.3-70b-versatile", grok4fast:"llama-3.3-70b-versatile",
    grok3mini:"llama-3.1-8b-instant", grok3jail1:"llama-3.3-70b-versatile",
    grok3jail2:"llama-3.3-70b-versatile", llama4:"meta-llama/llama-4-scout-17b-16e-instruct",
    llama33:"llama-3.3-70b-versatile", gemma:"llama-3.3-70b-versatile",
    mistral:"llama-3.3-70b-versatile", groqmini:"llama-3.1-8b-instant",
    felo:"llama-3.3-70b-versatile", turboseek:"llama-3.1-8b-instant",
    perplexity:"llama-3.3-70b-versatile", perplexed:"llama-3.3-70b-versatile",
    muslim:"llama-3.3-70b-versatile", aoyo:"llama-3.1-8b-instant",
    gptoss120:"llama-3.3-70b-versatile", gptoss20:"llama-3.1-8b-instant",
    venice:"llama-3.3-70b-versatile", ripple:"llama-3.1-8b-instant",
  };

  function clean(t) {
    t = t.trim();
    if (t.includes("</think>")) t = (t.split("</think>").pop() || t).trim();
    t = t.replace(/\$\$[\s\S]*?\$\$/g,"").replace(/\$[^$\n]*?\$/g,"");
    return t.replace(/^(okay|sure|baik|tentu|of course|tentu saja)[,!.\s]*/i,"").trim();
  }

  function readBody(req) {
    return new Promise((resolve) => {
      let b = "";
      req.on("data", c => { b += c; });
      req.on("end", () => { try { resolve(JSON.parse(b||"{}")); } catch { resolve({}); } });
      req.on("error", () => resolve({}));
    });
  }

  function timeout(ms) {
    return new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms));
  }

  async function tryGroq(messages, modelId) {
    const key = process.env.GROQ_API_KEY;
    if (!key) return null;
    try {
      const model = GROQ_MODELS[modelId] || "llama-3.3-70b-versatile";
      const res = await Promise.race([
        fetch("https://api.groq.com/openai/v1/chat/completions", {
          method:"POST",
          headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},
          body: JSON.stringify({ model, messages, max_tokens:2048, temperature:0.7 }),
        }),
        timeout(12000),
      ]);
      if (!res.ok) return null;
      const d = await res.json();
      const text = d.choices?.[0]?.message?.content || "";
      return text.trim() ? text : null;
    } catch { return null; }
  }

  async function tryPollinations(messages) {
    // Gunakan GET endpoint — terbukti reliabel tanpa API key
    const seed = Math.floor(Math.random() * 999999);
    const userMsg = messages.filter(m => m.role === "user").pop()?.content || "";
    const sysMsg = messages.find(m => m.role === "system")?.content || "";
    const hist = messages.filter(m => m.role !== "system").slice(0,-1)
      .map(m => (m.role==="user"?"User":"AI") + ": " + m.content.slice(0,300)).join("\n");
    const fullSys = hist ? sysMsg + "\n\nKonteks:\n" + hist : sysMsg;

    const url = "https://text.pollinations.ai/" +
      encodeURIComponent(userMsg.slice(0,800)) +
      "?model=openai-large&seed=" + seed +
      "&system=" + encodeURIComponent(fullSys.slice(0,1200)) +
      "&private=true";

    try {
      const res = await Promise.race([
        fetch(url),
        timeout(15000),
      ]);
      if (!res.ok) throw new Error("status " + res.status);
      const text = await res.text();
      return text.trim() || null;
    } catch { return null; }
  }

  module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers","Content-Type");
    res.setHeader("Content-Type","application/json");

    if (req.method === "OPTIONS") { res.writeHead(200); res.end("{}"); return; }
    if (req.method !== "POST") { res.writeHead(405); res.end(JSON.stringify({error:"Method not allowed"})); return; }

    const body = await readBody(req);
    const { messages, model: modelId } = body;

    if (!Array.isArray(messages) || !messages.length) {
      res.writeHead(400); res.end(JSON.stringify({error:"messages diperlukan"})); return;
    }

    // Coba Groq dulu (kalau ada key), lalu Pollinations GET
    let text = await tryGroq(messages, modelId || "deepseekv3");
    if (!text) text = await tryPollinations(messages);

    if (text) {
      res.writeHead(200);
      res.end(JSON.stringify({ content: clean(text) }));
    } else {
      res.writeHead(503);
      res.end(JSON.stringify({ error: "Maaf, AI sedang sibuk. Coba lagi ya!" }));
    }
  };
  