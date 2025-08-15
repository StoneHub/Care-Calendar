"""Interactive post-pull maintenance script for Raspberry Pi deployment.

Run after `git pull` on the Pi to safely migrate the legacy DB to the new data/ location
and verify integrity before restarting the systemd service.

Usage:
    source .venv/bin/activate  # ensure deps
    python scripts/pi_post_pull.py

Features:
    - Detects legacy DB at backend/database.db, root database.db, or workforce-management-system/database.db.
  - Creates timestamped backup under data/backups/.
    - Copies DB to data/database.db if target missing (or force overwrite with --force-overwrite).
  - Compares row counts for critical tables (employees, shifts, attendance, tasks, users).
  - Prints systemd instructions and next commands.
  - Idempotent (re-run safe).
"""
from __future__ import annotations

import os
import sqlite3
from datetime import datetime
from pathlib import Path
import shutil
import argparse

REPO_ROOT = Path(__file__).resolve().parents[1]
LEGACY_DB_BACKEND = REPO_ROOT / 'backend' / 'database.db'
LEGACY_DB_ROOT = REPO_ROOT / 'database.db'
LEGACY_DB_WMS = REPO_ROOT / 'workforce-management-system' / 'database.db'
DATA_DIR = REPO_ROOT / 'data'
NEW_DB = DATA_DIR / 'database.db'
BACKUP_DIR = DATA_DIR / 'backups'
TABLES = [
    'employees', 'shifts', 'attendance', 'tasks', 'users'
]

def count_rows(db_path: Path, table: str) -> int:
    if not db_path.exists():
        return -1
    conn = sqlite3.connect(db_path)
    try:
        cur = conn.execute(f'SELECT COUNT(*) FROM {table}')
        return int(cur.fetchone()[0])
    except sqlite3.Error:
        return -1
    finally:
        conn.close()

def ensure_backup(src: Path) -> Path | None:
    if not src.exists():
        return None
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime('%Y%m%d-%H%M%S')
    dest = BACKUP_DIR / f'database-{ts}.db'
    shutil.copy2(src, dest)
    return dest

def list_tables(db: Path) -> list[str]:
    if not db.exists():
        return []
    try:
        con = sqlite3.connect(db)
        cur = con.execute("SELECT name FROM sqlite_master WHERE type='table'")
        rows = [r[0] for r in cur.fetchall()]
        con.close()
        return rows
    except Exception:
        return []

def choose_legacy() -> Path | None:
    candidates = [p for p in [LEGACY_DB_BACKEND, LEGACY_DB_ROOT, LEGACY_DB_WMS] if p.exists()]
    if not candidates:
        return None
    scored = []
    for p in candidates:
        tabs = list_tables(p)
        size = p.stat().st_size
        mtime = p.stat().st_mtime
        scored.append((1 if tabs else 0, size, mtime, p))
    # Prefer those with tables, then largest size, then newest mtime
    scored.sort(reverse=True)
    return scored[0][3]

def main() -> None:
    parser = argparse.ArgumentParser(description='Pi post-pull DB migration helper')
    parser.add_argument('--force-overwrite', action='store_true', help='Overwrite target DB even if it exists')
    args = parser.parse_args()

    print('== Care Calendar Pi Post-Pull Helper ==')
    print(f'Legacy DB (backend): {LEGACY_DB_BACKEND} {"[exists]" if LEGACY_DB_BACKEND.exists() else ""}')
    print(f'Legacy DB (root)   : {LEGACY_DB_ROOT} {"[exists]" if LEGACY_DB_ROOT.exists() else ""}')
    print(f'Legacy DB (wms)    : {LEGACY_DB_WMS} {"[exists]" if LEGACY_DB_WMS.exists() else ""}')
    preferred_legacy = choose_legacy()
    if preferred_legacy:
        print(f'Chosen legacy source: {preferred_legacy} (size={preferred_legacy.stat().st_size} bytes tables={list_tables(preferred_legacy)})')
    else:
        print('No legacy DB found in any known location.')
    print(f'Target DB: {NEW_DB} {"[exists]" if NEW_DB.exists() else ""}')

    DATA_DIR.mkdir(exist_ok=True)

    if preferred_legacy and preferred_legacy.exists():
        backup = ensure_backup(preferred_legacy)
        if backup:
            print(f'Created backup: {backup}')

    # Copy / overwrite logic
    if NEW_DB.exists():
        if args.force_overwrite and preferred_legacy and preferred_legacy.exists():
            shutil.copy2(preferred_legacy, NEW_DB)
            print(f'Overwrote target DB with legacy {preferred_legacy.name}')
        else:
            print('Target DB already exists; leaving as-is (use --force-overwrite to replace).')
    elif preferred_legacy and preferred_legacy.exists():
        shutil.copy2(preferred_legacy, NEW_DB)
        print(f'Copied legacy DB ({preferred_legacy.name}) to {NEW_DB}')
    else:
        print('No legacy DB to copy; target remains absent.')

    # Compare row counts
    print('\nTable row counts (legacy -> new):')
    for table in TABLES:
        legacy_count = count_rows(preferred_legacy, table) if preferred_legacy and preferred_legacy.exists() else -1
        new_count = count_rows(NEW_DB, table)
        print(f'  {table:12s}: {legacy_count if legacy_count>=0 else "-"} -> {new_count if new_count>=0 else "-"}')

    # Schema presence warning
    if NEW_DB.exists() and not list_tables(NEW_DB):
        print('\nWARNING: Target DB has no tables. Initialize schema if starting fresh:')
        print('  python -c "from backend.database import init_db; init_db()"')

    print('\nNext steps:')
    print(' 1. Ensure systemd unit has Environment=CARE_DB_PATH=/home/monroe/Care-Calendar/data/database.db')
    print(' 2. Restart service: sudo systemctl restart care-calendar.service')
    print(' 3. Check status:   sudo systemctl status care-calendar.service --no-pager')
    print('  4. After validation, archive old DB(s) you no longer need.')

    print('\nSet CARE_DB_PATH for current shell (manual run):')
    print('  export CARE_DB_PATH=data/database.db')

if __name__ == '__main__':
    main()
