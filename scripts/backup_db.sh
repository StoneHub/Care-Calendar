#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB="${ROOT_DIR}/workforce-management-system/database.db"
TS="$(date +%Y%m%d_%H%M%S)"
OUT="${ROOT_DIR}/backups/database_${TS}.db"
mkdir -p "${ROOT_DIR}/backups"
if [ -f "$DB" ]; then
  cp "$DB" "$OUT"
  echo "Backup created: $OUT"
else
  echo "No database found at $DB"
fi
