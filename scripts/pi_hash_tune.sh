#!/usr/bin/env bash
#changes
# Care Calendar – Raspberry Pi password hash tuning & deployment helper
#
# Purpose:
#   Benchmark several PBKDF2 iteration counts (and optionally Argon2 if installed)
#   on the target Pi hardware, pick the strongest setting that stays under a
#   desired login verification time budget, and (optionally) inject
#   CARE_PWHASH_METHOD into the systemd unit then restart the service.
#
# Usage:
#   chmod +x scripts/pi_hash_tune.sh
#   ./scripts/pi_hash_tune.sh                 # dry run, show table & recommendation
#   ./scripts/pi_hash_tune.sh --target-ms 180 # pick iteration count under 180ms
#   sudo ./scripts/pi_hash_tune.sh --apply    # modify /etc/systemd/system/care-calendar.service
#   sudo ./scripts/pi_hash_tune.sh --argon2 --apply  # prefer argon2 if available
#
# Notes:
#   - Iteration calibration uses a single hash verification timing.
#   - For stability it runs each candidate N times (default 2) and averages.
#   - Argon2 timing uses the library default parameters; adjust manually if needed.
#   - After modifying the systemd unit, the script reloads daemon and restarts service.
set -euo pipefail

TARGET_MS=200
APPLY=0
USE_ARGON2=0
RUNS=2
SERVICE_NAME="care-calendar.service"
SYSTEMD_PATH="/etc/systemd/system/${SERVICE_NAME}"
REPO_ROOT="${HOME}/Care-Calendar"
VENV_PY="${REPO_ROOT}/.venv/bin/python"
METHOD_SELECTED=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target-ms) TARGET_MS=${2:-200}; shift 2;;
    --apply) APPLY=1; shift;;
    --runs) RUNS=${2:-2}; shift 2;;
    --argon2) USE_ARGON2=1; shift;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0;;
    *) echo "Unknown arg: $1"; exit 1;;
  esac
done

if [[ ! -x "$VENV_PY" ]]; then
  echo "[WARN] Python venv not found at $VENV_PY. Falling back to system python." >&2
  VENV_PY="python3"
fi

# Python snippet to benchmark PBKDF2 iteration counts
read -r -d '' PY_CODE <<'PY'
import os, time, statistics
from werkzeug.security import generate_password_hash, check_password_hash

iterations = [300000,250000,200000,180000,160000,150000,140000,130000,120000,110000,100000,90000,80000,70000,60000]
password = 'benchmark-pass'
runs = int(os.environ.get('RUNS','2'))
results = []
for it in iterations:
    method = f'pbkdf2:sha256:{it}'
    h = generate_password_hash(password, method=method)
    times=[]
    for _ in range(runs):
        t0=time.perf_counter(); check_password_hash(h,password); times.append((time.perf_counter()-t0)*1000)
    avg=statistics.mean(times)
    results.append((it, avg))

print('PBKDF2_ITER,AVG_MS')
for it, avg in results:
    print(f'{it},{avg:.2f}')
PY

echo "[INFO] Benchmarking PBKDF2 candidates (target <= ${TARGET_MS} ms)..."
PBKDF2_TABLE=$(RUNS=$RUNS "$VENV_PY" - <<PY
$PY_CODE
PY
)
if [[ -z "$PBKDF2_TABLE" ]]; then
  echo "[ERROR] Benchmark failed."; exit 1
fi

printf '%s\n' "$PBKDF2_TABLE" | column -t -s ,

# Choose highest iteration <= TARGET_MS
BEST_ITERS=$(printf '%s\n' "$PBKDF2_TABLE" | awk -F, -v lim=$TARGET_MS 'NR>1 {if($2+0 <= lim){best=$1}} END{print best}')
if [[ -z "$BEST_ITERS" ]]; then
  echo "[WARN] No PBKDF2 iteration count met the target ${TARGET_MS}ms; using lowest candidate." >&2
  BEST_ITERS=$(printf '%s\n' "$PBKDF2_TABLE" | awk -F, 'NR==2{print $1}')
fi
METHOD_SELECTED="pbkdf2:sha256:${BEST_ITERS}"

if [[ $USE_ARGON2 -eq 1 ]]; then
  echo "[INFO] Checking Argon2 availability..."
  if "$VENV_PY" - <<'PY'
try:
    import argon2
    from werkzeug.security import generate_password_hash, check_password_hash
    import time
    h = generate_password_hash('benchmark-pass', method='argon2')
    t0=time.perf_counter(); check_password_hash(h,'benchmark-pass'); dt=(time.perf_counter()-t0)*1000
    print(f'OK {dt:.2f}')
except Exception as e:
    print('ERR', e)
PY
  then
    A_OUT=$("$VENV_PY" - <<'PY'
import time
from werkzeug.security import generate_password_hash, check_password_hash
h = generate_password_hash('benchmark-pass', method='argon2')
t0=time.perf_counter(); check_password_hash(h,'benchmark-pass'); dt=(time.perf_counter()-t0)*1000
print(f'{dt:.2f}')
PY
)
    A_MS=${A_OUT%%.*}
    echo "[INFO] Argon2 verify ~${A_OUT} ms"
    if [[ $A_MS -le $TARGET_MS ]]; then
      METHOD_SELECTED="argon2"
      echo "[INFO] Selecting argon2 (within target)."
    else
      echo "[INFO] Argon2 slower than target; keeping PBKDF2 method ${METHOD_SELECTED}."
    fi
  else
    echo "[WARN] Argon2 not available; pip install argon2-cffi to enable."
  fi
fi

echo "[INFO] Recommended CARE_PWHASH_METHOD=${METHOD_SELECTED}"

if [[ $APPLY -eq 1 ]]; then
  if [[ $EUID -ne 0 ]]; then
    echo "[ERROR] --apply requires sudo/root (systemd unit modification)."; exit 1
  fi
  if [[ ! -f "$SYSTEMD_PATH" ]]; then
    echo "[ERROR] Service file not found at $SYSTEMD_PATH; install service first."; exit 1
  fi
  BACKUP="${SYSTEMD_PATH}.$(date +%Y%m%d-%H%M%S).bak"
  cp "$SYSTEMD_PATH" "$BACKUP"
  echo "[INFO] Backup saved: $BACKUP"
  if grep -q 'CARE_PWHASH_METHOD=' "$SYSTEMD_PATH"; then
    sed -i "s#Environment=CARE_PWHASH_METHOD=.*#Environment=CARE_PWHASH_METHOD=${METHOD_SELECTED}#" "$SYSTEMD_PATH"
  else
    # Insert after last existing Environment= line inside [Service]
    awk -v method="$METHOD_SELECTED" '
      BEGIN{added=0}
      /^
\[Service\]/ {print; next}
      {print}
    ' "$SYSTEMD_PATH" >/dev/null # placeholder (robust insertion below)
    # Simpler: append near end of Service block
    sed -i "/^ExecStart=/i Environment=CARE_PWHASH_METHOD=${METHOD_SELECTED}" "$SYSTEMD_PATH"
  fi
  echo "[INFO] Updated service file with CARE_PWHASH_METHOD=${METHOD_SELECTED}"
  systemctl daemon-reload
  systemctl restart "$SERVICE_NAME" || true
  echo "[INFO] Restarted $SERVICE_NAME. Check recent logs:"
  echo "       journalctl -u $SERVICE_NAME -n 20 --no-pager"
else
  echo "[INFO] Dry run complete. To apply automatically to systemd: rerun with --apply (use sudo)."
  echo "      Example: sudo ./scripts/pi_hash_tune.sh --target-ms 180 --apply"
fi
