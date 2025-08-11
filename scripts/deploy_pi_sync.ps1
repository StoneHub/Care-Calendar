param(
    [Parameter(Mandatory=$true)][string]$HostName,
    [Parameter(Mandatory=$false)][string]$User = "pi",
    [Parameter(Mandatory=$false)][string]$ProjectDir = "$HOME/Care-Calendar",
    [Parameter(Mandatory=$false)][string]$CalendarId = "",
    [Parameter(Mandatory=$false)][string]$TimeZone = "America/New_York"
)

# Purpose: Copy Google secrets to Pi, install deps, and enable the sync timer via SSH
# Usage: ./scripts/deploy_pi_sync.ps1 -HostName 192.168.1.50 -User pi -CalendarId "your_calendar_id@group.calendar.google.com"

$ErrorActionPreference = "Stop"

function Invoke-SSH($cmd) {
    ssh "$User@$HostName" $cmd
}

Write-Host "Creating project directories on Pi..."
Invoke-SSH "mkdir -p $ProjectDir/workforce-management-system/.secrets $ProjectDir/scripts"

# Preflight: verify repo exists on Pi (requirements.txt present)
$exists = ssh "$User@$HostName" "test -f $ProjectDir/requirements.txt && echo ok || echo missing"
if ($exists -notmatch 'ok') {
    Write-Error "requirements.txt not found at $ProjectDir on the Pi. Clone the repo there first: 'git clone <repo> $ProjectDir'"
    exit 1
}

Write-Host "Copying secrets (client_secret.json and token.json) to Pi..."
scp "$PSScriptRoot/../workforce-management-system/.secrets/client_secret.json" "$($User)@$($HostName):$ProjectDir/workforce-management-system/.secrets/"
scp "$PSScriptRoot/../workforce-management-system/.secrets/token.json" "$($User)@$($HostName):$ProjectDir/workforce-management-system/.secrets/"

Write-Host "Copying sync script to Pi..."
scp "$PSScriptRoot/google_calendar_sync.py" "$($User)@$($HostName):$ProjectDir/scripts/"

Write-Host "Ensuring virtualenv and dependencies on Pi..."
Invoke-SSH "cd $ProjectDir; python3 -m venv .venv; source .venv/bin/activate; pip install -r requirements.txt"

$envs = @()
if ($CalendarId -ne "") { $envs += "Environment=GOOGLE_CALENDAR_ID=$CalendarId" }
$envs += "Environment=CARE_TZ=$TimeZone"

$service = @"
[Unit]
Description=Care Calendar – Google sync
After=network-online.target

[Service]
Type=oneshot
WorkingDirectory=$ProjectDir
ExecStart=$ProjectDir/.venv/bin/python $ProjectDir/scripts/google_calendar_sync.py
$(($envs -join "`n"))
"@

$timer = @"
[Unit]
Description=Run Care Calendar Google sync every 5 minutes

[Timer]
OnBootSec=30
OnUnitActiveSec=5min
Unit=care-calendar-sync.service

[Install]
WantedBy=timers.target
"@

$tmpService = New-TemporaryFile
$tmpTimer = New-TemporaryFile
Set-Content -Path $tmpService -Value $service -NoNewline
Set-Content -Path $tmpTimer -Value $timer -NoNewline

scp $tmpService.FullName "$($User)@$($HostName):/tmp/care-calendar-sync.service"
scp $tmpTimer.FullName "$($User)@$($HostName):/tmp/care-calendar-sync.timer"

Write-Host "Installing systemd units on Pi..."
Invoke-SSH "sudo mv /tmp/care-calendar-sync.service /etc/systemd/system/care-calendar-sync.service && sudo mv /tmp/care-calendar-sync.timer /etc/systemd/system/care-calendar-sync.timer && sudo systemctl daemon-reload && sudo systemctl enable --now care-calendar-sync.timer"

Write-Host "Done. Use: ssh $User@$HostName 'systemctl status care-calendar-sync.service; journalctl -u care-calendar-sync -n 50 --no-pager'"
