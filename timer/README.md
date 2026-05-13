# HaloTimer — PWA for tidsregistrering

Superenkel mobil-app som lar Halo-teknikere starte/stoppe timer på en åpen ticket og logge tiden som **public note** rett på ticketen.

## Live URL

`https://data1.no/timer/`

Legges til på iPhone/Android-hjemskjermen via "Legg til på Hjem-skjerm".

## Filer

- `index.html` — UI + CSS (single file)
- `app.js` — MSAL-login, ticket-liste, timer, n8n-kall
- `manifest.webmanifest` — PWA manifest
- `sw.js` — service worker (cacher app-shell, ikke API-kall)
- `icon-192.svg` / `icon-maskable.svg` — ikoner

## Konfigurasjon før første deploy

Rediger `app.js` topp:

```js
const CONFIG = {
  entra: {
    tenantId: 'ENTRA_TENANT_ID_HERE',  // ← fyll inn
    clientId: 'ENTRA_CLIENT_ID_HERE',  // ← fyll inn
    scopes: ['User.Read'],
  },
  n8n: {
    base: 'https://azuren8n.micronet.no',
    ticketsPath: '/webhook/timer-tickets',
    logPath: '/webhook/timer-log',
  },
};
```

## Avhengigheter

### 1. Entra app-registration (Single-page application)

I Entra ID → App registrations → New registration:

- Name: `HaloTimer PWA`
- Account types: Accounts in this organizational directory only
- Redirect URI: **Single-page application** → `https://data1.no/timer/`

Etter opprettelse:
- API permissions → Add → Microsoft Graph → Delegated → `User.Read` → Grant admin consent
- Authentication → Implicit grant: la stå disabled (vi bruker auth code + PKCE)
- Kopier **Application (client) ID** og **Directory (tenant) ID** → inn i `app.js`

### 2. n8n webhooks

Backend er to webhooks i `azuren8n.micronet.no`:

- `GET /webhook/timer-tickets` — auth via Bearer-token (MS access token), returner JSON-liste `[{id, summary, client_name}]`
- `POST /webhook/timer-log` — body `{ticket_id, minutes, note}`, returner `{ok: true}`

Begge må:
- Verifisere Bearer-token mot Microsoft Graph `/me` (HTTP Request-node)
- Slå opp Halo agent_id via `GET /api/Agent?search={email}`
- Bruke Halo system-credentials (`client_credentials` med `HALO_CLIENT_ID` + `HALO_CLIENT_SECRET`)
- Sette CORS-headers på respons: `Access-Control-Allow-Origin: https://data1.no`, `Access-Control-Allow-Headers: Authorization, Content-Type`, `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- Håndtere OPTIONS preflight

For `/webhook/timer-log` skal Halo Action opprettes med:
- `ticket_id` = body.ticket_id
- `timetaken` = body.minutes
- `note` = body.note (eller default "Tidsregistrering via HaloTimer")
- `who_agentid` = agent_id fra Graph-oppslag
- `outcome_id` = id for "Public Note" (hent via `scripts/halo_timer_probe.py`)

## Probe Halo for outcome_id

Kjør lokalt med Halo-credentials i `intake-secrets.env`:

```sh
python3 scripts/halo_timer_probe.py
```

Skriptet lister alle outcomes med id, navn og `ispublic`-flagg. Marker ⭐ vises på den anbefalte for public note. Også test-oppslag av agent på e-post + henting av åpne tickets.

## Sikkerhet

- Halo Client Secret bor **kun i n8n** (credentials), aldri i PWA
- PWA holder kun en MS access token (kortlevet, refresh via MSAL)
- Service worker cacher kun app-shell — API-kall går alltid live
- `noindex,nofollow` meta — appen skal ikke indekseres

## Begrensninger

- Én aktiv timer om gangen (med vilje, for "superenkel")
- Timer-state lagres i localStorage → overlever app-restart, men knyttet til denne enheten
- Hvis bruker logger inn på en annen enhet, ser den ikke timer-en i farten
- Lock-screen lukker ikke timer-en — `Date.now() - startMs` gir alltid riktig elapsed
