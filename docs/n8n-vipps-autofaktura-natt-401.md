# Vipps Auto-Faktura: natt-401 mot Tripletex (fikset 2026-09-02)

Workflow: «Vipps Auto-Faktura & Innbetaling · Juni2026» (`6kpgFcPKU1DPmvdI`, azuren8n.micronet.no)

## Symptom

Feilvarsel fra n8n hver natt kl. 00:00 og 01:00 norsk tid:

> HTTP 401: Could not log in. Check login info in Authorization header. (Tripletex, code 3000)

Feilende kjøringer: 32653 og 32905 (natt til 1. sep), 38927 og 39189 (natt til 2. sep).
Alle andre timekjøringer gikk grønt — feilen traff kun i vinduet 00:00–01:59 lokal tid.

## Rot-årsak

Code-noden «Behandle Vipps-ordrer» opprettet Tripletex session-token med

```js
const expDate = new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0];
```

`toISOString()` gir UTC-dato. Om sommeren (UTC+2) ligger UTC-datoen ett døgn bak lokal dato
mellom kl. 00:00 og 01:59. Da ble `expirationDate` satt til *dagens* lokale dato, og Tripletex
lar tokenet utløpe ved starten av den datoen — tokenet var altså dødt ved opprettelse, og
første API-kall fikk 401.

## Fiks

`+ 24` endret til `+ 48` timer, slik at `expirationDate` alltid er minst morgendagens dato
uansett tidssone-vindu. Ny workflow-versjon publisert 2026-09-02 (versjonsnavn
«Fiks natt-401 mot Tripletex (expirationDate +48t)»). Verifisert med grønn kjøring 40609.

## Kjent restpunkt (ikke endret)

`today` (brukes som `invoiceDate`) og `fromDate`/`toDate` beregnes fortsatt fra UTC-dato.
I samme natt-vindu (00–02 sommertid) dateres en eventuell faktura med gårsdagens dato —
kan gi feil periode ved månedsskifte. Vurder å beregne disse i Europe/Oslo hvis det er ønskelig.
