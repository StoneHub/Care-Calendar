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
import argparse, os, time, sys, sqlite3
from typing import Optional

# Ensure backend on import path if run from project root
PROJECT_ROOT = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)


def _auto_select_db(explicit: Optional[str]) -> None:
    """Decide which DB to use before importing backend.database.
    Priority:
      1. --db argument if provided
      2. Existing CARE_DB_PATH env var
      3. If backend/database.db is empty/absent but data/database.db exists & non-empty, use data/database.db
      4. Fallback to backend/database.db (handled by backend.database)
    Sets CARE_DB_PATH env var when we override.
    """
    if explicit:
        os.environ['CARE_DB_PATH'] = explicit
        return
    if os.environ.get('CARE_DB_PATH'):
        return
    backend_db = os.path.join(PROJECT_ROOT, 'backend', 'database.db')
    data_db = os.path.join(PROJECT_ROOT, 'data', 'database.db')
    backend_size = os.path.getsize(backend_db) if os.path.exists(backend_db) else -1
    data_size = os.path.getsize(data_db) if os.path.exists(data_db) else -1
    # Heuristic: choose data DB if backend is zero/absent and data is non-empty
    if (backend_size <= 0) and (data_size > 0):
        os.environ['CARE_DB_PATH'] = data_db
        print(f"[INFO] Auto-selected populated DB: {data_db}")


def _ensure_users_table(db_path: str):
    """If users table missing, run init_db() to create schema."""
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        exists = cur.fetchone() is not None
        conn.close()
    except Exception as e:
        print(f"[WARN] Failed to inspect DB for users table: {e}")
        return
    if not exists:
        try:
            from backend.database import init_db  # local import after env set
            init_db()
            print("[INFO] Initialized DB schema (users table created).")
        except Exception as e:
            print(f"[ERROR] Could not initialize DB schema: {e}")


def _build_arg_parser():
    p = argparse.ArgumentParser(description="Re-hash (and optionally create) a single user, or benchmark iteration counts.")
    p.add_argument('--email', help='User email (omit when only benchmarking)')
    p.add_argument('--password', help='Plaintext password to hash (omit when only benchmarking)')
    p.add_argument('--name', help='Name (if creating)')
    p.add_argument('--create', action='store_true', help='Create user if missing')
    p.add_argument('--pbkdf2-iter', type=int, help='Override to use pbkdf2:sha256:<iter>')
    p.add_argument('--show-hash', action='store_true', help='Print resulting hash (debug)')
    p.add_argument('--db', help='Explicit database path (overrides auto-detect)')
    p.add_argument('--benchmark', help='Comma-separated iteration counts to benchmark (no DB writes)')
    p.add_argument('--method', help='Explicit method override (e.g. argon2)')
    return p


def choose_method(pbkdf2_iter: Optional[int], explicit: Optional[str]) -> str:
    if explicit:
        return explicit
    if pbkdf2_iter:
        return f"pbkdf2:sha256:{pbkdf2_iter}"
    env = os.environ.get('CARE_PWHASH_METHOD')
    if env:
        return env
    # Werkzeug default (currently pbkdf2:sha256 with internal iteration count)
    return 'pbkdf2:sha256'


def main():
    p = _build_arg_parser()
    args = p.parse_args()

    # Decide DB before importing backend.database
    _auto_select_db(args.db)

    # Now safe to import DB helpers with correct env
    from backend import database  # type: ignore
    from backend.database import get_user_by_email, update_user_password, insert_user  # type: ignore
    from werkzeug.security import generate_password_hash, check_password_hash  # type: ignore

    db_path = getattr(database, 'DATABASE', os.environ.get('CARE_DB_PATH', 'backend/database.db'))
    _ensure_users_table(db_path)

    # Benchmark-only path
    if args.benchmark:
        from werkzeug.security import generate_password_hash, check_password_hash  # type: ignore
        pw = args.password or 'benchpw'
        counts = []
        for part in args.benchmark.split(','):
            part = part.strip()
            if not part:
                continue
            try:
                counts.append(int(part))
            except ValueError:
                print(f"[WARN] Skipping non-integer iteration spec: {part}")
        if not counts:
            print('[ERROR] No valid iteration counts provided.')
            return 7
        print(f"[INFO] Benchmarking pbkdf2 verify over {len(counts)} iteration counts (pw length={len(pw)})")
        results = []
        for it in counts:
            m = f'pbkdf2:sha256:{it}'
            h = generate_password_hash(pw, method=m)
            t0 = time.perf_counter(); check_password_hash(h, pw); ms = (time.perf_counter()-t0)*1000
            results.append((it, ms))
            print(f"  {it:>7} -> {ms:.1f}ms")
        under = [ (it, ms) for it, ms in results if ms < 1000 ]
        if under:
            best = max(under, key=lambda x: x[0])[0]
            print(f"[RECOMMEND] Highest iteration under 1000ms: {best}")
        else:
            print('[RECOMMEND] None under 1000ms; consider Argon2 or lower iterations.')
        return 0

    if not args.email or not args.password:
        print('[ERROR] --email and --password required unless using --benchmark')
        return 8

    email = args.email
    method = choose_method(args.pbkdf2_iter, args.method)

    try:
        user = get_user_by_email(email)
    except Exception as e:
        print(f"[ERROR] Failed retrieving user (possible schema issue): {e}")
        return 6
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
    # (summary reserved for future JSON output option)
    print(f"[OK] Re-hashed user email={email} method={method} verify={dt_ms:.1f}ms changed={changed}")
    if args.show_hash:
        print(new_hash)
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
