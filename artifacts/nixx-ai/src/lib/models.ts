export interface AIModel {
  id: string;
  label: string;
  emoji: string;
  badge: string;
  group: string;
  actualModel: string;
}

export const AI_MODELS: AIModel[] = [
  // === Nixx ===
  { id: "deepseekv3", label: "Nixx AI",        emoji: "🧠", badge: "Unggulan", group: "Nixx",        actualModel: "deepseekv3" },
  { id: "christyai",  label: "Christy AI",      emoji: "⭐", badge: "JKT48",    group: "Nixx",        actualModel: "christyai"  },
  // === GPT ===
  { id: "gpt4o",      label: "GPT-4o",          emoji: "🤖", badge: "4o",       group: "GPT",         actualModel: "gpt4o"      },
  { id: "gpt3",       label: "GPT-3",           emoji: "🤖", badge: "OpenAI",   group: "GPT",         actualModel: "gpt3"       },
  { id: "copilot",    label: "Copilot AI",      emoji: "🤖", badge: "Microsoft",group: "GPT",         actualModel: "copilot"    },
  // === Gemini ===
  { id: "gemini25v1", label: "Gemini 2.5 v1",   emoji: "💎", badge: "Flash",    group: "Gemini",      actualModel: "gemini25v1" },
  { id: "gemini25v2", label: "Gemini 2.5 v2",   emoji: "💎", badge: "Flash",    group: "Gemini",      actualModel: "gemini25v2" },
  // === Grok ===
  { id: "grok4fast",  label: "Grok 4 Fast",     emoji: "⚡", badge: "Kilat",    group: "Grok",        actualModel: "grok4fast"  },
  { id: "grok3mini",  label: "Grok 3 Mini",     emoji: "⚡", badge: "Mini",     group: "Grok",        actualModel: "grok3mini"  },
  { id: "grok3jail1", label: "Grok Jail v1",    emoji: "🔓", badge: "JB",       group: "Grok",        actualModel: "grok3jail1" },
  { id: "grok3jail2", label: "Grok Jail v2",    emoji: "🔓", badge: "JB",       group: "Grok",        actualModel: "grok3jail2" },
  // === Open Source ===
  { id: "llama4",     label: "Llama-4 Scout",   emoji: "💻", badge: "17B",      group: "Open Source", actualModel: "llama4"     },
  { id: "llama33",    label: "Llama-3.3",       emoji: "🌿", badge: "70B",      group: "Open Source", actualModel: "llama33"    },
  { id: "gemma",      label: "Gemma 7B",        emoji: "💎", badge: "Ringan",   group: "Open Source", actualModel: "gemma"      },
  { id: "mistral",    label: "Mistral 7B",      emoji: "🌬️", badge: "v0.1",    group: "Open Source", actualModel: "mistral"    },
  { id: "groqmini",   label: "Groq Mini",       emoji: "⚡", badge: "Cepat",    group: "Open Source", actualModel: "groqmini"   },
  // === Lainnya ===
  { id: "felo",       label: "Felo AI",         emoji: "🔍", badge: "Baru",     group: "Lainnya",     actualModel: "felo"       },
  { id: "turboseek",  label: "Turboseek AI",    emoji: "🚀", badge: "Cepat",    group: "Lainnya",     actualModel: "turboseek"  },
  { id: "perplexity", label: "Perplexity AI",   emoji: "🔍", badge: "Web",      group: "Lainnya",     actualModel: "perplexity" },
  { id: "ripple",     label: "Ripple AI",       emoji: "🌊", badge: "OFF",      group: "Lainnya",     actualModel: "ripple"     },
  { id: "muslim",     label: "Muslim AI",       emoji: "🕌", badge: "Islami",   group: "Lainnya",     actualModel: "muslim"     },
  { id: "aoyo",       label: "Aoyo AI",         emoji: "💬", badge: "Baru",     group: "Lainnya",     actualModel: "aoyo"       },
  { id: "venice",     label: "Venice AI",       emoji: "🌊", badge: "Baru",     group: "Lainnya",     actualModel: "venice"     },
  { id: "gptoss120",  label: "GPT-OSS 120B",    emoji: "💻", badge: "120B",     group: "Lainnya",     actualModel: "gptoss120"  },
  { id: "gptoss20",   label: "GPT-OSS 20B",     emoji: "💻", badge: "20B",      group: "Lainnya",     actualModel: "gptoss20"   },
  { id: "perplexed",  label: "Perplexed AI",    emoji: "❓", badge: "Canggih",  group: "Lainnya",     actualModel: "perplexed"  },
];

export const getModelById = (id: string): AIModel =>
  AI_MODELS.find((m) => m.id === id) ?? AI_MODELS[0];
