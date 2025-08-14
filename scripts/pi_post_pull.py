"""Interactive post-pull maintenance script for Raspberry Pi deployment.

Run after `git pull` on the Pi to safely migrate the legacy DB to the new data/ location
and verify integrity before restarting the systemd service.

Usage:
    source .venv/bin/activate  # ensure deps
    python scripts/pi_post_pull.py

Features:
  - Detects legacy DB at backend/database.db.
  - Creates timestamped backup under data/backups/.
  - Copies DB to data/database.db if target missing.
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

REPO_ROOT = Path(__file__).resolve().parents[1]
LEGACY_DB_BACKEND = REPO_ROOT / 'backend' / 'database.db'
LEGACY_DB_ROOT = REPO_ROOT / 'database.db'
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

def main() -> None:
    print('== Care Calendar Pi Post-Pull Helper ==')
    preferred_legacy = None
    if LEGACY_DB_BACKEND.exists():
        preferred_legacy = LEGACY_DB_BACKEND
    elif LEGACY_DB_ROOT.exists():
        preferred_legacy = LEGACY_DB_ROOT

    print(f'Legacy DB (backend): {LEGACY_DB_BACKEND}')
    print(f'Legacy DB (root)   : {LEGACY_DB_ROOT}')
    if preferred_legacy:
        print(f'Chosen legacy source: {preferred_legacy}')
    else:
        print('No legacy DB found in either location.')
    print(f'Target DB: {NEW_DB}')

    DATA_DIR.mkdir(exist_ok=True)

    if preferred_legacy and preferred_legacy.exists():
        backup = ensure_backup(preferred_legacy)
        if backup:
            print(f'Created backup: {backup}')
    else:
        print('No legacy DB to back up.')

    if not NEW_DB.exists() and preferred_legacy and preferred_legacy.exists():
        shutil.copy2(preferred_legacy, NEW_DB)
        print(f'Copied legacy DB ({preferred_legacy.name}) to {NEW_DB}')
    elif NEW_DB.exists():
        print('Target DB already exists; leaving as-is.')

    # Compare row counts
    print('\nTable row counts (legacy -> new):')
    for table in TABLES:
        legacy_source = preferred_legacy if preferred_legacy else LEGACY_DB_BACKEND
        legacy_count = count_rows(legacy_source, table) if legacy_source and legacy_source.exists() else -1
        new_count = count_rows(NEW_DB, table)
        print(f'  {table:12s}: {legacy_count if legacy_count>=0 else "-"} -> {new_count if new_count>=0 else "-"}')

    print('\nNext steps:')
    print(' 1. Ensure systemd unit has Environment=CARE_DB_PATH=/home/pi/Care-Calendar/data/database.db')
    print(' 2. Restart service: sudo systemctl restart care-calendar.service')
    print(' 3. Check status:   sudo systemctl status care-calendar.service --no-pager')
    print(' 4. Optional: After validation, archive or remove legacy database (backend/database.db or root database.db)')

    print('\nSet CARE_DB_PATH for current shell (manual run):')
    print('  export CARE_DB_PATH=data/database.db')

if __name__ == '__main__':
    main()
