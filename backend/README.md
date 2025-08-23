# 💼 Care Calendar (Workforce Management System)

## What’s new

- Calendar-first UI (month/week) replaces the legacy shift list.
- Recurring weekly shifts with weekday selection, optional end date, and series_id.
- Optional shift end time to detect coverage gaps (e.g., 09:00–21:00).
- Batch selection + deletion with “delete entire series?” prompt when applicable.
- Context menu is viewport-aware; Edit Series opens a guided wizard.
- New Shift wizard defaults to 09:00 start; time pickers are 15-minute increments.
- Employee deletion cascades to their shifts (soft cascade).
- Weekly hours report page and CSV export at /hours and /hours.csv.
- Consistent header/nav; home title is “Care Calendar”.

Aug 2025 updates:

- UI/UX consistency pass: unified header via partial, standardized containers/margins, and global heading scale.
- Edit Day wizard completed: opens from shift menu, validates time, and updates only the selected occurrence.
- Accessibility: nav ARIA labeling; subtle borders on calendar events for colorblind affordance.

Upcoming: Caregiver Time Off (multi-day unavailability) feature is planned – see ROADMAP.md section "Planned Feature: Caregiver Time Off".

## Install & run

1. Install deps
   - pip install -r requirements.txt
2. Initialize DB and run
   - python app.py
3. Open <http://127.0.0.1:5000> and sign up, then log in.

## Using the calendar

- Click “New Shift” to launch the wizard. Pick caregiver, date/time (default 09:00), optional end, and repeat weekly with weekdays and optional end date.
- Click a shift to open the context menu: delete one, delete series, swap caregiver, edit series, adjust coverage window.
- Select shifts to batch delete; if any belong to a series you’ll be prompted whether to delete entire series.

## Hours report

- Go to /hours for the current week totals per employee. Use /hours.csv to download CSV. Optional queries: ?start=YYYY-MM-DD and ?end=YYYY-MM-DD. If end is omitted, the range defaults to 7 days from start; if neither is provided, the current week (Mon–Sun) is used.

## Coverage window

- Use the context menu’s Coverage window controls to set start/end in 15-minute increments. Stored locally (per-browser) for now.

## Resetting the database

- Stop the server
- Delete workforce-management-system/database.db
- Start the server again to re-create tables: python app.py
- Sign up/log in and re-add employees/shifts

Tip: If schema issues persist, also delete the Python cache folder workforce-management-system/__pycache__/.

## Raspberry Pi 2B tips

- The UI defaults to week view on small screens. You can force week view by opening DevTools console and running: localStorage.setItem('view','week'); location.reload();
- If performance is tight, prefer week view and limit open menus/dialogs.

## Security

- Auth required for scheduling, tasks, attendance, performance, and APIs.

## Notes

- Legacy shift list has been removed in favor of the calendar.
- Series updates re-generate future occurrences from the current week’s Monday.
- If Edit Series seems to do nothing, ensure you opened the menu on a recurring shift (one with a series_id).
