#!/usr/bin/env python3
"""Re-hash (or create then hash) a single user with the current or overridden password hash method.

Usage examples (run from project root with venv active):

  # Re-hash existing user using method from CARE_PWHASH_METHOD or default
  python scripts/rehash_user.py --email you@example.com --password 'secret'

  # Force a specific pbkdf2 iteration count (overrides env)
  python scripts/rehash_user.py --email you@example.com --password 'secret' --pbkdf2-iter 80000

  # Create user if missing
  python scripts/rehash_user.py --email you@example.com --password 'secret' --name 'Admin User' --create

Notes:
- Determines DB path the same way the app does (CARE_DB_PATH else backend/database.db).
- If --pbkdf2-iter is supplied it builds method pbkdf2:sha256:<n>.
- If CARE_PWHASH_METHOD is set and user hash differs, it will use that unless --pbkdf2-iter provided.
- Prints local verify timing for quick performance checks.
"""
from __future__ import annotations
import argparse, os, time, sys
from typing import Optional

# Ensure backend on import path if run from project root
PROJECT_ROOT = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.database import get_user_by_email, update_user_password, insert_user  # type: ignore
from werkzeug.security import generate_password_hash, check_password_hash  # type: ignore


def choose_method(pbkdf2_iter: Optional[int]) -> str:
    if pbkdf2_iter:
        return f"pbkdf2:sha256:{pbkdf2_iter}"
    env = os.environ.get('CARE_PWHASH_METHOD')
    if env:
        return env
    # Werkzeug default (currently pbkdf2:sha256 with internal iteration count)
    return 'pbkdf2:sha256'


def main():
    p = argparse.ArgumentParser(description="Re-hash (and optionally create) a single user.")
    p.add_argument('--email', required=True, help='User email')
    p.add_argument('--password', required=True, help='Plaintext password to hash')
    p.add_argument('--name', help='Name (if creating)')
    p.add_argument('--create', action='store_true', help='Create user if missing')
    p.add_argument('--pbkdf2-iter', type=int, help='Override to use pbkdf2:sha256:<iter>')
    p.add_argument('--show-hash', action='store_true', help='Print resulting hash (debug)')
    args = p.parse_args()

    email = args.email
    method = choose_method(args.pbkdf2_iter)

    user = get_user_by_email(email)
    if not user:
        if not args.create:
            print(f"[ERROR] User '{email}' not found. Use --create with --name to create.")
            return 2
        name = args.name or email.split('@')[0]
        # Temporary placeholder hash then updated below
        tmp_hash = generate_password_hash(args.password, method=method)
        try:
            insert_user(name, email, tmp_hash)
            user = get_user_by_email(email)
            print(f"[INFO] Created user '{email}'")
        except Exception as e:
            print(f"[ERROR] Failed to create user: {e}")
            return 3

    user_id = user[0]
    old_hash = user[3]

    # If old hash already matches prefix, still re-hash to measure current cost
    try:
        new_hash = generate_password_hash(args.password, method=method)
    except Exception as e:
        print(f"[ERROR] Failed to generate hash using method '{method}': {e}")
        return 4

    try:
        update_user_password(user_id, new_hash)
    except Exception as e:
        print(f"[ERROR] Failed to update password: {e}")
        return 5

    # Measure verify time locally
    t0 = time.perf_counter(); check_password_hash(new_hash, args.password); dt_ms = (time.perf_counter()-t0)*1000

    changed = (old_hash != new_hash)
    summary = {
        'email': email,
        'method': method,
        'changed': changed,
        'verify_ms': round(dt_ms, 2),
        'iterations': method.split(':')[-1] if method.startswith('pbkdf2') and method.count(':')==2 else None,
    }
    print(f"[OK] Re-hashed user email={email} method={method} verify={dt_ms:.1f}ms changed={changed}")
    if args.show_hash:
        print(new_hash)
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
