# Care Calendar – Run and Dev from Project Root

This project previously required cd into `workforce-management-system`. It now includes a root entry point so you can run it directly from the repository root.

## Quick start (Windows PowerShell)

1. Create and activate a virtual environment (optional but recommended)
   - Python 3.12+ is recommended
2. Install dependencies
3. Run the app

Commands:

```powershell
# From the repo root
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py
```

Then open <http://127.0.0.1:5000>

## Quick start (WSL / bash)

```bash
# From the repo root in WSL
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

## Raspberry Pi (host on your LAN)

Use a Python venv on the Pi, then run the app bound to all interfaces so your smart fridge or other devices can reach it.

```bash
sudo apt update && sudo apt install -y python3-venv python3-pip
git clone <your repo url> Care-Calendar && cd Care-Calendar
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
HOST=0.0.0.0 PORT=8080 FLASK_DEBUG=0 python main.py
```

Open `http://PI_IP:8080` on your fridge (replace PI_IP with your device IP).

### Optional: Run as a service on Raspberry Pi

1. Copy the service file:

- sudo cp deployment/raspi-care-calendar.service /etc/systemd/system/care-calendar.service

1. Reload and enable:

- sudo systemctl daemon-reload && sudo systemctl enable --now care-calendar

1. Logs:

- journalctl -u care-calendar -f

### Backups

Run the backup script (in WSL/bash):

```bash
bash scripts/backup_db.sh
```

## Development tips

- App module: The Flask app lives in `workforce-management-system/app.py` and imports `database.py` from the same folder.
- Templates/static: Still located under `workforce-management-system/templates` and `workforce-management-system/static`.
- Root runner: `main.py` adjusts `sys.path` so the existing module layout works unchanged.
- Database: The SQLite file is `workforce-management-system/database.db`. You can delete it to reset the DB. On next run it will be re-created.

### Environment variables

- HOST: bind address (default 127.0.0.1). Use 0.0.0.0 on the Pi.
- PORT: port to listen on (default 5000).
- FLASK_DEBUG: 1 for dev, 0 for prod.

## Common tasks

- Reset database:
  - Stop the server
  - Delete `workforce-management-system/database.db`
  - Run `python main.py`
- Update packages:
  - Edit `requirements.txt` at the repo root
  - Run `pip install -r requirements.txt`

## Notes

- If you prefer the old style, you can still run from the subfolder:
  - `cd workforce-management-system && python app.py`
- The roadmap for features and status is in `workforce-management-system/ROADMAP.md`.

## Shared Google Calendar (auto-sync from the Pi)

Goal: Keep your site local on the Raspberry Pi while automatically pushing shifts to a shared Google Calendar. Caregivers only need to subscribe once; you edit shifts here and updates flow out.

What you'll do once:

- Enable Google Calendar API and download an OAuth client JSON.
- Generate a token on your Windows PC (easier), which will be copied to the Pi.
- Run a deploy script that installs deps on the Pi and sets up a systemd timer.

Prereqs

- You can SSH into the Pi from Windows PowerShell. Example: `ssh pi@192.168.x.x`
- Your repo has a Python venv: `.venv` at root.

Step 1 — Enable API and place client secret

1) In Google Cloud Console, create or open a project.
2) Enable “Google Calendar API”.
3) Create OAuth client credentials of type “Desktop app”. Download the JSON.
4) Save it to: `workforce-management-system/.secrets/client_secret.json` (create the `.secrets` folder).

Step 2 — Generate token on Windows

```powershell
# From repo root in PowerShell with venv active
python scripts/google_oauth_setup.py
```
Follow the printed URL, sign in, allow access, paste the code. This writes:
`workforce-management-system/.secrets/token.json`.

Step 3 — Choose calendar

- Default is your account’s primary calendar.
- Optional: use a specific shared calendar ID (Google Calendar > Settings > [Calendar] > Integrate Calendar > Calendar ID).

Step 4 — Deploy sync to Raspberry Pi

```powershell
# From repo root (PowerShell)
# Example: Pi at 192.168.50.170, user pi, custom calendar id
./scripts/deploy_pi_sync.ps1 -HostName 192.168.50.170 -User pi -CalendarId "your_shared_calendar_id@group.calendar.google.com"
```

What it does:

- Copies client_secret.json + token.json to the Pi.
- Ensures a venv and installs requirements on the Pi.
- Copies the sync script and sets up a systemd service + timer to run every 5 minutes.

Step 5 — Verify on the Pi

```powershell
ssh pi@192.168.50.170 "systemctl status care-calendar-sync.service; journalctl -u care-calendar-sync -n 50 --no-pager"
```

Manual run (optional)

```powershell
ssh pi@192.168.50.170 "cd ~/Care-Calendar; source .venv/bin/activate; GOOGLE_CALENDAR_ID='your_id' CARE_TZ='America/New_York' python scripts/google_calendar_sync.py"

```

Share the calendar with caregivers in Google Calendar (read-only). They don’t need to touch the Pi.

Notes

- Secrets are git-ignored under `workforce-management-system/.secrets/`.
- If you change the Google account or calendar, re-run the deploy with a new token.
- The sync script upserts events by stable id `shift-<id>` and prunes events that no longer exist in the DB within a 6‑month window.
