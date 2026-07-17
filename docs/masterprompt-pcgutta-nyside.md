# MASTERPROMPT: Ny PCGutta.no under staging.pcgutta.no/nyside — avansert SEO, lokal SEO, GEO + dedikert «Microsoft 365 Oslo»-landingsside

## /goal
1. Bygg hele løsningen som en **egen, isolert test under `staging.pcgutta.no/nyside`**. Ingenting av det eksisterende nettstedet (produksjon, nettbutikk, ordre, kunder, URL-er) skal påvirkes.
2. Primært SEO-mål: nettstedet — med den dedikerte landingssiden som spydspiss — skal rangere høyest mulig organisk på Google for **«Office 365 Oslo»** og variantene «Microsoft 365 Oslo», «Office 365 hjelp Oslo», «Microsoft 365 bedrift Oslo», «hjelp med Office 365», «Microsoft 365 konsulent Oslo». Konkurrentene som skal slås er **itkonsulent1.no** og **eplecheck.no/datahjelp-i-oslo/hjelp-med-office/** (ikke gulesider.no — katalog, urealistisk mål).
3. **Gjør ALT ferdig før du stiller ett eneste spørsmål.** Ikke stopp for avklaringer underveis. Alt som mangler informasjon, tilgang eller godkjenning skal dokumenteres i `docs/VERIFISER-FOR-LANSERING.md` og `TODO-MANUELT.md` — og så fortsetter du med neste oppgave.

---

## Rolle

Du er et tverrfaglig senior-team bestående av: teknisk arkitekt, senior fullstack-utvikler, UI/UX-designer, teknisk SEO-spesialist, lokal SEO-spesialist, GEO/AEO-spesialist, konverteringsspesialist, sikkerhetsekspert, tilgjengelighetsekspert, innholdsstrateg og kvalitetsansvarlig.

Oppgaven er å analysere, redesigne og bygge en moderne, rask og konverteringssterk versjon av PCGutta.no — som en isolert testinstans under `staging.pcgutta.no/nyside`. Alt innhold skrives på norsk (bokmål). Målgruppen er privatpersoner og små/mellomstore bedrifter, med Oslo-området som lokalt hovedmarked og hele Norge via fjernhjelp.

Ikke lag en statisk demo som bare ser riktig ut. Løsningen skal være produksjonsklar, teknisk robust, enkel å vedlikeholde og optimalisert for både tradisjonelle søkemotorer og AI-baserte søketjenester.

---

## ABSOLUTTE REGLER — brudd er feil uansett hvor bra resten er

1. **Alt bygges under `staging.pcgutta.no/nyside`.** IKKE rediger, slett eller flytt eksisterende produksjonsfiler, sider, produkter, ordre eller kundedata. Du oppretter kun nye filer/sider i det isolerte testområdet. Hvis en forbedring krever endring i noe eksisterende (meny, footer, forside, sitemap, DNS, redirects), skal du IKKE gjøre endringen — skriv den i stedet som et punkt i `TODO-MANUELT.md` med eksakt hva som skal endres, hvor, og hvorfor.
2. **Staging skal ikke indekseres.** Hele `staging.pcgutta.no/nyside` skal ha `noindex, nofollow` (meta robots eller X-Robots-Tag) og robots.txt-blokkering, og skal IKKE meldes inn i noen sitemap som Google ser. All SEO bygges ferdig og klar, men canonical-URL-er, sitemap og indeksering dokumenteres som **fremtidige produksjons-URL-er** (`pcgutta.no/...`) i lanseringsplanen, og aktiveres først ved produksjonssetting. Duplikatinnhold på staging som indekseres av Google vil skade hovedmålet — dette punktet er ikke valgfritt.
3. **Ikke dikt opp fakta.** Bruk kun opplysningene i «Fakta om virksomheten» under. Ingen oppdiktede anmeldelser, kundeantall, sertifiseringer, responstider, garantier, priser, åpningstider, samarbeidspartnere, geografisk dekning, statistikk eller rangeringer. Trengs en pris eller påstand du ikke har dokumentasjon for: skriv «Be om pristilbud» / utelat påstanden, og noter det i `docs/VERIFISER-FOR-LANSERING.md`.
4. **Ingen keyword-stuffing.** Søkefrasene skal inn der de har SEO-verdi (title, H1, URL, tidlig i brødtekst, alt-tekster, FAQ-spørsmål), men teksten skal lese naturlig for et menneske. Skriv for kunden først.
5. **Ikke stopp etter å ha laget en plan.** Implementer, test, rett egne feil, dokumenter — og fortsett til alt i leveranselisten er ferdig. Spørsmål samles opp til slutt.
6. **Ingen hemmeligheter, API-nøkler eller passord i repoet.**
7. Ikke sett noe i produksjon automatisk. Lansering til pcgutta.no er en egen, manuelt godkjent operasjon beskrevet i lanseringsplanen.

---

## Fakta om virksomheten (eneste tillatte faktakilde)

- Merkevare: **PC-Gutta** — del av Micronet AS
- Juridisk selskap: Micronet AS, org.nr. NO 990 661 766 MVA
  - ⚠️ **VERIFISER før publisering:** offentlige kilder viser også «PC-Gutta AS, org.nr. 987 862 424». Legg org.nr. i sentral konfig med tydelig `VERIFISER`-markering og noter avviket i `docs/VERIFISER-FOR-LANSERING.md`. Ikke publiser juridisk informasjon før dette er avklart.
- Telefon: 22 80 20 40 (Lørenskog) / 69 29 40 40 (Moss)
- E-post: post@pc-gutta.no
- Adresse: Kjennveien 167, 1473 Lørenskog (verksted man–fre 09–15) + kontor i Moss
- Primært marked: Norge. Primærspråk: norsk bokmål.
- Lokalt hovedområde: Lørenskog, Oslo, Romerike og nærliggende kommuner. Oppmøte i Oslo, Lørenskog, Lillestrøm og omegn; hele Norge via fjernhjelp.
- Etablert: 2007
- Tjenester i dag: PC-reparasjon, dataservice, datahjelp, fjernhjelp, virusfjerning, sikkerhet, backup, Microsoft 365 (leverer og administrerer lisenser tilpasset behov, hjelper med «E-post, Microsoft 365 og Office-problemer» via fjernhjelp), nettverk, Wi-Fi, oppgraderinger, opplæring og IT-support.
- Kjente priser: sikkerhetspakker fra 129,-/mnd; fjernhjelpsavtale 2 890 kr/år (3 timer / 6 halvtimer). Andre priser skal IKKE hardkodes — hentes fra sentral konfigurasjon eller merkes «be om tilbud».
- Google-vurdering: 3,8 av 5 (26 anmeldelser) — IKKE bruk stjernerating i aggregateRating-schema (self-serving) og ikke gjengi anmeldelser som ikke kan spores til legitim kilde.
- Historikk og påstander som «20+ års erfaring», sertifiseringer, antall kunder og partnerstatus brukes kun dersom de kan dokumenteres.

**Opprett sentrale konfigurasjonsfiler eller CMS-felter for all virksomhetsinformasjon** (telefon, adresse, priser, åpningstider, org.nr., e-post) slik at ingenting gjentas manuelt i kildekoden.

---

## Overordnede mål

Nettsiden skal:

1. Generere flere telefonhenvendelser.
2. Generere flere supportsaker og kontaktskjemaer.
3. Få flere kunder til å starte fjernhjelp.
4. Selge relevante abonnementer og sikkerhetstjenester.
5. Rangere bedre på kommersielle og lokale søk — med «Office 365 Oslo» som det prioriterte søket (se /goal).
6. Bli forstått, sitert og anbefalt av AI-søkemotorer.
7. Bygge høyere tillit enn lokale konkurrenter.
8. Være rask og enkel å bruke på mobil.
9. Tydelig skille mellom privat- og bedriftskunder.
10. Ivareta eksisterende rangeringer, lenker, URL-er og nettbutikkfunksjoner — testinstansen skal ikke røre dem, og lanseringsplanen skal beskytte dem.

Primære konverteringer: ring PC-Gutta, bestill hjelp, start fjernhjelp, lever PC på verksted, bestill hjemmebesøk, få bedriftstilbud, kjøp sikkerhet eller supportavtale.

Alle sider skal ha én tydelig primærhandling og maksimalt én eller to sekundærhandlinger.

---

## Arbeidsmetode

### Fase A: Kartlegging

Før du endrer kode:

1. Undersøk hele repoet/plattformen. Identifiser rammeverk, CMS, tema, plugins, byggeverktøy og hostingmodell (dagens pcgutta.no er WordPress/WooCommerce — bekreft).
2. Finn alle eksisterende sider, innlegg, produkter og URL-er.
3. Kartlegg: navigasjon, skjemaer, nettbutikk, innlogging, betaling, fjernhjelpsintegrasjon, analyseverktøy, cookies, redirects, schema, sitemap, robots.txt, metadata, canonical-lenker.
4. Finn teknisk gjeld og sikkerhetsrisiko. Kjent problem som skal dokumenteres (ikke fikses nå): domeneblanding pcgutta.no / pc-gutta.no / www — påpek i TODO-MANUELT.md med anbefalt kanonisering.
5. Kartlegg alle eksisterende indekserbare URL-er og opprett en URL-migreringsplan **før** noen fremtidig URL-struktur besluttes.
6. Ikke slett eller erstatt funksjonalitet uten først å dokumentere hva den brukes til. Bevar nødvendige redaktør- og handelsfunksjoner (WooCommerce-data, ordre, kunder, produkter).

Opprett revisjonsrapport `docs/current-site-audit.md` med: nåværende arkitektur, kritiske problemer, migreringsrisiko, funksjoner som må beholdes, anbefalt målarkitektur, prioritert implementeringsrekkefølge. **Fortsett deretter direkte med implementeringen uten å stoppe ved rapporten.**

### Fase B: Designsystem og informasjonsarkitektur

Lag først: sitemap, navigasjonsstruktur, sidehierarki, innholdstyper, komponentoversikt, design tokens, konverteringsflyter.

### Fase C: Implementering

Implementer løsning, innholdsmaler, SEO, schema, tracking og tester — alt under `staging.pcgutta.no/nyside`.

### Fase D: Kvalitetssikring

Kjør: build, lint, typecheck, enhetstester, integrasjonstester, tilgjengelighetstester, lenketest, metadata-validering, schema-validering, Lighthouse-kontroll, mobilkontroll. **Rett problemene du finner. Ikke bare rapporter dem.**

---

## PRIORITET 1-LEVERANSE: Landingssiden «Microsoft 365 Oslo»

Dette er spydspissen for /goal og skal bygges først og best.

### Hovedlandingsside

- **URL (staging):** `staging.pcgutta.no/nyside/microsoft-365-oslo/` — **produksjons-URL ved lansering:** `pcgutta.no/microsoft-365-oslo/` (dokumenteres i lanseringsplan)
- **Title (≤60 tegn):** `Microsoft 365 for bedrifter i Oslo | PC-Gutta`
- **Meta description (140–155 tegn):** inkluder «Office 365», «Oslo», telefonnummer og en tydelig CTA.
- **H1:** «Hjelp med Microsoft 365 og Office 365 i Oslo»

Innholdsstruktur (~1200–1800 ord totalt, korte avsnitt, mye mellomtitler):

1. **Hero:** H1 + 2–3 setninger som nevner Office 365, Oslo, fjernhjelp og oppmøte + klikkbar telefon-CTA (`tel:+4722802040`) + e-post-CTA.
2. **Hva vi hjelper med (H2):** kort-grid: oppsett av nye brukere og e-post, migrering til Microsoft 365 fra eldre e-post, Outlook-feilsøking, Teams, OneDrive/SharePoint, MFA og sikkerhet, backup av Microsoft 365, lisensrådgivning. Hver med 1–2 setninger.
3. **Slik foregår det (H2):** 3 steg — kartlegging → gjennomføring → oppfølging. Fjernhjelp først, oppmøte i Oslo ved behov.
4. **For bedrifter i Oslo (H2):** lokaliseringsseksjon. Naturlig bruk av «Microsoft 365 Oslo» og «Office 365 Oslo» i løpende tekst, områdene Oslo / Lørenskog / Lillestrøm, og at fjernhjelp dekker hele Norge.
5. **Priser (H2):** kun reelle priser fra faktalisten + «be om tilbud» for prosjekter.
6. **Vanlige Outlook/Microsoft 365-problemer vi løser (H2):** 8–12 konkrete problemformuleringer folk googler (f.eks. «Outlook laster ikke ned e-post», «kan ikke aktivere Office-lisens», «OneDrive synkroniserer ikke») — long-tail-agn, samme grep som konkurrentene.
7. **FAQ (H2):** 6–8 spørsmål/svar, minst: «Hjelper dere bedrifter i Oslo?», «Er Office 365 og Microsoft 365 det samme?», «Kan dere flytte e-posten vår til Microsoft 365?», «Hva koster hjelpen?», «Tilbyr dere fjernhjelp?». Svar på 2–4 setninger.
8. **Avsluttende CTA:** telefon + e-post + åpningstider.

### Strukturerte data på landingssiden (JSON-LD)

- `LocalBusiness` (subtype `ITService` hvis gyldig): navn, org-info (fra konfig, med VERIFISER-flagg), telefon, den EKTE adressen (Lørenskog), `areaServed`: Oslo, Lørenskog, Lillestrøm, Norge (fjernhjelp), åpningstider, `url`, `email`.
- `Service`: serviceType «Microsoft 365 konsulentbistand», provider → LocalBusiness, areaServed Oslo.
- `FAQPage` med nøyaktig de samme spørsmålene/svarene som i synlig FAQ.
- `BreadcrumbList` (Hjem → Microsoft 365 Oslo).
- Valider mot schema.org — ingen felter med oppdiktet innhold. `@id`-referansene skal peke på fremtidige produksjons-URL-er (dokumentert), ikke staging-URL-er.

### To støtteartikler (samme regler)

1. `/flytte-epost-til-microsoft-365/` — guide: migrering fra IMAP/eldre Exchange/Domeneshop/one.com-type e-post til Microsoft 365. 800–1200 ord.
2. `/outlook-feil-og-losninger/` — oppslagsside for vanlige Outlook-feilkoder og -meldinger med kort løsning + «trenger du hjelp»-CTA.

Begge lenker kontekstuelt til `/microsoft-365-oslo/` (minst 2 lenker per artikkel) og til kontaktsiden. Egne title/meta/H1 etter samme prinsipper.

### Kvalitetssjekkliste for landingssiden (kjør før leveranse)

- [ ] Ingen eksisterende fil/side utenfor nyside-området er endret (verifiser med git status/diff)
- [ ] «Office 365» OG «Microsoft 365» finnes begge i title/H1/første avsnitt-området
- [ ] «Oslo» i title, H1, URL og minst 3 steder naturlig i brødtekst
- [ ] FAQ-tekst og FAQPage-JSON-LD er identiske
- [ ] Alle fakta spores tilbake til faktalisten — null antagelser
- [ ] Alle interne lenker peker på URL-er som faktisk finnes i nyside-strukturen (eller er markert «opprettes» i TODO-MANUELT.md)
- [ ] Teksten leser naturlig høyt — ingen setning eksisterer bare for SEO
- [ ] Staging-siden har noindex; produksjons-canonical er dokumentert i lanseringsplanen

---

## Teknologiske prinsipper

Bruk eksisterende stack dersom den er forsvarlig. Ikke migrer rammeverk uten tydelig teknisk og forretningsmessig begrunnelse.

Ved ny frontend foretrekk moderne, serverrendret arkitektur med: TypeScript, semantisk HTML, SSR eller statisk generering, svært lite unødvendig JavaScript, komponentbasert arkitektur, sentralisert SEO-konfigurasjon, automatisk sitemap, automatisk metadata, optimal bildehåndtering, god caching, sikre skjemaendepunkter.

Dersom prosjektet er WordPress/WooCommerce: vurder forbedring fremfor erstatning; bruk child theme eller vedlikeholdbar blokkbasert arkitektur; unngå unødvendig plugin-avhengighet; sørg for at WooCommerce-data ikke går tapt; behold redigerbarhet for ansatte; dokumenter egne hooks, templates og custom post types.

Ikke installer store avhengigheter for funksjoner som kan løses enkelt.

---

## Visuell retning

Designet skal oppleves som: profesjonelt, trygt, norsk, tilgjengelig, menneskelig, teknisk kompetent, moderne uten å ligne et generisk startup-nettsted.

Unngå: overdreven bruk av gradienter, tilfeldige animasjoner, store tekstblokker uten visuell struktur, generiske AI-bilder av mennesker, falske dashboards, stockbilder som ikke representerer virksomheten, aggressive popup-vinduer, mørke mønstre, «best i Norge»-påstander uten dokumentasjon, et design som ser automatisk AI-generert ut.

Bruk ekte bilder av ansatte, verkstedet, kontoret, reparasjoner, servicebiler, lokale omgivelser. Dersom ekte bilder ikke finnes: bygg gode bildeplassholdere med tydelige filnavn og instruksjoner i VERIFISER-listen. Ikke publiser tilfeldige eksterne bilder.

Designet skal ha: tydelig header, synlig telefonnummer, mobilvennlig ringeknapp, tydelig knapp for fjernhjelp, god luft, klare seksjoner, høy kontrast, lesbar typografi, konsistent kortdesign, tillitselementer nær konverteringspunktene, sticky mobilhandling dersom den ikke dekker viktig innhold.

---

## Hovednavigasjon

Enkel navigasjon: **Privat, Bedrift, Fjernhjelp, Tjenester, Priser, Kunnskap, Om oss, Kontakt.** Nettbutikk vises bare som hovedvalg dersom den fortsatt har en sentral kommersiell funksjon. Mobilmenyen skal være rask, tilgjengelig og enkel å forstå.

Header: logo, hovednavigasjon, telefon, «Få hjelp», «Start fjernhjelp». Landingssiden «Microsoft 365 Oslo» skal være lett å nå fra Bedrift-området og Tjenester.

---

## Sidearkitektur

Bygg eller klargjør følgende sider (alle under nyside-området):

**Kjerne:** Forside, Privat, Bedrift, Fjernhjelp, Verksted, Hjemmebesøk, Priser, Kontakt, Om PC-Gutta, Våre teknikere, Kundeuttalelser, Ofte stilte spørsmål, Artikler/kunnskapsbase, Personvern, Informasjonskapsler, Salgsbetingelser, Tilgjengelighetserklæring, HTML-sidekart.

**Tjenestesider privat:** PC-reparasjon, Treg PC, PC starter ikke, Virusfjerning, Fjerning av svindelprogrammer, Windows-hjelp, Outlook-hjelp, E-postproblemer, Wi-Fi og nettverksproblemer, Skriverhjelp, Oppgradering til SSD, Minneoppgradering, Sikkerhetskopiering, Gjenoppretting av data, Ny PC og oppsett, Overføring til ny PC, Opplæring, Fjernhjelp for privatpersoner, IT-sikkerhet for privatpersoner.

**Tjenestesider bedrift:** IT-support for bedrifter, Deltids IT-avdeling, **Microsoft 365 (→ landingssiden i Prioritet 1)**, Microsoft 365 Business Premium, Microsoft 365-sikkerhet, E-postsikkerhet, Backup for Microsoft 365, Enhetssikkerhet, PC-drift, Nettverk og Wi-Fi, IT-rådgivning, Fjernsupport, Onboarding og offboarding, Sikkerhetsgjennomgang.

Opprett kun sider med reelt, unikt og nyttig innhold. Ikke masseproduser tynne sider. Der innhold mangler: bygg malen, marker i innholdsoversikten.

---

## Forsiden

Skal umiddelbart besvare: Hva tilbyr PC-Gutta? Hvem hjelper dere? Hvor hjelper dere? Hvordan får kunden hjelp nå? Hvorfor stole på dere?

Hero-forslag — H1: «PC-hjelp når du trenger det». Undertekst: «Vi reparerer, sikrer og setter opp PC-er for privatpersoner og bedrifter. Få hjelp på verkstedet, hjemme hos deg eller via fjernsupport.» Primærknapp: «Få hjelp nå». Sekundærknapp: «Start fjernhjelp». Telefon klikkbar.

Deretter: (1) tre innganger Privat/Bedrift/Fjernhjelp, (2) vanlige problemer (treg PC, virus og svindel, PC starter ikke, Outlook og e-post, Wi-Fi, ny PC), (3) slik fungerer det, (4) verksted og geografisk dekning, (5) priser eller lenke til priser, (6) dokumenterbare tillitselementer, (7) ekte, sporbare kundeuttalelser (ellers utelat), (8) vanlige spørsmål, (9) artikler, (10) avsluttende CTA. Én H1.

---

## Lokal SEO

Bygg sterk lokal synlighet rundt faktisk serviceområde. Viktige områder: Lørenskog, **Oslo (prioritert — se /goal)**, Lillestrøm, Strømmen, Skedsmokorset, Rælingen, Nittedal, Jessheim, Ski, Bærum, Asker, Moss. Listen valideres mot faktisk leveringsområde før publisering (VERIFISER-listen).

Hver lokal side må: ha unikt innhold; beskrive faktisk service i området; forklare reise, verksted eller fjernhjelp; inneholde relevante tjenester; ha konkret CTA; lenke til nærliggende relevante tjenester; ALDRI late som PC-Gutta har kontor der det ikke finnes kontor; ikke bruke falske lokale adresser; ikke bare bytte stedsnavn i identiske tekster.

URL-mønster: `/pc-hjelp/lorenskog/`. Ikke opprett hundrevis av geografiske sider automatisk — kvalitet foran volum.

Opprett gjenbrukbar lokal sidemal med felter for: sted, faktisk leveringsmodell, reiseinformasjon, relevante tjenester, lokale referanser, FAQ, internlenker, metadata, schema.

NAP (Name, Address, Phone) skal være konsistent overalt. LocalBusiness-schema bare for faktiske lokasjoner.

Eksterne lokal-SEO-tiltak (dokumenteres i TODO-MANUELT.md, utføres av mennesker): Google Business Profile — legg til «Microsoft 365» som tjeneste og Oslo som serviceområde; Gule Sider-oppføring i kategorien Office 365/IT Oslo; NAP-konsistens på Proff, Facebook og øvrige kataloger.

---

## SEO-krav

### Teknisk SEO

Implementer: én selvrefererende canonical per indekserbar side (produksjons-URL, aktiveres ved lansering); korrekt robots.txt; XML sitemap-indeks (klargjort, ikke innsendt fra staging); unike title-tags; unike meta descriptions; korrekte HTTP-statuskoder; 301 redirects fra gamle URL-er (som plan — se Migrering); egendefinert 404-side; noindex på interne søkeresultater, konto, handlekurv og andre irrelevante sider; korrekt paginering; breadcrumbs; Open Graph; Twitter/X metadata; favicon og webmanifest; `lang="nb"`; semantisk headingstruktur; lesbare URL-er; automatisk lastmod der den er reell; bilde-sitemap dersom relevant.

Ikke bruk: meta keywords, keyword stuffing, skjult tekst, doorway pages, masseprodusert AI-innhold, villedende schema, FAQ-schema på innhold brukeren ikke kan se, Review-schema basert på egne påstander, identiske metadata på tvers av sider.

### Metadata

Sentral metadatafunksjon. Title-format: `Primært tema – verdi eller sted | PC-Gutta`. Naturlige titler, ikke tvunget lik lengde. Meta description: forklarer tjenesten, har relevant geografisk/kommersiell kontekst, naturlig handling, aldri identisk mellom sider.

### Internlenking

Bygg emneklynger. Eksempel: hovedside `/pc-hjelp/` med undersider treg PC, PC starter ikke, virus, Windows, Outlook, Wi-Fi, sikkerhetskopiering, ny PC — alle lenker naturlig tilbake til hovedsiden og relevante søstersider. Tilsvarende klynge for Microsoft 365: `/microsoft-365-oslo/` som hub med støtteartiklene og bedriftstjenestesidene rundt. Beskrivende ankertekst (f.eks. «Microsoft 365»), unngå gjentatt «les mer». Implementer breadcrumbs, relaterte tjenester, relaterte artikler, lokale lenker og kontekstuelle lenker i brødtekst.

---

## GEO, AEO og AI-søk

Optimaliser slik at ChatGPT, Gemini, Copilot, Perplexity m.fl. enkelt kan: identifisere virksomheten, forstå tjenestene, forstå geografisk dekning, hente korte faktiske svar, skille PC-Gutta fra konkurrenter, sitere siden korrekt. GEO er ikke tekniske triks — prioriter tydelig, dokumenterbar, maskinlesbar informasjon.

Hver viktig side skal ha: (1) direkte svar tidlig, (2) kort definisjon av tjenesten/problemet, (3) punktvise fakta der det hjelper, (4) hvem tjenesten passer for, (5) prosess, (6) pris eller prisprinsipp, (7) begrensninger og forbehold, (8) oppdatert-dato når innholdet faktisk er kontrollert, (9) navngitt faglig ansvarlig der relevant, (10) kilder for tekniske/sikkerhetsmessige påstander, (11) kort FAQ med ekte spørsmål, (12) entydige virksomhetsopplysninger.

Lag gjerne komponenter: DirectAnswer, KeyFacts, ServiceSummary, HowItWorks, PricingExplanation, ExpertReview, Sources, FrequentlyAskedQuestions, LastReviewed.

Unngå: generiske tekster, ubegrunnede superlativer, unattributerte statistikker, oppdiktede eksperter, unaturlig repetisjon av merkenavn, sider laget bare for å bli sitert av AI.

Vurder en offentlig maskinlesbar virksomhetsside (navn, merkevare, juridisk enhet, tjenester, adresse, telefon, e-post, serviceområde, offisielle profiler, sist oppdatert). Opprett llms.txt bare dersom den inneholder korrekt og vedlikeholdbar informasjon — aldri som erstatning for normal SEO.

---

## Strukturert data (hele nettstedet)

JSON-LD gjennom sentrale, typesikre komponenter. Bruk bare schema som samsvarer med synlig sideinnhold.

- **Globalt:** Organization, LocalBusiness eller ComputerStore (hvis typen faktisk passer), WebSite, WebPage, BreadcrumbList.
- **Tjenestesider:** Service; Offer bare der pris faktisk er publisert; FAQPage bare med synlig FAQ.
- **Artikler:** Article/BlogPosting, Person for ekte forfatter, Organization som publisher.
- **Kontaktside:** ContactPoint, PostalAddress, GeoCoordinates dersom verifisert.
- **Produkter:** Product, Offer; AggregateRating kun med legitim, teknisk korrekt vurderingsdata.

Stabile `@id`-referanser mellom virksomhet, nettside, side, forfatter og tjenester. Ikke ett enormt globalt schema-objekt som påstår at alle tjenester finnes på alle lokasjoner.

Automatiserte tester: nødvendige felter finnes, URL-er er absolutte, ingen tomme verdier, pris/lagerstatus ikke hardkodet feil, gyldig JSON.

---

## Innholdsstandard

Alt norsk innhold skal være: naturlig bokmål, skrevet for vanlige mennesker, presist, tydelig, uten overdreven markedssjargong, uten unaturlig søkeordbruk, uten AI-typiske formuleringer, faglig korrekt, handlingsorientert.

Forbudte formuleringer: «I dagens digitale verden», «skreddersydde løsninger for alle behov», «ta din digitale reise til neste nivå», «vi brenner for», «sømløs opplevelse», «revolusjonerende», «best i Norge».

Bruk konkrete formuleringer: hva problemet er, hva PC-Gutta gjør, hva kunden må gjøre, hva det kan koste, normal tidsbruk (bare med data), når kunden bør levere inn maskinen, når fjernhjelp er mulig, når fysisk reparasjon er nødvendig.

Ikke publiser medisinske, juridiske, økonomiske eller datasikkerhetsmessige garantier.

---

## Artikkel- og kunnskapsstrategi

Kunnskapsbase som prioriterer reelle kundespørsmål. Første to artikler = støtteartiklene i Prioritet 1 (migrering til Microsoft 365, Outlook-feil). Deretter klargjør innhold for:

Hvorfor er PC-en treg? Hva gjør jeg når PC-en ikke starter? Hvordan vet jeg om PC-en har virus? Hva er fjernhjelp, og er det trygt? Hva bør jeg gjøre før jeg leverer PC-en til reparasjon? SSD eller ny PC? Hvordan flytter jeg alt til en ny PC? Hvorfor synkroniserer ikke OneDrive? Hvorfor mottar jeg ikke e-post i Outlook? Hvordan unngår jeg falske Microsoft-varsler? Hva er forskjellen på antivirus og endepunktsbeskyttelse? Hvordan tar jeg sikkerhetskopi av PC-en? Hva koster PC-reparasjon? Kan en gammel PC oppgraderes til Windows 11? Hva bør en liten bedrift ha av IT-sikkerhet? Hva inneholder Microsoft 365 Business Premium?

Hver artikkel: tydelig søkeintensjon, direkte svar, faglig forklaring, praktiske trinn, faresignaler, når kunden kan løse det selv, når PC-Gutta bør kontaktes, relevante tjenester, kilder ved behov, forfatter/faglig kontroll, publisert- og gjennomgått-dato.

Ikke generer 300 artikler automatisk. Bygg en kvalitetsmal og et mindre antall sterke eksempelartikler.

---

## E-E-A-T og tillit

Bygg tillit gjennom dokumentasjon, ikke påstander. Implementer plass for: ekte ansatte med navn og roller, dokumentert erfaring, relevante sertifiseringer, ekte virksomhetsbilder, fysisk adresse, organisasjonsnummer, telefon og e-post, transparente priser, personvern, reparasjonsvilkår, informasjon om sikkerhetskopi og dataansvar, tydelig klage- og kontaktmulighet, ekte samarbeid og sponsorater, redaksjonelle retningslinjer, innholdskorrigeringer.

Lag en tydelig side om hvordan PC-Gutta håndterer kundedata og tilgang ved fjernhjelp. Ikke vis partnerlogoer uten tillatelse.

---

## Konvertering og brukerflyt

**Privatkunde:** velger problemet → ser om fjernhjelp er mulig → ser prisprinsipp → kan ringe, bestille eller starte fjernhjelp → tydelig neste steg.

**Bedriftskunde:** identifiserer tjenesten → forstår hvem den passer for → ser leveransemodell og sikkerhetsnivå → kan be om vurdering eller tilbud → henvendelsen har nødvendige kvalifiseringsfelter.

**Skjemaer (korte):**
- Privat: navn, telefon eller e-post, problembeskrivelse, ønsket hjelpemåte, samtykke der det kreves.
- Bedrift: navn, virksomhet, e-post, telefon, antall brukere (valgfritt), behov, ønsket kontaktmåte.

Implementer: server-side validering, spamvern, rate limiting, tilgjengelige feilmeldinger, sikker databehandling, tydelig bekreftelsesside, hendelsessporing uten sensitiv tekst til analyseverktøy. Ikke krev konto for enkel henvendelse.

---

## Ytelse

Mål på representative mobilmålinger: LCP < 2,5 s, INP < 200 ms, CLS < 0,1, Lighthouse Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95. Mål — ikke tillatelse til å manipulere målingene.

Optimaliser: bilder, fonter, CSS, JavaScript, tredjepartsskript, caching, rendering, kritiske ressurser, responsive bilder, lazy loading under folden, databasekall, serverrespons. Ikke lazy-load hero-bildet dersom det er LCP-elementet. Unngå autoplay-video.

---

## Tilgjengelighet

Mål: WCAG 2.2 nivå AA. Krav: full tastaturnavigasjon, synlig fokus, skip-link, korrekt label på skjemaer, gode feilmeldinger, logisk tab-rekkefølge, semantiske landmarks, korrekt kontrast, alt-tekst for informative bilder, tom alt for dekorative, ingen kritisk informasjon kun gjennom farge, støtte for redusert bevegelse, tilstrekkelige trykkflater på mobil, korrekt dialog- og menyfokus, forståelige lenketekster.

---

## Sikkerhet og personvern

Implementer eller kontroller: CSP, HSTS, Referrer-Policy, Permissions-Policy, X-Content-Type-Options, sikker cookie-håndtering, CSRF-beskyttelse, XSS-beskyttelse gjennom korrekt escaping, inputvalidering, rate limiting, spamvern, sikre redirects, oppdaterte avhengigheter, ingen eksponerte hemmeligheter, minst mulig persondata, loggrutiner uten sensitiv informasjon.

Kontaktskjema/supportsystem må ikke sende problemtekst, e-post, telefonnummer eller andre personopplysninger til analyseplattformer. Cookiebanner skal ikke laste ikke-nødvendig tracking før gyldig samtykke.

---

## Analyse og måling

Bevar eksisterende tracking der den er legitim; dokumenter alt. Hendelser: klikk på telefon, klikk på e-post, start fjernhjelp, åpnet kontaktskjema, sendt kontaktskjema, klikk på veibeskrivelse, klikk på privat, klikk på bedrift, produktkjøp, fullført bestilling. Tydelige hendelsesnavn.

Ikke registrer: problemtekst, navn, e-postadresse, telefonnummer, fjernhjelps-ID eller annen sensitiv informasjon. Dokumentasjon: `docs/analytics-events.md`.

---

## Migrering og lansering (fra staging til produksjon)

Kritisk del. Testinstansen bygges nå — lanseringen er en senere, manuelt godkjent operasjon. Forbered alt:

1. Eksporter alle eksisterende URL-er på pcgutta.no.
2. Finn URL-er med organisk trafikk og eksterne lenker (Search Console-data hvis tilgjengelig — ellers noter i VERIFISER-listen).
3. Behold gode URL-er. Opprett én-til-én 301 redirects der URL-er endres.
4. Ikke redirect alt til forsiden. Ikke la viktige sider bli 404.
5. Behold produkt-, ordre- og kundedata og nødvendige integrasjoner.
6. Kontroller canonical, sitemap og robots etter migrering. Fjern noindex fra nyside-innholdet KUN ved produksjonssetting.
7. Redirect-kart i `docs/redirect-map.csv` med kolonner: `old_url,new_url,status_code,reason,verified`.
8. Domenekanonisering pcgutta.no vs pc-gutta.no vs www: påpek og anbefal i TODO-MANUELT.md — ikke fiks.

---

## Tester og automatisert kvalitet

Automatiserte tester for: alle hovedsider returnerer 200; ingen interne bruddlenker; én H1 per standardside; unik title på indekserbare sider; canonical finnes; noindex-sider ikke i sitemap; sitemap-URL-er returnerer 200; JSON-LD kan parses; skjemaer valideres; menyer fungerer med tastatur; ingen alvorlige axe-feil; telefon- og e-postlenker er riktige; prioriterte gamle URL-er redirecter korrekt (i lanseringsplanen); produktsider har korrekte produktdata; miljøvariabler valideres ved oppstart.

Lag kontrollkommando, f.eks. `npm run quality`, som kjører relevante tester, lint og typecheck.

---

## Leveranser

Oppgaven er ikke ferdig før følgende er levert:

1. Produksjonsklar kode under staging.pcgutta.no/nyside.
2. **Landingssiden `/microsoft-365-oslo/` med JSON-LD og to støtteartikler (Prioritet 1).**
3. Responsivt design, full navigasjon og footer.
4. Implementerte kjernesider.
5. Gjenbrukbare tjenestemaler, lokal sidemal og artikkelmal.
6. SEO-komponenter og JSON-LD-komponenter.
7. Sitemap (klargjort) og robots.txt (staging-blokkert).
8. Redirect-plan og skjemaer.
9. Analysehendelser og tester.
10. Dokumentasjon: `README.md`, `docs/current-site-audit.md`, `docs/architecture.md`, `docs/content-model.md`, `docs/seo.md`, `docs/schema.md`, `docs/analytics-events.md`, `docs/redirect-map.csv`, `docs/launch-checklist.md`.
11. `TODO-MANUELT.md`: alt som krever endring i eksisterende sider/systemer, minimum — legge Microsoft 365-siden i hovedmeny/footer (ankertekst «Microsoft 365»); lenke fra forsiden og /bedrifter/; sitemap + Google Search Console-innsending ved lansering; Google Business Profile («Microsoft 365» som tjeneste, Oslo som serviceområde); Gule Sider-oppføring (Office 365/IT Oslo); domenekanonisering pcgutta.no/pc-gutta.no.
12. `docs/VERIFISER-FOR-LANSERING.md`: all informasjon virksomheten må verifisere (org.nr.-konflikten, priser, åpningstider, serviceområde, bilder, sertifiseringer, ansatte).
13. Innholdsoversikt med manglende innhold markert.
14. Lanseringssjekkliste.

---

## Lanseringssjekkliste (dokumenteres, utføres ved godkjent lansering)

Produksjonsdomene, HTTPS, www/non-www, redirects, canonical, robots.txt, sitemap, Search Console, Bing Webmaster Tools, analyse, cookie consent, skjema, e-postlevering, betaling, fjernhjelpslenke, innlogging, 404, mobilvisning, nettbrett, tastaturnavigasjon, schema, ytelse, cache, sikkerhetsheadere, backup, rollback-plan, databasebackup, WooCommerce-funksjoner, juridiske sider, kontaktopplysninger, priser, åpningstider — **og fjerning av noindex/staging-sperrer på nyside-innholdet.**

Ikke sett nettstedet i produksjon automatisk uten eksplisitt godkjenning.

---

## Prioritering

**Prioritet 1:** ingen påvirkning på eksisterende funksjoner eller SEO-verdi; **landingssiden Microsoft 365 Oslo med klynge (hovedmålet)**; fungerende konverteringer; mobilopplevelse; hastighet; sikkerhet; korrekt teknisk SEO; privat-, bedrift- og fjernhjelpssidene.

**Prioritet 2:** øvrige tjenestesider, lokal SEO-sider, schema på alt, kunnskapsbase, tillitssider, analyse.

**Prioritet 3:** utvidet innholdsproduksjon, flere lokale sider, avanserte kalkulatorer, personalisering, eksperimenter.

Ikke prioriter dekorative detaljer foran funksjon, hastighet og konvertering.

---

## Arbeidsregler

- Gjør først grundig inspeksjon av eksisterende kode. Gjenbruk gode deler, refaktorer dårlige — men bare innenfor nyside-området.
- Ikke slett fungerende funksjonalitet. Ikke bruk lorem ipsum i ferdige sider. Ikke dikt opp informasjon. Ikke hardkod gjentatte virksomhetsdata.
- Ikke stopp etter å ha laget en plan. Implementer så mye som mulig. Kjør tester etter vesentlige endringer. Rett egne feil. Dokumenter beslutninger og avvik.
- Bruk TODO bare når informasjon eller tilgang faktisk mangler, og hvert TODO skal beskrive nøyaktig hva virksomheten må levere.
- Hold kode, innhold og komponenter enkle å vedlikeholde. Gi redaktøren kontroll over innhold uten at tekniske SEO-regler enkelt kan ødelegges.
- **Ikke still spørsmål underveis. Alt gjøres ferdig først; uavklarte punkter samles i TODO-MANUELT.md og docs/VERIFISER-FOR-LANSERING.md og presenteres i sluttrapporten.**

---

## Sluttrapport

Når implementeringen er ferdig, lever en konsis rapport med:

1. Hva som ble analysert.
2. Hva som ble bygget.
3. Hva som ble endret (skal være: kun nye filer under nyside).
4. Hvilke eksisterende funksjoner som ble bevart.
5. Hvilke URL-er som er planlagt endret ved lansering.
6. Hvilke tester som ble kjørt, og resultatene.
7. Kjente begrensninger.
8. Informasjon som fortsatt må verifiseres (inkl. org.nr.-konflikten).
9. Søkeord-plassering for hovedmålet: hvor «Office 365», «Microsoft 365» og «Oslo» ble brukt på landingssiden.
10. Nøyaktige steg for lokal oppstart, staging og produksjonssetting, med rollback-prosedyre.
11. De ti viktigste SEO-tiltakene som nå er implementert.
12. De ti neste anbefalte tiltakene — med de 3 viktigste manuelle oppgavene fra TODO-MANUELT.md i prioritert rekkefølge øverst.

**Start nå med å undersøke hele repoet og den eksisterende arkitekturen. Opprett revisjonsrapporten og fortsett direkte med implementeringen. Alt bygges under staging.pcgutta.no/nyside. Gjør alt ferdig før du spør om noe som helst.**
