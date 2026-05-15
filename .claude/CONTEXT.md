# Deploy-oppdrag for Claude Code – data1.no Norge-fokus GEO-pakke

> **Bakgrunn:** Denne pakken er resultatet av en GEO-strategiøkt i Claude Chat 14. mai 2026. Målet er å maksimere data1.no sin synlighet i AI-baserte søkesvar (ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews), med eksklusivt norsk fokus.
>
> **Ferdig før du starter:**
> - ✅ Cloudflare "Managed robots.txt" er disablet i dashbordet (manuelt)
> - ✅ "Block AI training bots" satt til "Do not block (allow crawlers)"
> - ✅ Egen robots.txt allerede deployet (men trenger oppgradering, se under)

## Filer i denne pakken (alle ligger i samme katalog)

| Fil | Skal til | Beskrivelse |
|---|---|---|
| `CONTEXT.md` | `.claude/CONTEXT.md` | Prosjektkontekst, sannhetskilde |
| `robots.txt` | `/public/robots.txt` | Oppgradert med Content-Signal og flere botter |
| `llms.txt` | `/public/llms.txt` | AI-modell-vennlig sitemap, Norge-eksklusivt |
| `data1-norge-fokus-schema.html` | Plukk JSON-LD ut og legg i `/app/layout.tsx` | Globale schemas |
| `dmarc-schema-jsonld.html` | Plukk JSON-LD ut og legg i `/app/blogg/[slug]/page.tsx` (dynamisk per artikkel) | Article + HowTo + FAQPage |
| `dmarc-artikkel-geo-optimalisert.md` | Erstatte innholdet i `/blogg/dmarc` (MDX eller hvor det enn ligger) | Omskrevet artikkel med TL;DR og svar-først |

## Deploy-oppgaver i prioritert rekkefølge

### Oppgave 1 – Legg CONTEXT.md i repoet
```bash
mkdir -p .claude
cp CONTEXT.md .claude/CONTEXT.md
```
Sjekk `.claude/settings.json` – legg til `"instructions": "Les .claude/CONTEXT.md først"` hvis det ikke står der.

### Oppgave 2 – Erstatt /public/robots.txt
Den nåværende robots.txt har bare Allow-regler. Den nye legger til:
- `Content-Signal: search=yes, ai-input=yes, ai-train=yes` (eksplisitt juridisk samtykke under EU 2019/790)
- `Disallow: /cdn-cgi/` (hindrer indeksering av Cloudflare email-obfuscation)
- 5+ flere AI-crawlere (Claude-User, Claude-SearchBot, GoogleOther, FacebookBot, m.fl.)

### Oppgave 3 – Deploy /public/llms.txt
Eksisterer trolig ikke ennå. Verifiser at filen serveres som text/plain etter deploy.

### Oppgave 4 – Globale JSON-LD-schemas i layout.tsx
Fra `data1-norge-fokus-schema.html`, plukk ut:
- Organization JSON-LD (blokk 2)
- WebSite JSON-LD (blokk 3)
- SoftwareApplication JSON-LD (blokk 4 — kun på forsiden, så i `app/page.tsx` ikke layout)

**Konverter til Next.js-form:**
```tsx
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const organizationSchema = { /* JSON fra filen */ };
  const websiteSchema = { /* JSON fra filen */ };
  
  return (
    <html lang="nb-NO">
      <head>
        <meta name="geo.region" content="NO" />
        <meta name="geo.placename" content="Norge" />
        <meta httpEquiv="content-language" content="nb-NO" />
        <link rel="alternate" hrefLang="nb-NO" href="https://data1.no/" />
        <link rel="alternate" hrefLang="x-default" href="https://data1.no/" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**VIKTIG:** Fjern `aggregateRating`-blokken fra SoftwareApplication-schema med mindre dere har reelle anmeldelser. Falske ratings straffes av Google.

### Oppgave 5 – Per-artikkel JSON-LD i blogg-template
Fra `dmarc-schema-jsonld.html`, lag en generisk komponent som tar artikkel-metadata som input:

```tsx
// components/schema/ArticleSchema.tsx
type Props = {
  title: string;
  description: string;
  slug: string;
  datePublished: string;
  dateModified: string;
  author: { name: string; role: string; linkedin: string };
  about: string[];
  wordCount: number;
};
```

Schema som skal genereres per artikkel: Article + HowTo (hvis steg finnes) + FAQPage (hvis FAQ-blokk).

Bruk `contentLocation`, `spatialCoverage` og `audience.geographicArea` = Norge på alle Article-schemas.

### Oppgave 6 – Refaktorer /blogg/dmarc/
Erstatt eksisterende innhold med `dmarc-artikkel-geo-optimalisert.md`. Nøkkelelementer:
- TL;DR-boks øverst (5 punkter)
- Alle H2 åpner med 40–60 ords direkte svar i fet skrift
- Forfatter = Terje Otterlei med credentials
- Ferske data fra 14. mai 2026
- Ny FAQ-blokk med 8 spørsmål
- Tabell over policy-nivåer

### Oppgave 7 – Verifiser Norge-only filter i skanner
Sjekk `/app/api/sjekk/route.ts` (eller hva enn API-routen heter):
```ts
if (!domain.toLowerCase().endsWith('.no')) {
  return NextResponse.json(
    { error: 'data1.no analyserer kun .no-domener' },
    { status: 400 }
  );
}
```
Hvis dette ikke finnes, legg det til.

### Oppgave 8 – Opprett PR (ikke merge)
- Branch-navn: `feat/norge-fokus-geo-pakke`
- PR-tittel: "GEO-optimaliseringer: Norge-fokus, JSON-LD, ny robots.txt og llms.txt"
- Beskrivelse: oppsummer hva som ble endret + lenke til Rich Results Test for verifisering
- Ikke merge – la Terje gjennomgå

## Verifisering etter deploy

1. **Google Rich Results Test:** https://search.google.com/test/rich-results lim inn `https://data1.no/blogg/dmarc/` – skal vise grønn for Article, HowTo, FAQPage
2. **Schema.org validator:** https://validator.schema.org/ – samme URL
3. **Incognito:** `https://data1.no/llms.txt` skal vise innholdet
4. **View source forsiden:** `<html lang="nb-NO">`, ikke `lang="en"`
5. **Testkall API:** `curl -X POST https://data1.no/api/sjekk -d '{"domain":"example.com"}'` skal returnere 400 med norsk feilmelding

## Kontekst (kortversjon)

- Eier: Micronet AS (org.nr. 990 661 766), Lørenskog
- Utvikler: Terje Otterlei
- GitHub: xboxoslo
- Stack: Next.js App Router + Tailwind + Vercel
- DNS: Cloudflare
- Norge eksklusivt – kun nb-NO, kun .no-domener, målgruppe norske bedrifter/kommuner/banker
