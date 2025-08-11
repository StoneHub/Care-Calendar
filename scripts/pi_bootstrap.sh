#!/usr/bin/env bash
set -euo pipefail

ROOT="${HOME}/Care-Calendar"
APP_DIR="${ROOT}/workforce-management-system"
SECRETS_DIR="${APP_DIR}/.secrets"
VENV="${ROOT}/.venv"
SERVICE_NAME="care-calendar-sync"
TZ_NAME="${CARE_TZ:-America/New_York}"

if [ ! -d "${ROOT}" ]; then
  echo "Project directory not found at ${ROOT}. Clone the repo first, e.g.:"
  echo "  git clone <your-repo-url> ${ROOT}"
  exit 1
fi

echo "[1/7] Ensuring base packages..."
sudo apt update -y
sudo apt install -y python3-venv python3-pip git

echo "[2/7] Making venv and installing requirements..."
python3 -m venv "${VENV}"
# shellcheck disable=SC1090
source "${VENV}/bin/activate"
pip install --upgrade pip setuptools wheel
pip install -r "${ROOT}/requirements.txt"

echo "[3/7] Google API secrets directory..."
mkdir -p "${SECRETS_DIR}"
if [ ! -f "${SECRETS_DIR}/client_secret.json" ]; then
  echo "client_secret.json not found at ${SECRETS_DIR}."
  echo "Option A: scp it from your PC:"
  echo "  scp path/to/client_secret.json pi@PI_IP:${SECRETS_DIR}/client_secret.json"
  echo "Option B: paste JSON now (end with Ctrl-D)."
  read -r -p "Paste now? [y/N]: " PASTE
  if [[ "${PASTE:-N}" =~ ^[Yy]$ ]]; then
    echo "Paste JSON, then Ctrl-D:"
    cat > "${SECRETS_DIR}/client_secret.json"
  else
    echo "Please copy the file and re-run this script."; exit 1
  fi
fi

echo "[4/7] OAuth console flow (opens a URL; paste the code here when prompted)..."
"${VENV}/bin/python" "${ROOT}/scripts/google_oauth_setup.py"

echo "[5/7] Choose Google Calendar ID..."
echo "Press Enter to use your account's 'primary' calendar,"
read -r -p "or paste a Calendar ID (e.g., xyz@group.calendar.google.com): " CAL_ID
CAL_ID="${CAL_ID:-primary}"

echo "[6/7] Installing systemd service + timer (${SERVICE_NAME})..."
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
TIMER_FILE="/etc/systemd/system/${SERVICE_NAME}.timer"
TMP_SERVICE="$(mktemp)"
TMP_TIMER="$(mktemp)"

cat > "${TMP_SERVICE}" <<UNIT
[Unit]
Description=Care Calendar – Google Calendar sync
After=network-online.target

[Service]
Type=oneshot
WorkingDirectory=${ROOT}
Environment=GOOGLE_CALENDAR_ID=${CAL_ID}
Environment=CARE_TZ=${TZ_NAME}
ExecStart=${VENV}/bin/python ${ROOT}/scripts/google_calendar_sync.py
UNIT

cat > "${TMP_TIMER}" <<UNIT
[Unit]
Description=Run Care Calendar Google sync every 5 minutes
[Timer]
OnBootSec=30
OnUnitActiveSec=5min
Unit=${SERVICE_NAME}.service
[Install]
WantedBy=timers.target
UNIT

sudo mv "${TMP_SERVICE}" "${SERVICE_FILE}"
sudo mv "${TMP_TIMER}" "${TIMER_FILE}"
sudo systemctl daemon-reload
sudo systemctl enable --now "${SERVICE_NAME}.timer"

echo "[7/7] Kick off first sync..."
systemctl start "${SERVICE_NAME}.service" || true

echo "Done. Check logs:"
echo "  journalctl -u ${SERVICE_NAME} -n 50 --no-pager"
