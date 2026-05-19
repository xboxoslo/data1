import type { Env } from "../env";
import { readJson, writeJson, utcIsoNow } from "../r2";

const USER_AGENT = "data1-dashboard-competitors-sync/1.0";
const SITEMAP_PATHS = ["/sitemap.xml", "/sitemap_index.xml", "/sitemap-index.xml", "/post-sitemap.xml"];

interface Competitor {
  name: string;
  isOwn?: boolean;
  indexedPages?: number;
  domainRating?: number;
  backlinks?: number;
  lastArticle?: string;
  clicksPerMonth?: number;
}

interface CompetitorsFile {
  lastUpdated: string;
  competitors: Competitor[];
  note?: string;
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      cf: { cacheTtl: 0, cacheEverything: false },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function fetchSitemap(domain: string): Promise<string | null> {
  for (const path of SITEMAP_PATHS) {
    const txt = await fetchText(`https://${domain}${path}`);
    if (txt) return txt;
  }
  return null;
}

function countLocs(xml: string, domain: string): number {
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const sameDomain = locs.filter((u) => u.includes(domain));
  return sameDomain.length > 0 ? sameDomain.length : locs.length;
}

function lastModified(xml: string): string | null {
  const dates = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
  if (dates.length === 0) return null;
  const sorted = [...dates].sort().reverse();
  const iso = sorted[0].replace(/Z$/, "");
  const d = new Date(iso);
  if (isNaN(d.getTime())) return sorted[0].slice(0, 10);
  const months = [
    "januar", "februar", "mars", "april", "mai", "juni",
    "juli", "august", "september", "oktober", "november", "desember",
  ];
  return `${d.getUTCDate()}. ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

const KNOWN_DOMAINS = new Set([
  "data1.no", "sjekk.email", "dmarcstatus.no",
  "mxtoolbox.com", "easydmarc.com", "powerdmarc.com",
  "dmarcian.com", "valimail.com",
]);

export async function syncCompetitors(env: Env): Promise<{ updated: number; skipped: number }> {
  const existing = (await readJson<CompetitorsFile>(env, "competitors.json")) ?? {
    lastUpdated: utcIsoNow(),
    competitors: [],
  };

  let updated = 0;
  let skipped = 0;

  const out: Competitor[] = [];
  for (const c of existing.competitors) {
    if (c.name && KNOWN_DOMAINS.has(c.name)) {
      const xml = await fetchSitemap(c.name);
      if (xml) {
        c.indexedPages = countLocs(xml, c.name);
        const lm = lastModified(xml);
        if (lm) c.lastArticle = lm;
        updated++;
      } else {
        skipped++;
      }
    }
    out.push(c);
  }

  await writeJson(env, "competitors.json", {
    lastUpdated: utcIsoNow(),
    competitors: out,
    note: existing.note ?? "Domain Rating fra Ahrefs/SEMrush — manuell oppdatering i v1.",
  });

  return { updated, skipped };
}
