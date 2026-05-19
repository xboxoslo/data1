import type { Env } from "./env";
import { syncEmail } from "./sync/email";
import { syncCompetitors } from "./sync/competitors";
import { syncSeo } from "./sync/seo";
import { syncAi } from "./sync/ai";
import { writeJson, utcIsoNow } from "./r2";

const FILES = ["email.json", "competitors.json", "seo.json", "ai.json", "meta.json"];

async function updateMeta(env: Env, results: Record<string, string>): Promise<void> {
  await writeJson(env, "meta.json", {
    lastUpdated: utcIsoNow(),
    sources: {
      email: "Worker DoH-scan av data1.no + micronet.no",
      competitors: "Worker sitemap-skraping",
      seo: "Worker GSC API",
      ai: "Worker Claude/GPT-4/Perplexity/Gemini",
    },
    lastRunResults: results,
  });
}

async function runDaily(env: Env, ctx: ExecutionContext): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  await Promise.allSettled([
    syncEmail(env).then((r) => { results.email = `ok (${r.scanned} domener)`; }, (e) => { results.email = `feil: ${e}`; }),
    syncCompetitors(env).then((r) => { results.competitors = `ok (${r.updated} oppdatert, ${r.skipped} hoppet over)`; }, (e) => { results.competitors = `feil: ${e}`; }),
    syncSeo(env).then((r) => { results.seo = r.status === "ok" ? "ok" : `${r.status}: ${r.reason}`; }, (e) => { results.seo = `feil: ${e}`; }),
  ]);
  ctx.waitUntil(updateMeta(env, results));
  return results;
}

async function runWeekly(env: Env, ctx: ExecutionContext): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  const r = await syncAi(env).catch((e) => ({ status: "error" as const, reason: String(e) }));
  results.ai = r.status === "ok" ? "ok" : `${r.status}: ${"reason" in r ? r.reason : ""}`;
  ctx.waitUntil(updateMeta(env, results));
  return results;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    if (event.cron === "0 7 * * 1") {
      await runWeekly(env, ctx);
    } else {
      await runDaily(env, ctx);
    }
  },

  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;

    if (path === "/" || path === "/healthz") {
      return new Response("data1-dashboard-sync worker — see /dashboard-data/* for JSON\n", {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // POST /sync/{daily|weekly|all} for manuell trigger (auth: ?token=<env secret> i v1)
    if (req.method === "POST" && path.startsWith("/sync/")) {
      const which = path.slice("/sync/".length);
      const results: Record<string, string> = {};
      if (which === "daily" || which === "all") Object.assign(results, await runDaily(env, ctx));
      if (which === "weekly" || which === "all") Object.assign(results, await runWeekly(env, ctx));
      return Response.json(results);
    }

    if (path.startsWith("/dashboard-data/")) {
      const key = path.slice("/dashboard-data/".length);
      if (!FILES.includes(key)) return new Response("Not found", { status: 404 });
      const obj = await env.DATA.get(key);
      if (!obj) return new Response("Not yet synced", { status: 404 });
      return new Response(obj.body, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Access-Control-Allow-Origin": "https://data1.no",
        },
      });
    }

    return new Response("Not found", { status: 404 });
  },
};
