# n8n-oppsett for data1.no admin-dashboard

Dashboardet på [data1.no/dashboard](https://data1.no/dashboard/) leser fire JSON-filer fra `/dashboard-data/`. Disse filene oppdateres av fire n8n-workflows på `azuren8n.micronet.no`. Hver workflow committer fila tilbake til GitHub-repoet `xboxoslo/data1` via GitHub API.

## Fellesoppsett

### GitHub API-tilgang

n8n trenger en **fine-grained personal access token** på `xboxoslo`-kontoen:
- Repository access: `xboxoslo/data1`
- Permissions: `Contents: Read and write`, `Metadata: Read-only`
- Lagre som n8n-credential `github-data1-write`

### Commit-pattern fra n8n

Hver workflow gjør samme avslutning:

1. Hent eksisterende fil-SHA fra GitHub (`GET /repos/xboxoslo/data1/contents/dashboard-data/{file}.json?ref=main`).
2. Base64-encode den nye JSON-en.
3. `PUT /repos/xboxoslo/data1/contents/dashboard-data/{file}.json` med:
   ```json
   {
     "message": "data: oppdater dashboard-data/{file}.json (n8n)",
     "content": "<base64>",
     "sha": "<eksisterende-sha>",
     "branch": "main"
   }
   ```
4. Cloudflare Pages deployer automatisk fra `main` (~2 min).

### Felles workflow-tag

Tagg alle dashboard-workflows med `dashboard` i n8n så de er enkle å finne og slå av samlet.

---

## 1. `dashboard-seo-sync` (daglig)

**Trigger:** Cron, hver dag kl `06:00 UTC` (08:00 CET sommerhalvår).

**Output:** `dashboard-data/seo.json`

### Steg

1. **GSC OAuth2 connect** — Bruk eksisterende `gsc-data1-no` credential (eller opprett ny via Google Cloud Console → OAuth client, scope `https://www.googleapis.com/auth/webmasters.readonly`, autoriser eieren av data1.no-property).

2. **Query 1 — `searchanalytics.query` (klikk/visninger per dato siste 90 dager)**
   ```
   POST https://searchconsole.googleapis.com/v1/sites/https%3A%2F%2Fdata1.no/searchAnalytics/query
   Body: { "startDate": "<90d ago>", "endDate": "<today>", "dimensions": ["date"], "rowLimit": 100 }
   ```

3. **Query 2 — topp søkeord siste 28 dager**
   ```
   Body: { "startDate": "<28d ago>", "endDate": "<today>", "dimensions": ["query"], "rowLimit": 50 }
   ```

4. **Query 3 — topp sider siste 28 dager**
   ```
   Body: { "startDate": "<28d ago>", "endDate": "<today>", "dimensions": ["page"], "rowLimit": 25 }
   ```

5. **Indekseringsstatus** — for hver URL i `/sitemap.xml` (parse i Function node), kall:
   ```
   POST https://searchconsole.googleapis.com/v1/urlInspection/index:inspect
   Body: { "inspectionUrl": "<url>", "siteUrl": "https://data1.no/" }
   ```
   Throttle til ~10 req/sek for å unngå GSC rate-limit (2000 inspeksjoner/dag/eiendom).
   Mapping: `indexStatusResult.verdict` → vår `status`:
   - `PASS` → `indexed`
   - `NEUTRAL` → `crawled-not-indexed`
   - `PARTIAL` → `discovered`
   - `FAIL` → `excluded`

6. **Aggregate & commit** — Function node bygger opp `seo.json` per skjemaet i `dashboard-data/seo.json` (se sjekket inn dummy-fil for full struktur), så GitHub-commit via fellessteg over.

**Kostnad:** Gratis (GSC API har gratis quota).

---

## 2. `dashboard-ai-sync` (ukentlig)

**Trigger:** Cron, mandag kl `06:00 UTC`.

**Output:** `dashboard-data/ai.json`

### Steg

1. **Hardkodet prompts-liste** — 20 norske prompts (se også `dashboard/index.html` AI-tab-kode for fullstendig liste).

2. **For hver prompt × 4 modeller (= 80 kall):**

   - **Claude Sonnet 4.7** — `POST https://api.anthropic.com/v1/messages`
     - Credential: `anthropic-api` (header `x-api-key`)
     - Body: `{ "model": "claude-sonnet-4-7", "max_tokens": 1024, "messages": [{"role":"user","content":"<prompt>"}] }`
   - **GPT-4 (OpenAI)** — `POST https://api.openai.com/v1/chat/completions`
     - Credential: `openai-api`
     - Body: `{ "model": "gpt-4o", "messages": [{"role":"user","content":"<prompt>"}] }`
   - **Perplexity** — `POST https://api.perplexity.ai/chat/completions`
     - Credential: `perplexity-api`
     - Body: `{ "model": "sonar", "messages": [{"role":"user","content":"<prompt>"}] }`
   - **Gemini** — `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent`
     - Credential: `google-gemini-api`

3. **Parsing (Function node)** — for hvert svar, sjekk om `responseText.toLowerCase()` inneholder:
   - `data1.no` → `data1noMentioned: true`
   - `micronet` → `micronetMentioned: true`
   - hver konkurrent-streng → competitor-counter

4. **Capture snippet** — første setning hvor `data1.no` nevnes (regex `/[^.!?]*data1\.no[^.!?]*[.!?]/i`).

5. **Append til timeline** — Last existing `ai.json`, push ny uke til `timeline[]`, behold siste 8 uker.

6. **Commit til GitHub.**

**Estimert kost per kjøring:**
- Anthropic: ~$0.20 (20 prompts × ~500 tokens × $3/M output)
- OpenAI: ~$0.15
- Perplexity: ~$0.10
- Gemini: gratis-tier dekker
- **Totalt ~$0.45/uke = ~$24/år**

---

## 3. `dashboard-email-sync` (daglig)

**Trigger:** Cron, hver dag kl `03:00 UTC`.

**Output:** `dashboard-data/email.json`

### Steg

1. **Hent dagens DMARC-scan** — kobles til eksisterende `daily_scan.py`-output. Workflow kan lese fra `_data/snapshots/<dato>.json` via raw GitHub-URL:
   ```
   GET https://raw.githubusercontent.com/xboxoslo/data1/main/_data/snapshots/<YYYY-MM-DD>.json
   ```

2. **Sjekk egne domener** (`data1.no`, `micronet.no`) — kjør samme score-logikk som `scripts/daily_scan.py` eller hardkod per domene siden de er stabile.

3. **Aggreger 158 trackede domener:**
   - `total = antall i scan`
   - `withReject = antall med p=reject`
   - `withQuarantine = antall med p=quarantine`
   - `withNone = antall med p=none`
   - `missing = antall uten DMARC`
   - `rejectPercent = withReject / total * 100`

4. **Sammenlign med forrige uke** — last forrige `_data/snapshots/<dato-7d>.json`, finn diff per domene, populer `weeklyChanges.improved[]` og `weeklyChanges.regressed[]`.

5. **Timeline** — append `{week: "<W>", rejectPercent: <%>}`, behold 12 uker.

6. **Commit til GitHub.**

**Kostnad:** Gratis (egen data).

---

## 4. `dashboard-competitors-sync` (ukentlig)

**Trigger:** Cron, søndag kl `06:00 UTC`.

**Output:** `dashboard-data/competitors.json`

### Steg

1. **Ahrefs MCP / API** — Hent for hver konkurrent (`sjekk.email`, `dmarcstatus.no`, `mxtoolbox.com`, `easydmarc.com`, `powerdmarc.com`, `dmarcian.com`, `valimail.com`, og `data1.no` selv):
   - Domain Rating
   - Total backlinks
   - Indexed pages estimate

2. **Sitemap-scraping** for de tre norske konkurrentene (`sjekk.email`, `dmarcstatus.no`) — `GET https://<konkurrent>/sitemap.xml`, tell `<loc>`-noder, finn siste `<lastmod>`.

3. **Klikk per måned** — hent fra Ahrefs Organic Traffic-estimat eller la stå `null`.

4. **Bygg `competitors[]`-array** per skjema i `dashboard-data/competitors.json`.

5. **Commit til GitHub.**

**Kostnad:** Avhenger av Ahrefs-plan (allerede betalt via Micronet).

---

## Cloudflare Access (auth)

Beskytter `/dashboard/*` og `/dashboard-data/*` på edge-nivå før forespørselen treffer Cloudflare Pages. Settes opp manuelt:

1. Cloudflare Dashboard → `data1.no` → Zero Trust → Access → Applications → **Add an application** → "Self-hosted"
2. **Application name:** `data1.no Dashboard`
3. **Session duration:** `24 hours`
4. **Application domain:**
   - `data1.no/dashboard/*`
   - `data1.no/dashboard-data/*`
5. **Identity providers:** Google (Terje@micronet.no) + Email OTP fallback
6. **Policy → Include:**
   - Email: `terje@micronet.no`
   - Email: `ronalyn@micronet.no` (hvis Ronalyn skal ha tilgang)
7. **Lagre.**

Resultat: Edge returnerer 302 til `<team>.cloudflareaccess.com/cdn-cgi/access/login/...` for uautentiserte requests. JWT-token settes som cookie etter pålogging og holder i 24 timer.

## "Tving oppdatering nå"-knapp (valgfritt, fase 9)

For å trigge alle 4 n8n-workflows manuelt fra dashboardet:

1. Lag en parent-workflow `dashboard-force-refresh` med Webhook-trigger.
2. Bygg fire HTTP-noder som hver kaller respektive subwf via internal n8n REST API.
3. Lag webhook-URL, lagre i Cloudflare Worker / API-route. Knappen sender `POST` med Cloudflare Access JWT i header for autentisering.

(Foreløpig ikke implementert — dashboard-knapp er forberedt i HTML men ikke aktiv.)

## Feilsøking

- **JSON-fila vises ikke etter commit:** vent på Cloudflare Pages-deploy (`~2 min`), hard-refresh.
- **GSC API returnerer 403:** sjekk at OAuth-credential har riktig scope og at brukeren er verifisert eier på property-en.
- **Anthropic 429:** legg inn 1s sleep mellom prompts.
- **GitHub PUT 409:** SHA er stale — hent på nytt og prøv en gang til.
