import type { Env } from "../env";
import { readJson, writeJson, utcIsoNow } from "../r2";

const SITE_URL = "https://data1.no/";
const USER_AGENT = "data1-dashboard-seo-sync/1.0";

interface GscRow { keys?: string[]; clicks?: number; impressions?: number; position?: number; ctr?: number }
interface GscResponse { rows?: GscRow[] }

async function getAccessToken(env: Env): Promise<string | null> {
  if (!env.GSC_CLIENT_ID || !env.GSC_CLIENT_SECRET || !env.GSC_REFRESH_TOKEN) return null;
  const body = new URLSearchParams({
    client_id: env.GSC_CLIENT_ID,
    client_secret: env.GSC_CLIENT_SECRET,
    refresh_token: env.GSC_REFRESH_TOKEN,
    grant_type: "refresh_token",
  });
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": USER_AGENT },
      body,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { access_token?: string };
    return json.access_token ?? null;
  } catch {
    return null;
  }
}

async function queryGsc(token: string, request: Record<string, unknown>): Promise<GscResponse | null> {
  const url = `https://searchconsole.googleapis.com/v1/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify(request),
    });
    if (!res.ok) return null;
    return (await res.json()) as GscResponse;
  } catch {
    return null;
  }
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function syncSeo(env: Env): Promise<{ status: "ok" | "skipped" | "error"; reason?: string }> {
  const token = await getAccessToken(env);
  if (!token) {
    const existing = await readJson<Record<string, unknown>>(env, "seo.json");
    if (existing) {
      existing.lastUpdated = utcIsoNow();
      existing._note = "GSC OAuth ikke konfigurert. Sett GSC_CLIENT_ID/SECRET/REFRESH_TOKEN som worker-secrets.";
      await writeJson(env, "seo.json", existing);
    }
    return { status: "skipped", reason: "GSC OAuth-secrets mangler" };
  }

  const today = new Date();
  const last28 = new Date(today);
  last28.setUTCDate(last28.getUTCDate() - 28);
  const last90 = new Date(today);
  last90.setUTCDate(last90.getUTCDate() - 90);

  const [timeline, queries, pages, summary] = await Promise.all([
    queryGsc(token, { startDate: isoDate(last90), endDate: isoDate(today), dimensions: ["date"], rowLimit: 200 }),
    queryGsc(token, { startDate: isoDate(last28), endDate: isoDate(today), dimensions: ["query"], rowLimit: 50 }),
    queryGsc(token, { startDate: isoDate(last28), endDate: isoDate(today), dimensions: ["page"], rowLimit: 25 }),
    queryGsc(token, { startDate: isoDate(last28), endDate: isoDate(today), dimensions: [], rowLimit: 1 }),
  ]);

  if (!timeline || !queries || !pages || !summary) {
    return { status: "error", reason: "GSC API-kall feilet" };
  }

  const s: GscRow = summary.rows?.[0] ?? {};

  const payload = {
    lastUpdated: utcIsoNow(),
    summary: {
      indexedPages: pages.rows?.length ?? 0,
      totalPages: 200,
      clicks28d: Math.round(s.clicks ?? 0),
      impressions28d: Math.round(s.impressions ?? 0),
      avgPosition: Math.round((s.position ?? 0) * 10) / 10,
      ctr: Math.round((s.ctr ?? 0) * 10000) / 100,
    },
    timeline: (timeline.rows ?? []).map((r) => ({
      date: r.keys?.[0] ?? "",
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
    })),
    topQueries: (queries.rows ?? []).map((r) => ({
      query: r.keys?.[0] ?? "",
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      position: r.position ?? 0,
    })),
    topPages: (pages.rows ?? []).map((r) => {
      const url = r.keys?.[0] ?? "";
      let path = "/";
      try { path = new URL(url).pathname || "/"; } catch { /* ignore */ }
      return { url: path, clicks: r.clicks ?? 0, impressions: r.impressions ?? 0 };
    }),
    indexingStatus: [],
  };

  await writeJson(env, "seo.json", payload);
  return { status: "ok" };
}
