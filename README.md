# Care Calendar

Lightweight scheduling & workforce management (Flask backend + incremental React frontend) optimized for Raspberry Pi kiosk deployments.

## Quick Start (Local Dev)

```powershell
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
$env:CARE_DB_PATH = 'data\\database.db'  # optional; created if missing
python main.py
```

App runs at: <http://127.0.0.1:5000>

## Raspberry Pi Deployment (Phase A Refactor)

After pulling latest changes on the Pi:

```bash
source .venv/bin/activate
python scripts/pi_post_pull.py  # backs up and migrates DB if needed
sudo systemctl daemon-reload
sudo systemctl restart care-calendar.service
sudo systemctl status care-calendar.service --no-pager
```

## Database Seeding

For fresh development or container environments, use the deterministic seeding script:

```powershell
# Seed with test data (admin user, caregivers, shifts, time off)
python scripts/seed_database.py

# Reset database and re-seed
python scripts/seed_database.py --reset --yes

# Preview what would be created without making changes
python scripts/seed_database.py --dry-run --verbose
```

**Default seeded data:**
- Admin login: `admin@example.com` / `password`
- Employees: Alice Day, Bob Evening, Carol Float, Dave Nights, Eve Relief
- Shifts: Two recurring weekly series (current week + next week)
- Time off: Sample entries with date conflicts to demonstrate functionality

## Environment Variables

- CARE_DB_PATH (optional): Absolute or relative path to SQLite DB. Defaults to legacy `backend/database.db` if unset.
- FLASK_SECRET_KEY: Set to a strong random string in production.
- HOST / PORT / FLASK_DEBUG as usual.

## Database Migration Notes

Legacy DB (`backend/database.db`) is not tracked by git. New canonical location is `data/database.db`. The migration scripts only COPY (never delete) the original file and create timestamped backups under `data/backups/`.

Scripts:

- `scripts/migrate_db_to_data.py`: One-off simple copy.
- `scripts/pi_post_pull.py`: Interactive Pi helper (backup + verification).

## Systemd Unit

See `deployment/care-calendar.service` (includes `CARE_DB_PATH`). You can override environment via drop-in at `/etc/systemd/system/care-calendar.service.d/override.conf`.

### Password Hash Performance Tuning (Raspberry Pi)

Login latency is dominated by password hash verification. On resource-constrained Pi hardware you can calibrate a secure yet responsive cost and apply it automatically:

```bash
chmod +x scripts/pi_hash_tune.sh
./scripts/pi_hash_tune.sh --target-ms 180           # Dry run, recommend method under 180ms
sudo ./scripts/pi_hash_tune.sh --target-ms 180 --apply  # Update systemd unit with CARE_PWHASH_METHOD
```

Optionally prefer Argon2 (install `argon2-cffi` into the venv first):

```bash
source .venv/bin/activate
pip install argon2-cffi
sudo ./scripts/pi_hash_tune.sh --argon2 --target-ms 180 --apply
```

The web app will automatically upgrade existing user hashes on the next successful login if a new `CARE_PWHASH_METHOD` is set.

### One-off Manual User Re-hash Helper

If SSH pasting multiline Python is error-prone, use the helper script instead of heredocs:

```bash
source .venv/bin/activate
# Point to the populated DB if not using default
export CARE_DB_PATH=data/database.db  # adjust if needed

# Re-hash existing user using current CARE_PWHASH_METHOD (or default)
python scripts/rehash_user.py --email your@email --password 'PlaintextPW'

# Force a specific iteration count
python scripts/rehash_user.py --email your@email --password 'PlaintextPW' --pbkdf2-iter 80000

# Create the user if missing then hash
python scripts/rehash_user.py --create --name "Admin" --email admin@example.com --password 'Secret123' --pbkdf2-iter 60000
```

The script prints local verification timing so you can quickly iterate on a suitable `pbkdf2` cost. After settling, update the systemd unit's `CARE_PWHASH_METHOD` and restart the service.

## Roadmap & Refactor Plan

Detailed in `backend/ROADMAP.md`.

## Testing (Upcoming)

Phase B will introduce pytest harness and API tests for series CRUD & swap.

---
Minimal README auto-generated during refactor Phase A.
