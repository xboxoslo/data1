# data1-dashboard-sync (Cloudflare Worker)

Cloudflare-native erstatning for `.github/workflows/dashboard-sync.yml` —
samme fire syncer (email / competitors / seo / ai), men kjører som
Worker med Cron Triggers og lagrer JSON-filene i en R2-bucket.

## Hvorfor Worker i stedet for GitHub Actions?

- Ingen commit-støy i `main`-grenen for hver dataoppdatering
- Lavere latency (Cloudflare edge fremfor GitHub-runner cold start)
- Secrets ligger samme sted som domenet, kan roteres uten å redeploye

## Førstegangs-deploy

```bash
cd worker
npm install
npx wrangler login                    # autentiser mot Cloudflare
npx wrangler r2 bucket create data1-dashboard
npx wrangler deploy
```

Etter første deploy: legg til hemmeligheter (kun GSC og AI — email +
competitors trenger ingen):

```bash
npx wrangler secret put GSC_CLIENT_ID
npx wrangler secret put GSC_CLIENT_SECRET
npx wrangler secret put GSC_REFRESH_TOKEN
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put PERPLEXITY_API_KEY
npx wrangler secret put GEMINI_API_KEY
```

## Manuell test

```bash
# Trigger daily sync (email + competitors + seo)
curl -X POST https://data1-dashboard-sync.<account>.workers.dev/sync/daily

# Trigger weekly sync (ai)
curl -X POST https://data1-dashboard-sync.<account>.workers.dev/sync/weekly

# Trigger alt
curl -X POST https://data1-dashboard-sync.<account>.workers.dev/sync/all

# Les en av fil-output
curl https://data1-dashboard-sync.<account>.workers.dev/dashboard-data/email.json
```

## Cron-schedule

Konfigurert i `wrangler.toml`:

- `30 6 * * *` — daglig 06:30 UTC: email, competitors, seo
- `0 7 * * 1`  — ukentlig mandag 07:00 UTC: ai

## Bytte route til data1.no

I dag returnerer Worker JSON på `*.workers.dev/dashboard-data/*`.
For å la den ta over `data1.no/dashboard-data/*` (i stedet for Cloudflare
Pages-versjonen som nå serveres derfra), legg til en zone-route i Cloudflare:

1. Dashboard → Workers & Pages → `data1-dashboard-sync` → Settings → Triggers
2. Add route: `data1.no/dashboard-data/*` → samme worker
3. Cloudflare Access-appen på `/dashboard-data/*` fortsetter å beskytte ruten

## Hva er portet, hva er ikke

| Sync | Status | Kommentar |
|---|---|---|
| `competitors` | Full | Sitemap-skraping fra 8 konkurrenter, samme logikk som Python-versjonen |
| `email` (egne domener) | Full | DoH-scan av data1.no + micronet.no med samme scoring (SPF/DMARC/DKIM/MTA-STS/TLS-RPT/BIMI). Score-vektingen er bit-for-bit lik `daily_scan.py` |
| `email` (158 sporede) | **TODO** | Worker har ikke tilgang til `_data/snapshots/*.json`. Alternativer: (a) fetch fra GitHub raw, (b) skann fra Worker direkte (158 × 6 DoH-lookups), (c) skip og la GitHub Actions fortsette aggregatet |
| `seo` | Full | GSC OAuth refresh + Search Analytics API — hopper gracefully over hvis secrets mangler |
| `ai` | Full | 20 prompts × 4 modeller (Claude/GPT-4o/Perplexity/Gemini) — hopper gracefully over hvis secrets mangler |

## Forholdet til GitHub Actions-versjonen

`.github/workflows/dashboard-sync.yml` og `scripts/dashboard_*_sync.py` er
*ikke* slettet. De skriver fortsatt til `dashboard-data/*.json` i repoet,
og Cloudflare Pages serverer den fila på `data1.no/dashboard-data/*`.

Når du har deployet Worker-en og verifisert at den fyller R2 riktig, kan
du:
1. Legge til zone-routen `data1.no/dashboard-data/*`
2. Slette `.github/workflows/dashboard-sync.yml` og `scripts/dashboard_*_sync.py`
3. Eventuelt slette de statiske `dashboard-data/*.json`-filene fra repoet

Inntil videre kjører begge spor parallelt — Worker-en overstyrer ikke
Pages før du eksplisitt legger til routen.
