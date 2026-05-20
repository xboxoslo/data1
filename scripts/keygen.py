"""Keygen for intern pentesting og QA.

Genererer kryptografisk tilfeldige tokens, passord og secrets brukt under
autoriserte pentest-engasjementer mot egne systemer (intake-server, Halo-
integrasjonen, etc.). Bruker stdlib `secrets`-modulen.

Bruk:
    python keygen.py hex 32              # 32 bytes hex
    python keygen.py base64 32           # 32 bytes URL-safe base64
    python keygen.py uuid                # UUID v4
    python keygen.py password 24         # 24-tegns passord m/ symboler
    python keygen.py password 20 --no-symbols
    python keygen.py bearer              # 'Bearer <random>' for Authorization-header
    python keygen.py batch 10 hex 32     # 10 hex-tokens à 32 bytes
"""
from __future__ import annotations

import argparse
import base64
import secrets
import string
import sys
import uuid


def gen_hex(nbytes: int) -> str:
    return secrets.token_hex(nbytes)


def gen_base64(nbytes: int) -> str:
    return secrets.token_urlsafe(nbytes)


def gen_uuid() -> str:
    return str(uuid.uuid4())


def gen_password(length: int, *, symbols: bool = True) -> str:
    alphabet = string.ascii_letters + string.digits
    if symbols:
        alphabet += '!@#$%^&*()-_=+[]{};:,.<>?'
    while True:
        pw = ''.join(secrets.choice(alphabet) for _ in range(length))
        has_lower = any(c.islower() for c in pw)
        has_upper = any(c.isupper() for c in pw)
        has_digit = any(c.isdigit() for c in pw)
        has_sym = (not symbols) or any(c in '!@#$%^&*()-_=+[]{};:,.<>?' for c in pw)
        if has_lower and has_upper and has_digit and has_sym:
            return pw


def gen_bearer(nbytes: int = 32) -> str:
    return f'Bearer {secrets.token_urlsafe(nbytes)}'


GENERATORS = {
    'hex': lambda n: gen_hex(n or 32),
    'base64': lambda n: gen_base64(n or 32),
    'uuid': lambda _n: gen_uuid(),
    'password': lambda n: gen_password(n or 24),
    'bearer': lambda n: gen_bearer(n or 32),
}


def main(argv: list[str]) -> int:
    p = argparse.ArgumentParser(description='Keygen for intern pentesting og QA.')
    sub = p.add_subparsers(dest='cmd', required=True)

    for name in ('hex', 'base64', 'password', 'bearer'):
        sp = sub.add_parser(name, help=f'Generer {name}')
        default_len = 24 if name == 'password' else 32
        sp.add_argument('length', nargs='?', type=int, default=default_len,
                        help=f'Lengde (default {default_len})')
        if name == 'password':
            sp.add_argument('--no-symbols', action='store_true',
                            help='Bare bokstaver og tall')

    sub.add_parser('uuid', help='Generer UUID v4')

    sb = sub.add_parser('batch', help='Generer mange på én gang')
    sb.add_argument('count', type=int)
    sb.add_argument('kind', choices=sorted(GENERATORS.keys()))
    sb.add_argument('length', nargs='?', type=int, default=32)

    args = p.parse_args(argv)

    if args.cmd == 'batch':
        for _ in range(args.count):
            print(GENERATORS[args.kind](args.length))
        return 0

    if args.cmd == 'password':
        print(gen_password(args.length, symbols=not args.no_symbols))
        return 0

    if args.cmd == 'uuid':
        print(gen_uuid())
        return 0

    print(GENERATORS[args.cmd](args.length))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
