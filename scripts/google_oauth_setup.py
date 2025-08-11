import os
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/calendar"]
ROOT = os.path.dirname(os.path.dirname(__file__))
SECRETS_DIR = os.path.join(ROOT, "workforce-management-system", ".secrets")
CLIENT_SECRET = os.path.join(SECRETS_DIR, "client_secret.json")
TOKEN_FILE = os.path.join(SECRETS_DIR, "token.json")

if __name__ == "__main__":
    os.makedirs(SECRETS_DIR, exist_ok=True)
    if not os.path.exists(CLIENT_SECRET):
        raise SystemExit(f"Missing {CLIENT_SECRET}. Place your OAuth client JSON there.")
    flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET, SCOPES)
    creds = flow.run_console()
    with open(TOKEN_FILE, "w", encoding="utf-8") as f:
        f.write(creds.to_json())
    print(f"Wrote token to {TOKEN_FILE}")
