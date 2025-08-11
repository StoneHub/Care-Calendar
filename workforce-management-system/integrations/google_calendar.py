import os
from datetime import datetime, timedelta
from typing import Iterable, Dict, Optional, Set

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request

SCOPES = ["https://www.googleapis.com/auth/calendar"]

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
SECRETS_DIR = os.path.join(ROOT, ".secrets")
CLIENT_SECRET = os.path.join(SECRETS_DIR, "client_secret.json")
TOKEN_FILE = os.path.join(SECRETS_DIR, "token.json")

CARE_TZ = os.getenv("CARE_TZ", "America/New_York")
CALENDAR_ID = os.getenv("GOOGLE_CALENDAR_ID") or "primary"


def _load_creds() -> Credentials:
    os.makedirs(SECRETS_DIR, exist_ok=True)
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        with open(TOKEN_FILE, "w", encoding="utf-8") as f:
            f.write(creds.to_json())
    if not creds or not creds.valid:
        raise RuntimeError(
            "Google token missing/invalid. Run scripts/google_oauth_setup.py on your dev PC and copy token.json to the Pi."
        )
    return creds


def _service():
    creds = _load_creds()
    return build("calendar", "v3", credentials=creds, cache_discovery=False)


def _event_body(shift: Dict) -> Dict:
    """
    shift expects keys:
      - id (int)
      - employee_name (str) or name
      - date (YYYY-MM-DD) OR shift_time (ISO with time)
      - start_time (HH:MM) optional if using separate date/time
      - end_time (HH:MM) optional
      - shift_time may be ISO string "YYYY-MM-DDTHH:MM[:SS]"
    """
    emp_name = shift.get("employee_name") or shift.get("name") or "Caregiver"
    # Accept either split fields or single ISO string
    date_str: Optional[str] = shift.get("date")
    start_time: Optional[str] = shift.get("start_time")
    end_time: Optional[str] = shift.get("end_time")
    if not date_str and shift.get("shift_time"):
        # Parse ISO
        try:
            st_dt = datetime.fromisoformat(shift["shift_time"])  # naive
            date_str = st_dt.date().isoformat()
            start_time = st_dt.strftime("%H:%M")
        except Exception:
            pass

    # Fallback end time 1 hour later if missing
    if not end_time and shift.get("shift_time"):
        try:
            st_dt = datetime.fromisoformat(shift["shift_time"])  # naive
            et_dt = st_dt + timedelta(hours=1)
            end_time = et_dt.strftime("%H:%M")
        except Exception:
            end_time = None

    # Build start/end
    use_dt = bool(start_time)
    if use_dt:
        start = f"{date_str}T{start_time}:00"
        end = f"{date_str}T{(end_time or '23:59')}:00"
    else:
        # All-day
        start = date_str
        end = date_str

    body = {
        "id": f"shift-{shift['id']}",
        "summary": f"{emp_name} shift",
        "description": f"Shift on {date_str} for {emp_name} (ID {shift['id']})",
        "start": {"dateTime": start, "timeZone": CARE_TZ} if use_dt else {"date": date_str},
        "end": {"dateTime": end, "timeZone": CARE_TZ} if use_dt else {"date": date_str},
        "source": {"title": "Care Calendar", "url": os.getenv("PUBLIC_BASE_URL", "http://localhost:5000/shifts")},
    }
    return body


def upsert_shift(shift: Dict):
    svc = _service()
    body = _event_body(shift)
    try:
        return svc.events().insert(calendarId=CALENDAR_ID, body=body, conferenceDataVersion=0).execute()
    except Exception as e:
        # Update if exists
        if any(x in str(e) for x in ("409", "Already exists", "duplicate")):
            return svc.events().update(calendarId=CALENDAR_ID, eventId=body["id"], body=body).execute()
        raise


def delete_shift_event(shift_id: int):
    svc = _service()
    eid = f"shift-{shift_id}"
    try:
        svc.events().delete(calendarId=CALENDAR_ID, eventId=eid).execute()
    except Exception as e:
        if "404" in str(e):
            return
        raise


def bulk_sync(shifts: Iterable[Dict]):
    for s in shifts:
        upsert_shift(s)


def list_shift_event_ids_between(time_min_rfc3339: str, time_max_rfc3339: str) -> Set[str]:
    """Return eventIds (like shift-123) in the window."""
    svc = _service()
    ids: Set[str] = set()
    page_token = None
    while True:
        resp = svc.events().list(
            calendarId=CALENDAR_ID,
            timeMin=time_min_rfc3339,
            timeMax=time_max_rfc3339,
            singleEvents=True,
            showDeleted=False,
            maxResults=2500,
            pageToken=page_token,
            orderBy="startTime",
        ).execute()
        for item in resp.get("items", []):
            eid = item.get("id", "")
            if eid.startswith("shift-"):
                ids.add(eid)
        page_token = resp.get("nextPageToken")
        if not page_token:
            break
    return ids


def reconcile_window(db_shift_ids: Set[int], start: datetime, end: datetime) -> int:
    """Delete Google events of the form shift-<id> that are not in DB in the window."""
    # RFC3339 minimal: append Z (treat as UTC) for naive
    time_min = start.isoformat() + "Z" if start.tzinfo is None else start.astimezone().isoformat()
    time_max = end.isoformat() + "Z" if end.tzinfo is None else end.astimezone().isoformat()
    existing = list_shift_event_ids_between(time_min, time_max)
    db_ids = {f"shift-{i}" for i in db_shift_ids}
    to_delete = existing - db_ids
    if not to_delete:
        return 0
    svc = _service()
    count = 0
    for eid in to_delete:
        try:
            svc.events().delete(calendarId=CALENDAR_ID, eventId=eid).execute()
            count += 1
        except Exception:
            pass
    return count
