#!/usr/bin/env python3
"""
Verifiser at F/D-grade domener i siste snapshot er TRYGGE å bruke i pressemelding.

Hovedrisiko ved naming-and-shaming: domenet er F-grade fordi det IKKE brukes til
e-post (ingen MX) — da er mangelen kun teoretisk og ikke et reelt phishing-problem.
Hvis vi sier "Equinor er åpen for spoofing" og Equinor svarer "vi bruker
equinor.com, ikke equinor.no", er vi i PR-trøbbel.

Skriptet sjekker for hvert kandidat-domene:
  1. MX-record finnes (sender/mottar e-post fra domenet)
  2. DMARC-record live (bekrefter snapshot)
  3. SPF-record live (bekrefter snapshot)
  4. Alternativt e-post-domene (.com / kort-form) som kanskje brukes i stedet

Output: _data/press-verification-YYYY-MM-DD.md med klar VERIFIED/SKIP-status.
"""
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).parent.parent
SNAPSHOTS_DIR = ROOT / '_data' / 'snapshots'
OUT_DIR = ROOT / '_data'

DOH = 'https://cloudflare-dns.com/dns-query'


def dns_query(name: str, qtype: str) -> dict:
    url = f'{DOH}?name={urllib.parse.quote(name)}&type={qtype}'
    req = urllib.request.Request(url, headers={'Accept': 'application/dns-json'})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read())
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
        return {'error': str(e)}


def clean_txt(s: str) -> str:
    return s.replace('"', '').strip()


def get_mx(domain: str) -> list[str]:
    r = dns_query(domain, 'MX')
    if 'error' in r or r.get('Status') != 0:
        return []
    answers = r.get('Answer', [])
    targets = []
    for a in answers:
        data = a.get('data', '').strip()
        if not data:
            continue
        # Format: "10 mx.example.com."
        parts = data.split()
        target = parts[-1].rstrip('.')
        # MX "." means explicitly no mail
        if target == '' or target == '.':
            continue
        targets.append(target)
    return targets


def get_txt_with_prefix(domain: str, prefix: str) -> str | None:
    r = dns_query(domain, 'TXT')
    if 'error' in r or r.get('Status') != 0:
        return None
    for a in r.get('Answer', []):
        data = clean_txt(a.get('data', ''))
        if data.lower().startswith(prefix.lower()):
            return data
    return None


def alt_domain_candidates(domain: str) -> list[str]:
    """Foreslå sannsynlige alternative e-post-domener."""
    base = domain.split('.')[0]
    alts = []
    if domain.endswith('.no'):
        alts.append(base + '.com')
        # Strip "sparebanken-", "aker-" prefixes
        for prefix in ('sparebanken-', 'aker-'):
            if base.startswith(prefix):
                alts.append(base[len(prefix):] + '.no')
                alts.append(base[len(prefix):] + '.com')
    if '-' in base:
        alts.append(base.replace('-', '') + '.no')
        alts.append(base.replace('-', '') + '.com')
    return alts


def verify_domain(domain: str, snapshot_result: dict) -> dict:
    mx_targets = get_mx(domain)
    has_mx = len(mx_targets) > 0
    dmarc_live = get_txt_with_prefix(f'_dmarc.{domain}', 'v=DMARC1')
    spf_live = get_txt_with_prefix(domain, 'v=spf1')

    # Kryssjekk mot snapshot
    snap_dmarc = snapshot_result['checks']['dmarc']
    snap_spf = snapshot_result['checks']['spf']
    dmarc_match = (dmarc_live is not None) == snap_dmarc.get('present', False)
    spf_match = (spf_live is not None) == snap_spf.get('present', False)

    # Alternativ-domene-sjekk
    alts_with_email = []
    if not has_mx:
        for alt in alt_domain_candidates(domain):
            alt_mx = get_mx(alt)
            if alt_mx:
                alts_with_email.append((alt, alt_mx[0]))

    # Verdict for press
    if not has_mx and not alts_with_email:
        verdict = 'SKIP'
        reason = 'Ingen MX-records — domenet sender/mottar ikke e-post. F-grade er teknisk korrekt men ikke et reelt phishing-problem.'
    elif not has_mx and alts_with_email:
        verdict = 'SKIP'
        alt_str = ', '.join(f'{a} (mx: {m})' for a, m in alts_with_email)
        reason = f'Bruker sannsynligvis alternativt domene: {alt_str}. Sjekk det i stedet — eller bruk en formulering som ikke impliserer at de er sårbare.'
    elif not dmarc_match or not spf_match:
        verdict = 'RECHECK'
        reason = f'Snapshot stemmer ikke med live DNS. Snapshot DMARC={snap_dmarc.get("present")}, live={dmarc_live is not None}. Snapshot SPF={snap_spf.get("present")}, live={spf_live is not None}.'
    else:
        verdict = 'VERIFIED'
        reason = f'MX: {mx_targets[0]} | Real e-post-domene + DMARC-mangel bekreftet live.'

    return {
        'domain': domain,
        'grade': snapshot_result['grade'],
        'score': snapshot_result['score'],
        'has_mx': has_mx,
        'mx_targets': mx_targets[:2],
        'dmarc_live': dmarc_live[:100] + '…' if dmarc_live and len(dmarc_live) > 100 else dmarc_live,
        'spf_live': spf_live[:100] + '…' if spf_live and len(spf_live) > 100 else spf_live,
        'snap_dmarc_present': snap_dmarc.get('present', False),
        'snap_dmarc_policy': snap_dmarc.get('policy'),
        'alts_with_email': alts_with_email,
        'verdict': verdict,
        'reason': reason,
    }


def render_report(verifications: list[dict], today: str) -> str:
    lines = []
    lines.append(f'# Pressemelding-verifikasjon — {today}')
    lines.append('')
    lines.append('Hver F- og D-grade-claim verifisert mot live DNS via Cloudflare DoH.')
    lines.append('')
    lines.append('## Status-koder')
    lines.append('')
    lines.append('- ✅ **VERIFIED** — Trygt å nevne. MX-records finnes, DMARC-mangel bekreftet live.')
    lines.append('- ⚠️ **RECHECK** — Snapshot stemmer ikke med live DNS. Sjekk manuelt før bruk.')
    lines.append('- ❌ **SKIP** — Ikke trygt å bruke i press. Enten ingen e-post-trafikk eller alternativt hoveddomene.')
    lines.append('')

    by_verdict = {'VERIFIED': [], 'RECHECK': [], 'SKIP': []}
    for v in verifications:
        by_verdict[v['verdict']].append(v)

    for vkey, icon in [('VERIFIED', '✅'), ('RECHECK', '⚠️'), ('SKIP', '❌')]:
        items = by_verdict[vkey]
        lines.append(f'## {icon} {vkey} ({len(items)})')
        lines.append('')
        if not items:
            lines.append('_Ingen._')
            lines.append('')
            continue
        lines.append('| Domene | Karakter | MX | DMARC-policy live | Kommentar |')
        lines.append('|---|---|---|---|---|')
        for v in items:
            mx_str = v['mx_targets'][0] if v['mx_targets'] else '_ingen_'
            policy_live = '—'
            if v['dmarc_live']:
                import re
                m = re.search(r'p=([a-z]+)', v['dmarc_live'], re.I)
                if m:
                    policy_live = f'p={m.group(1).lower()}'
                else:
                    policy_live = 'finnes'
            elif v['snap_dmarc_present']:
                policy_live = '(snapshot ja, live nei)'
            else:
                policy_live = '_mangler_'
            lines.append(f'| `{v["domain"]}` | {v["grade"]} | {mx_str} | {policy_live} | {v["reason"]} |')
        lines.append('')

    lines.append('## Råverifikasjons-data')
    lines.append('')
    lines.append('```json')
    lines.append(json.dumps(verifications, ensure_ascii=False, indent=2))
    lines.append('```')

    return '\n'.join(lines)


def main():
    files = sorted(SNAPSHOTS_DIR.glob('*.json'))
    if not files:
        sys.exit('Ingen snapshots funnet.')
    snap = json.loads(files[-1].read_text(encoding='utf-8'))
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')

    targets = [r for r in snap['results'] if r['grade'] in ('F', 'D')]
    print(f'Verifiserer {len(targets)} F- og D-grade domener mot live DNS...', flush=True)

    verifications = []
    for i, r in enumerate(targets, 1):
        v = verify_domain(r['domain'], r)
        verifications.append(v)
        icon = {'VERIFIED': '✅', 'RECHECK': '⚠️', 'SKIP': '❌'}[v['verdict']]
        print(f'  [{i}/{len(targets)}] {icon} {r["domain"]:<30} {v["verdict"]}', flush=True)

    report = render_report(verifications, today)
    out = OUT_DIR / f'press-verification-{today}.md'
    out.write_text(report, encoding='utf-8')
    print(f'\nRapport skrevet til: {out}')

    n_verified = sum(1 for v in verifications if v['verdict'] == 'VERIFIED')
    n_skip = sum(1 for v in verifications if v['verdict'] == 'SKIP')
    n_recheck = sum(1 for v in verifications if v['verdict'] == 'RECHECK')
    print(f'VERIFIED: {n_verified}, RECHECK: {n_recheck}, SKIP: {n_skip}')


if __name__ == '__main__':
    main()
