"""
Auto-update sitemap.xml — sørger for at alle HTML-sider er listet og at lastmod stemmer.
Kjøres etter daglig scan så /trender/ alltid har dagens dato.
"""
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).parent.parent
SITEMAP = ROOT / 'sitemap.xml'

today = datetime.now(timezone.utc).strftime('%Y-%m-%d')

# Sider som skal alltid finnes i sitemap (path -> priority)
PAGES = {
    '/': 1.0,
    '/om/': 0.7,
    '/trender/': 0.95,
    '/sammenligning/': 0.85,
    '/ordbok/': 0.85,
    '/sertifikat/': 0.6,
    '/blogg/': 0.7,
    '/blogg/dmarc/': 0.85,
    '/blogg/spf/': 0.8,
    '/blogg/dkim/': 0.8,
    '/blogg/dmarc-microsoft-365/': 0.85,
    '/blogg/dmarc-google-workspace/': 0.85,
    '/blogg/spf-microsoft-365/': 0.85,
    '/verktoy/dmarc-generator/': 0.9,
    '/verktoy/spf-generator/': 0.9,
    '/rapport-2026/': 0.9,
    '/rapport-2026/banker/': 0.85,
    '/rapport-2026/kommuner/': 0.85,
    '/rapport-2026/e-handel/': 0.85,
    '/rapport-2026/medier/': 0.85,
    '/case/': 0.7,
    '/feil/': 0.8,
}


def lastmod_for(path: str) -> str:
    """Bruk filsystemets mtime, eller dagens dato hvis filen ikke finnes."""
    if path == '/':
        f = ROOT / 'index.html'
    else:
        f = ROOT / path.strip('/') / 'index.html'
    if f.exists():
        ts = f.stat().st_mtime
        return datetime.fromtimestamp(ts, timezone.utc).strftime('%Y-%m-%d')
    return today


def discover_blog_posts() -> dict[str, float]:
    """Finn alle blogposter under /blogg/ som har en index.html."""
    out = {}
    blog_dir = ROOT / 'blogg'
    if not blog_dir.exists():
        return out
    for sub in sorted(blog_dir.iterdir()):
        if sub.is_dir() and (sub / 'index.html').exists():
            out[f'/blogg/{sub.name}/'] = 0.8
    return out


def discover_error_pages() -> dict[str, float]:
    """Finn alle /feil/*-undersider med index.html."""
    out = {}
    feil_dir = ROOT / 'feil'
    if not feil_dir.exists():
        return out
    for sub in sorted(feil_dir.iterdir()):
        if sub.is_dir() and (sub / 'index.html').exists():
            out[f'/feil/{sub.name}/'] = 0.75
    return out


def discover_domain_check_pages() -> dict[str, float]:
    """Finn alle /sjekk/{domain}/-sider generert av generate_domain_pages.py."""
    out = {}
    sjekk_dir = ROOT / 'sjekk'
    if not sjekk_dir.exists():
        return out
    if (sjekk_dir / 'index.html').exists():
        out['/sjekk/'] = 0.85
    for sub in sorted(sjekk_dir.iterdir()):
        if sub.is_dir() and (sub / 'index.html').exists():
            out[f'/sjekk/{sub.name}/'] = 0.7
    return out


# Top-level dirs to scan for index.html (priority per dir).
# Includes service landing pages (/spf/, /dmarc/ etc) and cornerstone articles.
TOP_LEVEL_SCAN = {
    'spf': 0.85,
    'dkim': 0.85,
    'dmarc': 0.85,
    'mta-sts': 0.8,
    'tls-rpt': 0.8,
    'e-post-sikkerhet': 0.9,
}


def discover_top_level_pages() -> dict[str, float]:
    """Top-level service/cornerstone pages with their own index.html."""
    out = {}
    for name, prio in TOP_LEVEL_SCAN.items():
        if (ROOT / name / 'index.html').exists():
            out[f'/{name}/'] = prio
    return out


def discover_sammenligning_subpages() -> dict[str, float]:
    """Alle /sammenligning/data1-vs-*/-sider."""
    out = {}
    samm_dir = ROOT / 'sammenligning'
    if not samm_dir.exists():
        return out
    for sub in sorted(samm_dir.iterdir()):
        if sub.is_dir() and (sub / 'index.html').exists():
            out[f'/sammenligning/{sub.name}/'] = 0.8
    return out


def main():
    # Slå sammen statiske + auto-oppdagete sider
    all_pages = dict(PAGES)
    for path, prio in discover_blog_posts().items():
        if path not in all_pages:
            all_pages[path] = prio
    for path, prio in discover_error_pages().items():
        if path not in all_pages:
            all_pages[path] = prio
    for path, prio in discover_domain_check_pages().items():
        if path not in all_pages:
            all_pages[path] = prio
    for path, prio in discover_top_level_pages().items():
        if path not in all_pages:
            all_pages[path] = prio
    for path, prio in discover_sammenligning_subpages().items():
        if path not in all_pages:
            all_pages[path] = prio

    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for path, prio in all_pages.items():
        url = f'https://data1.no{path}'
        lm = lastmod_for(path)
        # Trender-siden oppdateres daglig
        if path == '/trender/':
            lm = today
            freq = 'daily'
        elif 'rapport' in path:
            freq = 'weekly'
        elif 'blogg' in path or 'verktoy' in path:
            freq = 'monthly'
        else:
            freq = 'monthly'
        lines.append(f'  <url>')
        lines.append(f'    <loc>{url}</loc>')
        lines.append(f'    <lastmod>{lm}</lastmod>')
        lines.append(f'    <changefreq>{freq}</changefreq>')
        lines.append(f'    <priority>{prio}</priority>')
        lines.append(f'  </url>')
    lines.append('</urlset>')

    SITEMAP.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f'Sitemap oppdatert: {len(all_pages)} URL-er, lastmod for /trender/ = {today}')


if __name__ == '__main__':
    main()
