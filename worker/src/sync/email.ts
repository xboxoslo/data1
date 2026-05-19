import type { Env } from "../env";
import { readJson, writeJson, utcIsoNow } from "../r2";

const DOH_URL = "https://cloudflare-dns.com/dns-query";
const DOH_HEADERS = { Accept: "application/dns-json", "User-Agent": "data1.no-bot/1.0" };

const OWN_DOMAINS = ["data1.no", "micronet.no"];

const DKIM_SELECTORS = [
  "selector1", "selector2", "google", "k1", "k2", "mandrill", "mxvault",
  "default", "dkim", "s1", "s2", "mail", "protonmail", "mailo",
];

interface DohAnswer { type: number; data: string }
interface DohResponse { Answer?: DohAnswer[] }

async function dohTxt(name: string): Promise<string[]> {
  const url = `${DOH_URL}?name=${encodeURIComponent(name)}&type=TXT`;
  try {
    const res = await fetch(url, { headers: DOH_HEADERS });
    if (!res.ok) return [];
    const data = (await res.json()) as DohResponse;
    return (data.Answer ?? [])
      .filter((a) => a.type === 16)
      .map((a) => a.data.replace(/^"|"$/g, "").replace(/""/g, ""));
  } catch {
    return [];
  }
}

interface SpfCheck { present: boolean; record: string | null; all_qualifier: string | null }
interface DmarcCheck { present: boolean; record: string | null; policy: string | null; pct: number | null }
interface DkimCheck { present: boolean; selectors: string[] }
interface SimpleCheck { present: boolean; record: string | null }

interface Checks {
  spf: SpfCheck;
  dmarc: DmarcCheck;
  dkim: DkimCheck;
  mta_sts: SimpleCheck;
  tls_rpt: SimpleCheck;
  bimi: SimpleCheck;
}

async function checkSpf(domain: string): Promise<SpfCheck> {
  const txts = await dohTxt(domain);
  const spf = txts.find((t) => t.toLowerCase().startsWith("v=spf1")) ?? null;
  const m = spf ? /([+\-~?])all/.exec(spf) : null;
  return { present: !!spf, record: spf, all_qualifier: m ? m[1] : null };
}

async function checkDmarc(domain: string): Promise<DmarcCheck> {
  const txts = await dohTxt(`_dmarc.${domain}`);
  const dmarc = txts.find((t) => t.toLowerCase().startsWith("v=dmarc1")) ?? null;
  let policy: string | null = null;
  let pct: number | null = null;
  if (dmarc) {
    const pm = /p=(\w+)/i.exec(dmarc);
    policy = pm ? pm[1].toLowerCase() : null;
    const pctM = /pct=(\d+)/i.exec(dmarc);
    pct = pctM ? parseInt(pctM[1], 10) : 100;
  }
  return { present: !!dmarc, record: dmarc, policy, pct };
}

async function checkDkim(domain: string): Promise<DkimCheck> {
  const found: string[] = [];
  await Promise.all(
    DKIM_SELECTORS.map(async (selector) => {
      const txts = await dohTxt(`${selector}._domainkey.${domain}`);
      for (const t of txts) {
        const lower = t.toLowerCase();
        if (lower.includes("v=dkim1") || lower.includes("p=")) {
          found.push(selector);
          break;
        }
      }
    }),
  );
  return { present: found.length > 0, selectors: found };
}

async function checkPrefixed(name: string, prefix: string): Promise<SimpleCheck> {
  const txts = await dohTxt(name);
  const rec = txts.find((t) => t.toLowerCase().startsWith(prefix)) ?? null;
  return { present: !!rec, record: rec };
}

function computeScore(c: Checks): { score: number; grade: string } {
  let score = 0;

  if (c.spf.present) {
    if (c.spf.all_qualifier === "-") score += 25;
    else if (c.spf.all_qualifier === "~") score += 20;
    else if (c.spf.all_qualifier === "?") score += 10;
    else score += 5;
  }

  if (c.dmarc.present) {
    if (c.dmarc.policy === "reject" && c.dmarc.pct === 100) score += 35;
    else if (c.dmarc.policy === "reject") score += 28;
    else if (c.dmarc.policy === "quarantine") score += 20;
    else score += 8;
  }

  if (c.dkim.present) score += 20;
  if (c.mta_sts.present) score += 12;
  if (c.tls_rpt.present) score += 5;
  if (c.bimi.present) score += 3;

  let grade: string;
  if (score >= 90) grade = "A+";
  else if (score >= 80) grade = "A";
  else if (score >= 70) grade = "B";
  else if (score >= 55) grade = "C";
  else if (score >= 35) grade = "D";
  else grade = "F";

  return { score, grade };
}

async function scanDomain(domain: string) {
  const [spf, dmarc, dkim, mta_sts, tls_rpt, bimi] = await Promise.all([
    checkSpf(domain),
    checkDmarc(domain),
    checkDkim(domain),
    checkPrefixed(`_mta-sts.${domain}`, "v=stsv1"),
    checkPrefixed(`_smtp._tls.${domain}`, "v=tlsrptv1"),
    checkPrefixed(`default._bimi.${domain}`, "v=bimi1"),
  ]);
  const checks: Checks = { spf, dmarc, dkim, mta_sts, tls_rpt, bimi };
  return { domain, ...computeScore(checks), checks };
}

interface OwnDomainCard {
  domain: string;
  score: number;
  grade: string;
  dmarc: string | null;
  spf: string | null;
  dkim: string | null;
  mtaSts: boolean;
  tlsRpt: boolean;
  bimi: boolean;
  lastChecked: string;
}

interface EmailFile {
  lastUpdated: string;
  ownDomains: OwnDomainCard[];
  trackedDomains?: unknown;
  weeklyChanges?: unknown;
  timeline?: unknown;
}

export async function syncEmail(env: Env): Promise<{ scanned: number }> {
  const cards: OwnDomainCard[] = [];
  for (const d of OWN_DOMAINS) {
    const r = await scanDomain(d);
    cards.push({
      domain: d,
      score: r.score,
      grade: r.grade,
      dmarc: r.checks.dmarc.record,
      spf: r.checks.spf.record,
      dkim: r.checks.dkim.selectors.length > 0 ? r.checks.dkim.selectors.join(", ") : null,
      mtaSts: r.checks.mta_sts.present,
      tlsRpt: r.checks.tls_rpt.present,
      bimi: r.checks.bimi.present,
      lastChecked: utcIsoNow(),
    });
  }

  // Behold eksisterende trackedDomains/weeklyChanges/timeline hvis de finnes —
  // de bygges fra _data/snapshots/ som ikke er tilgjengelig fra Worker uten ekstra
  // GitHub-fetch. Egne domener er den viktigste delen og oppdateres her.
  const existing = (await readJson<EmailFile>(env, "email.json")) ?? {
    lastUpdated: utcIsoNow(),
    ownDomains: [],
  };

  const payload: EmailFile = {
    lastUpdated: utcIsoNow(),
    ownDomains: cards,
    trackedDomains: existing.trackedDomains,
    weeklyChanges: existing.weeklyChanges,
    timeline: existing.timeline,
  };

  await writeJson(env, "email.json", payload);

  return { scanned: cards.length };
}
