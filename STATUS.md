# Status

## 2026-09-27: Designgjennomgang

- Hovedsiden publiseres fra GitHub Pages, main, rotkatalog. Cloudflare ligger foran; intake ligger på Railway. Eldre henvisninger til Cloudflare Pages/Next.js er ikke korrekte for hovedfrontend.
- Gjennomgang og anbefalt oppgraderingsplan: [docs/design-review-2026-09-27.md](docs/design-review-2026-09-27.md).
- Viktigste funn: hvit pakkeoverskrift på hvit bakgrunn på /priser/, manglende tydelig hovedmeny, for høy toppseksjon på mobil, ulike visuelle stiler og spredt CSS.
- Offentlig analyse fungerer i gjennomgangen. Intet design eller noen integrasjoner er endret.
- /dashboard/ krever Cloudflare Access engangskode; brukeren må fullføre browser-innlogging før intern visuell gjennomgang.
- Neste arbeid: lokal designforhåndsvisning av forside og resultat, deretter oppdatering av felles CSS og generatormaler. Publiseringsarbeid er ikke igangsatt.
