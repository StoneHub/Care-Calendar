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
LEGACY_DB = REPO_ROOT / 'backend' / 'database.db'
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
    print(f'Legacy DB: {LEGACY_DB}')
    print(f'Target DB: {NEW_DB}')

    DATA_DIR.mkdir(exist_ok=True)

    if LEGACY_DB.exists():
        backup = ensure_backup(LEGACY_DB)
        if backup:
            print(f'Created backup: {backup}')
    else:
        print('No legacy DB found (backend/database.db).')

    if not NEW_DB.exists() and LEGACY_DB.exists():
        shutil.copy2(LEGACY_DB, NEW_DB)
        print(f'Copied legacy DB to {NEW_DB}')
    elif NEW_DB.exists():
        print('Target DB already exists; leaving as-is.')

    # Compare row counts
    print('\nTable row counts (legacy -> new):')
    for table in TABLES:
        legacy_count = count_rows(LEGACY_DB, table)
        new_count = count_rows(NEW_DB, table)
        print(f'  {table:12s}: {legacy_count if legacy_count>=0 else "-"} -> {new_count if new_count>=0 else "-"}')

    print('\nNext steps:')
    print(' 1. Ensure systemd unit has Environment=CARE_DB_PATH=/home/pi/Care-Calendar/data/database.db')
    print(' 2. Restart service: sudo systemctl restart care-calendar.service')
    print(' 3. Check status:   sudo systemctl status care-calendar.service --no-pager')
    print(' 4. Optional: After validation, archive or remove backend/database.db')

    print('\nSet CARE_DB_PATH for current shell (manual run):')
    print('  export CARE_DB_PATH=data/database.db')

if __name__ == '__main__':
    main()
