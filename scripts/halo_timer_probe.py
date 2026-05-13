"""Finn 'Public note' outcome_id og verifiser agent-oppslag på e-post.

Kjøres lokalt med intake-secrets.env tilgjengelig.
Bruker eksisterende client_credentials (samme som intake-server.py).

Output:
  - Liste over alle Outcomes med id + name + flagg (vi vil ha 'Public Note' / 'Note' / lignende)
  - Test-oppslag av en tekniker via /api/Agent?search=<email>
  - Eksempel-call: hent åpne tickets for den agenten
"""
import json, os, sys, urllib.parse, urllib.request
from pathlib import Path

env_path = Path(__file__).parent.parent / 'intake-secrets.env'
if not env_path.exists():
    print(f'FEIL: {env_path} finnes ikke. Kopier intake-secrets.env.example og fyll inn.')
    sys.exit(1)

for line in env_path.read_text(encoding='utf-8').splitlines():
    line = line.strip()
    if line and '=' in line and not line.startswith('#'):
        k, v = line.split('=', 1)
        os.environ[k.strip()] = v.strip().strip('"').strip("'")

BASE = 'https://service.micronet.no'

def auth():
    req = urllib.request.Request(f'{BASE}/auth/token',
        data=urllib.parse.urlencode({
            'grant_type':    'client_credentials',
            'client_id':     os.environ['HALO_CLIENT_ID'],
            'client_secret': os.environ['HALO_CLIENT_SECRET'],
            'scope':         'all',
        }).encode(),
        headers={'Content-Type': 'application/x-www-form-urlencoded'}, method='POST')
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())['access_token']

def api_get(token, path):
    req = urllib.request.Request(f'{BASE}/api{path}',
                                  headers={'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def items_of(data, *keys):
    if isinstance(data, list):
        return data
    for k in keys:
        v = data.get(k)
        if isinstance(v, list):
            return v
    return [data] if isinstance(data, dict) else []


token = auth()
print(f'[ok] Halo-token ({len(token)} tegn)\n')

print('=== 1. Outcomes (leter etter "Public note" / "Note") ===')
try:
    data = api_get(token, '/Outcome')
    outcomes = items_of(data, 'outcomes', 'value')
    print(f'  {len(outcomes)} outcomes funnet:')
    candidates = []
    for o in outcomes:
        if not isinstance(o, dict):
            continue
        oid = o.get('id')
        name = o.get('name') or o.get('description') or '?'
        is_public = o.get('ispublic') or o.get('isPublic')
        is_note = 'note' in name.lower() or 'notat' in name.lower()
        marker = '  ⭐' if (is_public and is_note) else ('  *note' if is_note else '')
        print(f'  id={oid:<5}  public={str(is_public):<5}  {name}{marker}')
        if is_public and is_note:
            candidates.append((oid, name))
    if candidates:
        print(f'\n  → ANBEFALT outcome_id for "Public note": {candidates[0][0]} ({candidates[0][1]})')
except Exception as e:
    print(f'  FEIL: {e}')

print('\n=== 2. Test agent-oppslag på e-post ===')
test_email = input('Skriv inn en tekniker-e-post for test (eller blank for å hoppe over): ').strip()
if test_email:
    try:
        data = api_get(token, f'/Agent?search={urllib.parse.quote(test_email)}')
        agents = items_of(data, 'agents', 'value')
        if not agents:
            print(f'  Ingen agenter matchet "{test_email}"')
        else:
            for a in agents[:5]:
                aid = a.get('id')
                name = a.get('name') or '?'
                email = a.get('email') or a.get('emailaddress') or '?'
                print(f'  id={aid:<5}  {name:<30}  {email}')
            agent_id = agents[0].get('id')
            print(f'\n=== 3. Åpne tickets for agent_id={agent_id} ===')
            tdata = api_get(token, f'/Tickets?agent_id={agent_id}&open_only=true&pageinate=true&page_size=10')
            tickets = items_of(tdata, 'tickets', 'value')
            print(f'  {len(tickets)} åpne tickets (viser maks 10):')
            for t in tickets[:10]:
                tid = t.get('id')
                summary = (t.get('summary') or '?')[:60]
                client = (t.get('client_name') or t.get('clientname') or '')[:25]
                print(f'  #{tid:<7} [{client:<25}] {summary}')
    except Exception as e:
        print(f'  FEIL: {e}')

print('\n[ferdig]')
