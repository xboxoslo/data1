# Designgjennomgang av data1.no, 27. september 2026

## Konklusjon

Behold dagens statiske løsning og analysefunksjon. Moderniseringen bør gi tydelig navigasjon, en mer kompakt forside, en samlet visuell profil og enklere vei fra analyseresultat til hjelp. Plattformbytte er ikke nødvendig for disse endringene.

## Verifisert teknisk situasjon

- GitHub-repo: xboxoslo/data1. Main ved gjennomgangen: `2e7bd524f0423abe508d240b35590923c188d96a`, datert 26. september 2026.
- GitHub Pages API viser publisering fra main, rotkatalog, status built. Siste build fullført 26. september kl. 11:40:18 UTC.
- Cloudflare DNS peker hoveddomenet til GitHub Pages-adresser og www til xboxoslo.github.io. Begge er proxied.
- intake.data1.no peker til j51x9p29.up.railway.app, uten Cloudflare-proxy.
- Hovedfrontend er statisk HTML/CSS/JavaScript. Dashboardet har egne statiske CSS/JS-filer. Eldre dokumentasjon om Next.js/Vercel eller Cloudflare Pages beskriver ikke dagens hovedfrontend.
- Cloudflare Pages-prosjektet data1-insights er et separat prosjekt på insights.data1.no.
- Full filinventering: 488 filer, 230 HTML-filer. 215 HTML-filer har innebygde style-blokker. Generatorskript må omfattes av en varig designoppgradering.
- GitHub og Cloudflare DNS ble lest med eksisterende autentisert tilgang. Browser-dashboardet krevde Cloudflare Access engangskode. Innlogging ble overlatt til brukeren og er ikke fullført ved rapporttidspunktet.

## Viktigste funn

| Prioritet | Funn | Anbefalt endring |
|---|---|---|
| 1 | Prissidens pakkeoverskrift har rgb(255,255,255) tekst på rgb(255,255,255) bakgrunn. | Rett farger og gjennomgå kontrast på alle kort. |
| 1 | Forsidens synlige toppfelt har bare logo, uten hovedmeny. | Legg inn Sjekk domene, Rapporter, Verktøy, Guider og Priser. |
| 1 | Stor overskrift, skjold og avstander skyver søk langt ned. Ved 390 x 844 var søkefeltets topp cirka 757 CSS-piksler. | Kortere toppseksjon, mindre dekorasjon og søk tidligere i mobilvisningen. |
| 1 | Analyseresultatet skifter til en lys stil, mens forsiden er mørk og glødende. | Felles farger, typografi, knapper, bredder og kort på tvers av sidetyper. |
| 2 | 18 innholdslenker konkurrerer i en tett blokk før tilbudet. | Gruppér etter brukeroppgave, vis et begrenset utvalg og flytt resten til navigasjon/kategorisider. |
| 2 | Rapporten viser omfattende tekniske detaljer og flere handlinger samtidig. | Start med status, viktigste tiltak og én tydelig neste handling. Gjør rå DNS-data sammenleggbare. |
| 2 | Skjult rapportmodal har opacity 0 og pointer-events none, men visibility visible og ingen aria-hidden. Den vises i tilgjengelighetstreet. | Skjul modal semantisk og kontroller tastaturfokus ved åpning/lukking. |
| 2 | CSS ligger spredt i mange sider og i generatorskript. | Innfør felles designvariabler og basis-CSS; oppdater generatormalene samtidig. |
| 2 | Forsiden omtaler ukentlig rapportanalyse og månedlig statusrapport; prissiden omtaler månedlig analyse og kvartalsvis statusrapport. | Avklar og harmoniser leveransebeskrivelsene før nytt design publiseres. Prisene er ikke endret. |

## Foreslått designretning

Behold mørk marineblå og turkis som identitet. Bruk roligere bakgrunner, mindre glød og mer konsekvente innholdsbredder. Lag en kompakt toppseksjon med domenesøk og en enkel resultatillustrasjon. Vis Micronet tydelig som leverandør. La gratis sjekk være hovedhandlingen og hjelp med oppsett være neste steg etter resultatet.

Anbefalt forsiderekkefølge: navigasjon, domenesøk, kort forklaring av resultatet, tre steg for hjelp/oppsett, priser, utvalgte rapporter/guider, FAQ og kontaktinformasjon.

## Arbeidet som kreves

1. Lag et konkret designutkast av forside og analyseresultat for PC og mobil i lokal forhåndsvisning.
2. Innfør felles CSS og navigasjon i hovedsiden, prissiden, blogg- og rapportmalene. Oppdater scripts/weekly_blogpost.py, scripts/generate_domain_pages.py og scripts/generate_trends.py der de produserer layout.
3. Tilpass rapportmodal og resultatvisning uten å endre DNS-logikk, scoreberegning eller intake-integrasjoner.
4. Kontroller mobil, tastatur, kontrast, interne lenker og representative genererte sider. Bevar URL-er, metadata og strukturerte data.
5. Test rapport- og bestillingsflyt separat før publisering. Slike tester kan opprette Halo-saker/tilbud og sende e-post, og er ikke utført i denne gjennomgangen.

Grovt arbeidsestimat, ikke et pristilbud: 1 arbeidsdag for designutkast; ytterligere 2 til 4 arbeidsdager for en første implementasjon av de sentrale malene og verifikasjon. Hele innholdsbiblioteket kan kreve mer arbeid på grunn av spredt CSS.

## Utført og begrensninger

- Forside kontrollert visuelt på desktop og i mobilvisning 390 x 844.
- Eksempelanalyse av micronet.no fullførte og viste score 83 %, karakter A. Dette verifiserer at resultatvisningen fungerer; det er ikke en separat sikkerhetsrevisjon av Micronet.
- Prisside kontrollert visuelt og med computed styles.
- Publisering og DNS kontrollert gjennom GitHub og Cloudflare API.
- Ingen design-, pris-, DNS- eller backend-endringer er gjort. Ingen rapport eller bestilling er sendt.
- Internt dashboard er ikke gjennomgått etter innlogging. Dashboardkoden viser at det er et innsiktsdashboard, ikke en visuell nettsideeditor.

## Kilder

- https://data1.no/
- https://data1.no/priser/
- https://github.com/xboxoslo/data1
- GitHub Pages API for xboxoslo/data1 og eksisterende Cloudflare DNS-tilgang.
