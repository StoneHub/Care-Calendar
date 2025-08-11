import os
import sys
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

# Ensure Python can import from the app folder when running from repo root
ROOT = os.path.dirname(os.path.dirname(__file__))
APP_DIR = os.path.join(ROOT, "workforce-management-system")
if APP_DIR not in sys.path:
    sys.path.insert(0, APP_DIR)

from integrations.google_calendar import bulk_sync, reconcile_window
from database import get_shifts_with_names_between

if __name__ == "__main__":
    tz = ZoneInfo(os.getenv("CARE_TZ", "America/New_York"))
    today = datetime.now(tz).date()
    start = today - timedelta(days=7)
    end = today + timedelta(days=180)

    rows = get_shifts_with_names_between(start.isoformat(), end.isoformat())
    # Convert sqlite3.Row to dict with expected keys
    shifts = []
    ids = set()
    for r in rows:
        d = {
            "id": r[0],
            "employee_name": r[1],
            "employee_id": r[2],
            "shift_time": r[3],
            "end_time": r[4],
            "series_id": r[5],
        }
        shifts.append(d)
        ids.add(d["id"])

    bulk_sync(shifts)
    # Optional: cleanup stray events in the window
    removed = reconcile_window(ids, datetime.combine(start, datetime.min.time()), datetime.combine(end, datetime.min.time()))
    print(f"Synced {len(shifts)} shifts; removed {removed} stray events.")
