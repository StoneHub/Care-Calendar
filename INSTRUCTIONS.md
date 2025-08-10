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

## Development tips

- App module: The Flask app lives in `workforce-management-system/app.py` and imports `database.py` from the same folder.
- Templates/static: Still located under `workforce-management-system/templates` and `workforce-management-system/static`.
- Root runner: `main.py` adjusts `sys.path` so the existing module layout works unchanged.
- Database: The SQLite file is `workforce-management-system/database.db`. You can delete it to reset the DB. On next run it will be re-created.

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
