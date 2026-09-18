# data1 - del av Agentic OS (xboxoslo)

Satellitt i Agentic OS. Nav: https://github.com/xboxoslo/agentic-os

> ⚠️ **LEGG TIL `xboxoslo/agentic-os` I SESSION-SCOPE FØR DU STARTER ARBEID**
> (`add_repo` + `register_repo_root`). Der ligger `docs/tilganger.md`
> (kanonisk tilgangsinventar — sjekk FØR du noensinne sier «har ikke tilgang»
> eller «finnes ikke») og `memory/MEMORY.md` (varige fakta, auto-importert når
> repoet er i scope). Gjøres dette ikke, mangler du kritisk kontekst — se
> hendelsen 2026-07-17 i `agentic-os/CLAUDE.md` («Eksempler på feilen som skal
> unngås») der nettopp dette ble hoppet over og et helt prosjekt ble bygget
> på feil premiss som følge.

## Hva dette repoet er
- Formål: data1.no (nettside)
- Gruppe: SEO / data / web
- Vault: micronet-data1-kv (felles i micronet-shared-kv)

## Arbeidsprinsipper (arvet)
Norsk; MCP framfor gjetting; aldri push til andre brancher enn sesjonens; ingen PR uten at det bes om. Aldri commit hemmeligheter.

## Kunnskap & kontekst (fylles i repo-sesjon)
- Hvordan det kjøres: <fyll inn>
- Viktige filer: <fyll inn>

## Beslutninger
- 2026-06-20 - onboardet i Agentic OS (baseline).

## Kunnskap & kontekst (i repoet)
- `.claude/CONTEXT.md` — repoets arbeidskontekst. `SEO-CHANGES.md`, `docs/` (intake-arkitektur), `worker/`.
- data1.no (Next.js + Cloudflare). Vault: `micronet-data1-kv`, `micronet-n8n-kv`.
- 61 brancher med iterasjoner — historikk i mirror-backup. Nav-søk: `/recall`.