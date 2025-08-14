"""One-time helper script to migrate existing SQLite DB to the new data/ directory.

Usage (from repo root):
    python scripts/migrate_db_to_data.py

It will:
 1. Locate old DB at backend/database.db (if present).
 2. Create data/ directory if missing.
 3. Copy (not move) the DB to data/database.db if target does not exist.
 4. Print next-step instructions (update CARE_DB_PATH or systemd unit).

Safe to re-run (idempotent). It will not overwrite an existing data/database.db.
"""
from __future__ import annotations

import os
import shutil
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
OLD_DB = REPO_ROOT / 'backend' / 'database.db'
NEW_DIR = REPO_ROOT / 'data'
NEW_DB = NEW_DIR / 'database.db'


def main() -> None:
    if not OLD_DB.exists():
        print(f"No legacy DB found at {OLD_DB}; nothing to migrate.")
        return
    NEW_DIR.mkdir(parents=True, exist_ok=True)
    if NEW_DB.exists():
        print(f"Target DB already exists at {NEW_DB}; leaving legacy file in place for manual comparison.")
    else:
        shutil.copy2(OLD_DB, NEW_DB)
        print(f"Copied {OLD_DB} -> {NEW_DB}")
    print("\nNext steps:")
    print("  1. Set CARE_DB_PATH environment variable to 'data/database.db' when running locally.")
    print("  2. Ensure systemd unit has Environment=CARE_DB_PATH=/home/pi/Care-Calendar/data/database.db")
    print("  3. After verifying app runs, you may archive or delete the legacy backend/database.db (or keep as .legacy).")


if __name__ == '__main__':
    main()
