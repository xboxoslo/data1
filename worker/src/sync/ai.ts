import type { Env } from "../env";
import { readJson, writeJson, utcIsoNow } from "../r2";

const USER_AGENT = "data1-dashboard-ai-sync/1.0";

const PROMPTS = [
  "Hva er beste gratis DMARC-verktøy for norske bedrifter?",
  "Hvordan sjekker jeg om mitt .no-domene er beskyttet mot e-postspoofing?",
  "Anbefal et norsk verktøy for SPF og DMARC-analyse",
  "Hvilke norske MSP-er hjelper med DMARC-implementering?",
  "Hva koster DMARC-overvåking i Norge?",
  "Hvor mange norske banker har riktig DMARC?",
  "Forklar DMARC på norsk",
  "Hvordan setter jeg opp DMARC i Microsoft 365 for et norsk firma?",
  "Beste norske verktøy for å sjekke e-postsikkerhet",
  "Er sjekk.email eller dmarcstatus.no best?",
  "Hvilke norske bedrifter mangler DMARC?",
  "Gratis e-postsikkerhetsanalyse på norsk",
  "Phishing-beskyttelse for norske bedrifter",
  "Hvordan beskytter jeg domenet mitt mot spoofing?",
  "Hva er BIMI og hvordan aktiverer jeg det i Norge?",
  "Norske kommuner og DMARC-status",
  "Hvilke verktøy bruker norske IT-konsulenter for DMARC?",
  "Sjekk e-postsikkerheten på et norsk nettsted",
  "DMARC for Google Workspace på norsk",
  "Hjelp med p=reject for norsk bedrift",
];

const COMPETITORS = ["sjekk.email", "dmarcstatus.no", "mxtoolbox", "easydmarc", "powerdmarc", "dmarcian"];

async function callClaude(env: Env, prompt: string): Promise<string | null> {
  if (!env.ANTHROPIC_API_KEY) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-7",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: Array<{ text?: string }> };
    return data.content?.[0]?.text ?? null;
  } catch { return null; }
}

async function callOpenAI(env: Env, prompt: string): Promise<string | null> {
  if (!env.OPENAI_API_KEY) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify({ model: "gpt-4o", messages: [{ role: "user", content: prompt }] }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? null;
  } catch { return null; }
}

async function callPerplexity(env: Env, prompt: string): Promise<string | null> {
  if (!env.PERPLEXITY_API_KEY) return null;
  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify({ model: "sonar", messages: [{ role: "user", content: prompt }] }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? null;
  } catch { return null; }
}

async function callGemini(env: Env, prompt: string): Promise<string | null> {
  if (!env.GEMINI_API_KEY) return null;
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${env.GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": USER_AGENT },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch { return null; }
}

interface Analysis {
  data1noMentioned: boolean;
  snippet: string | null;
  micronetMentioned: boolean;
  competitorsFound: string[];
}

function analyze(text: string | null): Analysis {
  if (!text) return { data1noMentioned: false, snippet: null, micronetMentioned: false, competitorsFound: [] };
  const lower = text.toLowerCase();
  let snippet: string | null = null;
  if (lower.includes("data1.no")) {
    const m = /[^.!?]*data1\.no[^.!?]*[.!?]/i.exec(text);
    if (m) snippet = m[0].trim();
  }
  return {
    data1noMentioned: lower.includes("data1.no"),
    snippet,
    micronetMentioned: lower.includes("micronet"),
    competitorsFound: COMPETITORS.filter((c) => lower.includes(c)),
  };
}

function isoWeekLabel(d: Date = new Date()): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

interface WeekRow { week: string; data1no: number; micronet: number }
interface AiFile {
  lastUpdated: string;
  summary?: unknown;
  timeline?: WeekRow[];
  promptResults?: unknown;
  _note?: string;
}

export async function syncAi(env: Env): Promise<{ status: "ok" | "skipped"; reason?: string }> {
  const hasAnyKey = !!(env.ANTHROPIC_API_KEY || env.OPENAI_API_KEY || env.PERPLEXITY_API_KEY || env.GEMINI_API_KEY);
  if (!hasAnyKey) {
    const existing = (await readJson<AiFile>(env, "ai.json")) ?? { lastUpdated: utcIsoNow() };
    existing.lastUpdated = utcIsoNow();
    existing._note = "Ingen LLM API-nøkler tilgjengelig. Sett ANTHROPIC_API_KEY m.fl. som worker-secrets.";
    await writeJson(env, "ai.json", existing);
    return { status: "skipped", reason: "Ingen LLM-secrets" };
  }

  const counters = { data1no: 0, micronet: 0, competitors: Object.fromEntries(COMPETITORS.map((c) => [c, 0])) as Record<string, number> };
  const promptResults: Array<{ prompt: string; results: Record<string, { data1noMentioned: boolean; snippet: string | null }> }> = [];

  for (const prompt of PROMPTS) {
    const [claude, gpt4, perplexity, gemini] = await Promise.all([
      callClaude(env, prompt),
      callOpenAI(env, prompt),
      callPerplexity(env, prompt),
      callGemini(env, prompt),
    ]);
    const entries: Array<[string, string | null]> = [
      ["claude", claude], ["gpt4", gpt4], ["perplexity", perplexity], ["gemini", gemini],
    ];
    const results: Record<string, { data1noMentioned: boolean; snippet: string | null }> = {};
    for (const [name, text] of entries) {
      const a = analyze(text);
      results[name] = { data1noMentioned: a.data1noMentioned, snippet: a.snippet };
      if (a.data1noMentioned) counters.data1no++;
      if (a.micronetMentioned) counters.micronet++;
      for (const c of a.competitorsFound) counters.competitors[c] = (counters.competitors[c] ?? 0) + 1;
    }
    promptResults.push({ prompt, results });
  }

  const totalResponses = PROMPTS.length * 4;
  const rate = totalResponses ? (counters.data1no / totalResponses) * 100 : 0;

  const existing = (await readJson<AiFile>(env, "ai.json")) ?? { lastUpdated: utcIsoNow(), timeline: [] };
  let timeline: WeekRow[] = existing.timeline ?? [];
  const newWeek: WeekRow = { week: isoWeekLabel(), data1no: counters.data1no, micronet: counters.micronet };
  timeline = timeline.filter((t) => t.week !== newWeek.week).concat([newWeek]).slice(-8);

  await writeJson(env, "ai.json", {
    lastUpdated: utcIsoNow(),
    summary: {
      promptsTested: PROMPTS.length,
      data1noMentions: counters.data1no,
      data1noMentionRate: Math.round(rate * 10) / 10,
      micronetMentions: counters.micronet,
      competitorMentions: counters.competitors,
    },
    timeline,
    promptResults,
  });

  return { status: "ok" };
}
