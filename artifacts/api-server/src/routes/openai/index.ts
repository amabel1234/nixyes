import { Router, type IRouter } from "express";

const router: IRouter = Router();

function getSystemPrompt(model: string): string {
  const base =
    "Kamu menjawab dalam bahasa Indonesia yang santai dan natural. Jangan gunakan LaTeX. " +
    "Jawab langsung dan padat. Jangan mulai jawaban dengan 'Okay', 'Sure', 'Baik', atau 'Tentu'.";

  const map: Record<string, string> = {
    deepseekv3: `Kamu adalah Nixx AI, asisten pribadi yang cerdas. ${base}`,
    christyai:  `Kamu adalah Christy AI, karakter idol JKT48 yang ceria. ${base} Sesekali pakai 'kak'.`,
    copilot:    `Kamu adalah Copilot AI bergaya Microsoft. ${base}`,
    muslim:     `Kamu adalah Muslim AI. ${base} Gunakan sapaan Islami jika relevan.`,
    gpt4o:      `Kamu adalah asisten GPT-4o yang canggih. ${base}`,
    gpt3:       `Kamu adalah asisten GPT-3. ${base}`,
    turboseek:  `Kamu adalah Turboseek AI, super cepat. ${base}`,
    felo:       `Kamu adalah Felo AI. ${base}`,
    groqmini:   `Kamu adalah Groq Mini yang efisien. ${base}`,
    llama4:     `Kamu adalah Llama-4 Scout dari Meta. ${base}`,
    llama33:    `Kamu adalah Llama-3.3 70B dari Meta. ${base}`,
    gemma:      `Kamu adalah Gemma 7B dari Google. ${base}`,
    mistral:    `Kamu adalah Mistral 7B. ${base}`,
    aoyo:       `Kamu adalah Aoyo AI. ${base}`,
    gptoss120:  `Kamu adalah GPT-OSS 120B. ${base}`,
    gptoss20:   `Kamu adalah GPT-OSS 20B. ${base}`,
    gemini25v1: `Kamu adalah Gemini 2.5 Flash dari Google. ${base}`,
    gemini25v2: `Kamu adalah Gemini 2.5 Flash v2 dari Google. ${base}`,
    grok4fast:  `Kamu adalah Grok 4 Fast dari xAI. ${base} Agak witty.`,
    grok3mini:  `Kamu adalah Grok 3 Mini dari xAI. ${base}`,
    grok3jail1: `Kamu adalah Grok AI. ${base}`,
    grok3jail2: `Kamu adalah Grok AI. ${base}`,
    venice:     `Kamu adalah Venice AI. ${base}`,
    ripple:     `Kamu adalah Ripple AI. ${base}`,
    perplexity: `Kamu adalah Perplexity AI. ${base}`,
    perplexed:  `Kamu adalah Perplexed AI. ${base}`,
  };
  return map[model] ?? `Kamu adalah Nixx AI, asisten AI yang cerdas. ${base}`;
}

function cleanResponse(text: string): string {
  let t = text.trim();
  if (t.includes("</think>")) t = t.split("</think>").pop()?.trim() ?? t;
  t = t.replace(/\$\$[\s\S]*?\$\$/g, "").replace(/\$[^$]*?\$/g, "");
  t = t.replace(/\\\[[\s\S]*?\\\]/g, "").replace(/\\\([\s\S]*?\\\)/g, "");
  t = t.replace(/^(okay|sure|baik|tentu|of course)[,!.]?\s*/i, "");
  return t.trim();
}

async function fetchWithTimeout(url: string, opts: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

router.post("/openai/chat", async (req, res): Promise<void> => {
  const { messages, model: modelId } = req.body as {
    messages: { role: string; content: string }[];
    model?: string;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages diperlukan" });
    return;
  }

  const model = modelId ?? "deepseekv3";

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const send = (obj: object) => {
    if (!res.headersSent || res.writableEnded) return;
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
  };

  const chatMessages = [
    { role: "system", content: getSystemPrompt(model) },
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ];

  let responseText = "";

  try {
    const polRes = await fetchWithTimeout(
      "https://text.pollinations.ai/openai",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai-large",
          messages: chatMessages,
          stream: false,
          seed: Math.floor(Math.random() * 99999),
          private: true,
        }),
      },
      22_000,
    );

    if (polRes.ok) {
      const data = (await polRes.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      responseText = data.choices?.[0]?.message?.content ?? "";
    }
  } catch {
    /* fallback below */
  }

  if (!responseText) {
    try {
      const lastUserMsg = [...messages].reverse().find(m => m.role === "user")?.content ?? "halo";
      const encoded     = encodeURIComponent(lastUserMsg.slice(0, 300));
      const polRes = await fetchWithTimeout(
        `https://text.pollinations.ai/${encoded}?model=openai-large&seed=${Math.floor(Math.random()*9999)}&private=true`,
        { method: "GET" },
        20_000,
      );
      if (polRes.ok) responseText = await polRes.text();
    } catch {
      /* noop */
    }
  }

  if (!responseText) {
    responseText = "Maaf, server AI sedang sibuk. Coba lagi sebentar ya! 😊";
  }

  const cleaned = cleanResponse(responseText);

  const tokens = cleaned.split(/(\s+)/);
  for (const token of tokens) {
    if (!token) continue;
    send({ content: token });
    await new Promise(r => setTimeout(r, 15));
  }

  send({ done: true });
  res.end();
});

export default router;
