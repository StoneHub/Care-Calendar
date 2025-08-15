# Care Calendar: Enhanced Experience & Accessibility Development Plan

## Overview

This plan tracks upgrades to recurring weekly shifts, interactive calendar UI, coverage gap detection, swaps, and reporting.

## Implementation Status (Aug 2025)

### Completed

- Repeating weekly shifts with optional end date and weekday selection (backend, idempotent insert guard).
- Interactive calendar: month and week views with current-week highlight, legend, and per-employee colors.
- Legacy shift list removed; calendar-first UI validated on low-power devices (e.g., Raspberry Pi 2B week view default).
- Context menu on shifts: delete single, delete entire series, swap caregiver, and launch Edit Series wizard.
- Create Shift wizard: 15-minute time dropdowns, weekly repeat controls in-step, validation (end > start), and form submission.
- Edit Series wizard: stable overlay, 15-minute time dropdowns, weekday selection, optional repeat-until, review step, and robust validation.
- Fixed currentShift null bug by preserving selection when opening the Edit Series wizard and gating global click-to-close.
- Coverage window controls: 15-minute dropdowns, persisted in localStorage, applied to gap detection and rendering.
- Backend endpoints integrated: /api/update_series, /api/delete_series, /api/swap_shift, /api/delete_shift (client posts validated payloads).
- Better diagnostics: console logs payloads/responses for update_series; alerts surface backend validation errors.
- Batch selection and deletion of shifts (supports mixed single and series deletes).
- End time support with validation (end > start) and serialization.
- Weekly hours report per employee (/hours) with nav links.
- Consistent header/navigation links on index and shifts pages.
- Password hash performance tuning (Aug 2025): introduced `CARE_PWHASH_METHOD` operational guidance, created `scripts/rehash_user.py` for safe user re-hash & benchmarking (auto DB detection, schema init), documented iteration selection process for Raspberry Pi hardware.

### In Progress

- Performance tuning of month/week grids (reduce reflows, reuse nodes, optional virtualization for large data sets).
- Accessibility pass: keyboard navigation for pills/menu/wizards, ARIA roles/labels, focus management.
- Testing: API integration tests for series update/delete/swap; E2E wizard flows (create/edit/swap) and batch operations.
- Error presentation: non-blocking toasts/banners and inline field errors (replace alert for common cases).

### Next

- Drag-and-drop and resize shifts in the calendar.
  - Prompt to edit single occurrence vs entire series on changes.
  - Snap to 15-minute increments; prevent invalid moves (coverage/conflicts).
- Conflict detection & guidance.
  - Detect overlapping shifts per caregiver; warn or block based on policy.
  - Show conflicts inline and in review steps.
- Series management enhancements.
  - Duplicate/copy series; split series at a date; pause/resume series.
  - Edit a single future occurrence without breaking the series (exception handling).
- Filtering & views.
  - Filter by employee, series, coverage gaps; save view presets.
  - Quick-jump to employee’s next shift.
- Exports & sharing.
  - CSV export for weekly hours; iCal (.ics) export; printable daily/weekly schedule.
- Mobile & touch UX.
  - Long-press to open menu; improved hit targets; sticky toolbar.
- Timezone/DST hardening and server/client consistency.
- Roles & audit.
  - Basic RBAC for scheduling actions; audit log of changes (who/when/what).
- DevEx & repo hygiene.
  - Evaluate Argon2 adoption (install `argon2-cffi`, compare verify latency vs PBKDF2 at chosen cost).
  - Add periodic (cron) lightweight benchmark logging to detect performance regressions (planned script extension to output JSON summary).
  - Batch re-hash utility to upgrade all users silently when method changes.
  - Optional health/metrics endpoint exposing current hash method + rolling average verify time.
  - .gitattributes for line endings; Prettier/ESLint for web assets; Black/ruff for Python.

## Phase 2 Plan (Q3 2025)

- P1: Stability, UX, and tests (2–3 weeks)
  - Replace alerts with toast/banner component; inline error messaging in wizards.
  - A11y keyboarding and focus traps; add aria-live regions for toasts.
  - Integration/E2E tests for create/edit series, swap, batch delete.
- P2: Drag/drop editing and conflicts (2–3 weeks)
  - Implement drag/resize with 15-min snapping and series/single prompts.
  - Add overlap detection per caregiver and surface guidance.
- P3: Filters, exports, and print (1–2 weeks)
  - Employee/coverage filters; CSV weekly hours; printable views; optional .ics export.
- P4: Performance and cleanup (ongoing)
  - DOM reuse/virtualization for month view; remove legacy list; repo hygiene tasks.

---

## Repository Refactor Plan (Monorepo Hygiene)

Goal: Modernize layout, remove duplication, and set a clean baseline for upcoming feature work (drag/drop, tests, accessibility) without breaking existing running paths.

### Current Pain Points

- Duplicate folder tree `care-team-app/workforce-management-system` (partial, stale) risks confusion.
- Two requirements files (root + backend) drift potential.
- Multiple `database.db` copies at root and inside backend folder cause ambiguity.
- Mixed concerns at root (scripts, deployment, backend, nascent React `src/`).

### Target Layout (End State Vision)

```text
backend/                # Flask app (renamed from workforce-management-system)
  app.py
  care_calendar/        # (future) package modules (db, models, services)
  static/
  templates/
data/                   # Runtime artifacts (SQLite DB, backups) - gitignored
scripts/                # Operational scripts (deploy, sync, backup)
deployment/             # systemd units / infra descriptors
frontend/ or src/       # React/TypeScript client (expand from current src/)
.venv/
README.md
ROADMAP.md
INSTRUCTIONS.md
requirements.txt or pyproject.toml
```

### Phases (Shifts Split)

#### Phase A (Cleanup & Consolidation)

1. Deprecate `care-team-app/` duplicate subtree (mark with README; plan removal after validation).
2. Consolidate Python dependencies to root `requirements.txt`; remove backend `requirements.txt`.
3. Declare canonical DB location (`workforce-management-system/database.db`) and note root `database.db` as legacy; plan migration to `data/` in Phase B.
4. Add roadmap section (this) and update docs referencing only root requirements file.

#### Phase B (Structure & Packaging)

1. Rename `workforce-management-system/` -> `backend/` (update `main.py`, imports, service files).
2. Introduce `backend/care_calendar/` package: move database logic into `care_calendar/db.py` (preserve public init_db).
3. Introduce `data/` folder; move SQLite DB there; configure path via env (`CARE_DB_PATH`).
4. Add `.env.example` and central config loader.

#### Phase C (Tooling & Quality)

1. Adopt `pyproject.toml` (setuptools/uv/poetry-ready) replacing raw requirements.
2. Add Ruff + Black, Prettier + ESLint for JS/TS; CI lint workflows.
3. Add basic pytest harness (DB fixture, API tests for series CRUD, swap, hours report).

#### Phase D (Modularization & Frontend Separation)

1. Carve out API blueprint vs server-rendered templates; prep for SPA or hybrid.
2. Expand `src/` React app; incremental API consumption; shared shift DTO schema.
3. Add OpenAPI/JSON schema for shift endpoints (doc + validation).

#### Phase E (Deployment Hardening)

1. Containerize (multi-stage Dockerfile) optional path; keep Pi path.
2. systemd units updated for new layout & env file.
3. Automated DB backup rotation script to `data/backups/`.

### Phase A Status

Executed items (Aug 2025):

- [x] Roadmap updated with refactor plan.
- [x] Removed duplicate backend requirements file (root is canonical).
- [x] Added deprecation notice to `care-team-app/` (pending full removal after confirming no unique assets).
- [x] Introduced `CARE_DB_PATH` override logic in active `backend/database.py` (backward compatible) – groundwork for relocating DB to `data/`.
- [x] New systemd unit file `deployment/care-calendar.service` with `CARE_DB_PATH`.
- [x] Added `data/` directory scaffolding + migration script (`scripts/migrate_db_to_data.py`).
- [ ] Root stray `database.db` review/migration (pending verification before deletion or archival to `data/` as `.legacy`).

### No-Break Guarantee Notes

- `main.py` still prepends existing backend path; unchanged for continuity.
- Removing backend `requirements.txt` does not impact root-driven runs (`python main.py`); legacy subfolder runs should use `pip install -r ../requirements.txt` if needed until Phase B rename.

### Next Actions (prepare Phase B)

1. Inventory uniqueness of files under `TO_DELETE/care-team-app-duplicate/` vs active backend; if none, remove directory.
2. Remove `backend/requirements.txt` (root `requirements.txt` is canonical) and update any docs referencing it.
3. Create `data/` folder; move current SQLite file there (`data/database.db`) and set `CARE_DB_PATH` in env/systemd service; leave symlink or copy fallback if needed for one release.
4. Confirm no code references hardcoded old `workforce-management-system` path (search & update if any lingering).
5. Commit changes incrementally: (a) remove duplicate reqs + add data folder + .gitignore update, (b) migrate DB path, (c) remove duplicate legacy tree.
6. Introduce minimal `pyproject.toml` (optional pilot before full migration) and mark Phase B start.

### Raspberry Pi Migration Notes

Pulling new code will NOT delete the legacy `backend/database.db` because it was never tracked by git (local runtime artifact). After `git pull`:
\n1. Run `python scripts/migrate_db_to_data.py` to copy (not move) the old DB into `data/database.db` if the new file is absent.
2. Service uses `CARE_DB_PATH`; ensure systemd unit has it or export before manual runs.
3. After verifying counts (e.g., `sqlite3 data/database.db 'SELECT COUNT(*) FROM shifts;'`) match legacy, optionally archive `backend/database.db` to `backend/database.db.legacy` or remove.
\n*** End Patch

An interactive helper (`scripts/pi_post_pull.py`) will be added to automate: backup, copy, verify row counts, and print next commands.

---

## Shifts Template Modularization (Large File Split) – Plan

Goal: Reduce `backend/templates/shifts.html` size (≈1.5K LOC) for maintainability without refactoring logic (pure MOVE of CSS & JS, then optional HTML partialization). Preserve exact runtime behavior.

### Rationale

- Single monolithic file mixes template markup, styles, scripts → hard to diff & onboard new contributors.
- Inline CSS & JS block changes cause large, noisy commits and hinder caching/versioning.
- Splitting enables targeted future refactors (tests, lint) while keeping this step risk‑minimal.

### Guiding Constraints

1. DO NOT rewrite logic; only relocate blocks verbatim.
2. Preserve load order (data JSON scripts must precede app JS).
3. Minimal token / churn approach so agents can resume with context quickly.
4. Automated script performs deterministic transformation; reversible via created backup.

### Phases

| Phase | Action | Risk | Deliverables |
|-------|--------|------|--------------|
| 1 | Extract inline `<style>` → `static/css/shifts.css`; extract large inline JS → `static/js/shifts.js`. Replace with `<link>` & `<script src>` tags incl. cache-busting `?v=` param. | Very Low | New CSS/JS files; updated template; backup `.bak` file; script `split_shifts_template.py`. |
| 2 (optional) | Split JS into logical modules (`shifts.utils.js`, `shifts.calendar.js`, `shifts.menu.js`, `shifts.wizard.js`) keeping original relative order. | Low | 4 module files + aggregator (or ordered tags). |
| 3 (optional) | Extract large HTML blocks into partials under `templates/partials/` (`_nav.html`, `_shift_menu.html`, `_wizard_create.html`, `_wizard_edit_series.html`, `_wizard_edit_day.html`). Use `{% include %}`. | Low | Partial templates; slimmer `shifts.html`. |
| 4 (later) | Introduce macro(s) for repeated wizard step patterns (not now). | Medium | Jinja macro file. |

### Revert Strategy

- Each automated run creates `backend/templates/shifts.html.bak.<timestamp>`; restore by copying over the modified file.

### Automation Script (`scripts/split_shifts_template.py`)

Capabilities:

1. Detect if split already performed (presence of `static/css/shifts.css` & a `<script src="...shifts.js">` tag). Safe no-op unless `--force`.
2. Extract first `<style>...</style>` block verbatim → `backend/static/css/shifts.css` (path uses existing static root) and replace with `<link rel="stylesheet" href="{{ url_for('static', filename='css/shifts.css') }}?v=1">` comment-tagged `<!-- shifts-split-css -->`.
3. Locate the LARGE inline `<script>` after the data scripts (identified as the first `<script>` tag WITHOUT `id=` and without `src=` following `id="employees-data"` script) → write to `backend/static/js/shifts.js` and replace with `<script src="{{ url_for('static', filename='js/shifts.js') }}?v=1"></script>` annotated `<!-- shifts-split-js -->`.
4. Writes backup file.
5. Supports flags:
  - `--dry-run`: Prints planned actions & byte counts; does not modify.
  - `--force`: Overwrites existing target files & re-applies replacements.
  - `--version N`: Set cache-bust query value (default 1).
6. Validation pass after write: ensures link & script tags present and original blocks removed.
7. Exit codes: 0 success / 1 error (with message).

Invocation Examples:

```bash
python scripts/split_shifts_template.py --dry-run
python scripts/split_shifts_template.py --version 2
```

### Agent Handoff Checklist (Resume Point)

If returning later:

1. Check whether Phase 1 completed: open `shifts.html`; look for `<!-- shifts-split-css -->` & `<!-- shifts-split-js -->` markers.
2. If NOT done, run the script (dry-run first) then execute without `--dry-run`.
3. Verify browser loads: network panel shows `shifts.css` & `shifts.js` (cache-bust param).
4. Commit with message: `chore: split shifts template (phase 1)`.
5. Decide whether to proceed to Phase 2 modules (create empty plan section if starting).

### Time Off Risks & Mitigations

- Incorrect pattern match removes wrong script: mitigated by anchoring search AFTER employees-data script & requiring absence of `src=`.
- Duplicate run introduces duplicate includes: script checks sentinel comments before altering unless `--force`.
- Cache stale on Pi: version query param ensures new fetch.

### Success Criteria

- File length of `shifts.html` reduced by >60% in Phase 1.
- No functional diffs (manual smoke: open calendar, create shift, open menu, wizards).
- Lighthouse / console shows zero new JS errors.

Status: Phase 1 NOT YET RUN (script added – ready). Proceed when convenient.

### Phase 2 (JS Modularization) – Completed (Aug 2025)

Split monolithic `static/js/shifts.js` into ordered modules:

- `shifts.utils.js` (globals, data bootstrap, helpers, dark mode, fetch wrapper)
- `shifts.calendar.js` (month/week rendering, legend, navigation state)
- `shifts.wizard.js` (Create Shift wizard + inline date picker, repeat controls)
- `shifts.menu.js` (selection mode, context menu, coverage settings, swap/delete)
- `shifts.edit.js` (Edit Series / Edit Day wizard scaffolding)

Template `shifts.html` updated to inject inline API endpoint map (`window.CARE_API`) before module script tags (cache-bust `?v=2`). Removed legacy `shifts.js`.

Post‑split validation checklist:

1. Hard refresh browser (bypass cache) – confirm no 404s for new module files.
2. Open calendar: ensure month/week toggle still works; legend populated.
3. Create Shift wizard opens & hides repeat weekday chips until toggled.
4. Context menu delete/swap still functional; selection mode multi-delete works.
5. Edit Series wizard still launches from context menu (series shift) without losing currentShift state.
6. Coverage gap badge logic unchanged.

Next (optional Phase 3): Extract HTML partials (`_wizard_create.html`, `_wizard_edit_series.html`, `_wizard_edit_day.html`, `_shift_menu.html`, `_nav.html`) to reduce `shifts.html` further.

### Phase 3 (Template Partials) – Completed (Aug 2025)

Extracted large structural blocks from `shifts.html` into Jinja partials:

- `partials/_nav.html`
- `partials/_shift_menu.html` (with added aria-label on swap select)
- `partials/_wizard_create.html` (inline calendar role adjusted to group; repeat-until input labeled)
- `partials/_wizard_edit_series.html`
- `partials/_wizard_edit_day.html`

Replaced inline markup with `{% include %}` directives to further reduce template size and isolate future changes.

Validation checklist:

1. Hard refresh; ensure partial includes render (view source shows expanded HTML at runtime).
2. All wizard open/close flows work (create, edit series, edit day).
3. Context menu still functions (select, delete, swap).
4. No new console errors (ARIA adjustments applied where linter flagged issues).
5. Performance unchanged (server-side include is simple text substitution in Jinja).

Next (optional Phase 4 idea): Introduce Jinja macros for repeated time-select blocks to remove duplication and centralize AM/PM markup.

---

## Planned Feature: Caregiver Time Off (Vacation / Unavailability)

### Objective

Allow marking a caregiver as unavailable across one or more consecutive full days so schedulers avoid assigning shifts, and the calendar visibly communicates planned absences.

### In Scope (Phase 1–2)

- Full‑day unavailability spanning 1–30 consecutive days.
- Multiple non-overlapping time off records per caregiver.
- Read (GET), create (POST), delete (DELETE) operations.
- Calendar rendering (single day: pill; multi‑day: horizontal bar spanning dates) + legend entry.

### Out of Scope (Deferred)

- Partial‑day (hour-level) time off.
- Edit (PATCH) endpoint (delete + recreate as workaround initially).
- Bulk import / accrual balances / approval workflow.
- Automatic shift removal or re-assignment.

### Data Model

Table: `time_off`

| Column       | Type    | Notes |
|--------------|---------|-------|
| id           | INTEGER | PK |
| employee_id  | INTEGER | FK employees(id) ON DELETE CASCADE |
| start_date   | TEXT    | ISO YYYY-MM-DD (inclusive) |
| end_date     | TEXT    | ISO YYYY-MM-DD (inclusive) |
| reason       | TEXT    | Optional short note (<=120 chars) |
| created_at   | TEXT    | DEFAULT CURRENT_TIMESTAMP |

Indexes:

- `idx_time_off_employee_start` (employee_id, start_date)

Overlap Rule: For a given employee, no two rows may overlap date ranges (inclusive). Enforced by validation query (NOT a UNIQUE index due to range logic).

### Backend Endpoints (Initial)

1. `GET /api/time_off?start=YYYY-MM-DD&end=YYYY-MM-DD`
  - Returns all time off rows intersecting the (start,end) window (defaults: month view range if omitted, or today±31d fallback).
1. `POST /api/time_off`
  - Body: `{ employee_id, start_date, end_date, reason? }`
  - Validations (see below). Returns created row `{ id, ... }`.
1. `DELETE /api/time_off/<id>`
  - 404 if not found; 204 on success.

Response Shape (row):

`{ "id": int, "employee_id": int, "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD", "reason": "..." | null }`

### Validation Rules

- Dates parse & `start_date <= end_date`.
- Span length limit (configurable; default 30 days) -> 400 on violation.
- Employee exists.
- Overlap check: reject with 409 if any existing row for employee intersects `[start_date, end_date]`:
  `SELECT 1 FROM time_off WHERE employee_id=? AND NOT(end_date < ? OR start_date > ?) LIMIT 1`.
- Reason length <=120 chars.

### Conflict Semantics (Phase 1)

- Time off does NOT auto-delete or block existing shifts; scheduling during time off is allowed but will later be flagged (Phase 3+). For now it is advisory.
- Creation of time off overlapping existing shifts is permitted (simplifies first release) but may be toggled later via policy flag.

### Frontend Integration Plan

Bootstrap Fetch (Phase 1):

- Extend existing calendar init to fetch time off for the rendered month once employees & shifts load.
- Cache by month key (e.g., `YYYY-MM`). On month navigation, fetch if cache miss.

Data Structure:

```js
window.CARE_TIME_OFF = [ /* rows */ ];
// Build per-day index: { 'YYYY-MM-DD': [rows...] }
```

Index Build:

For each row, loop inclusive from start_date to end_date (capped at reasonable 31-day guard) pushing row refs into `dayIndex[day]`.

### Rendering (Phase 2)

- Legend: add square / label "Time Off" (neutral color, e.g., #888 with diagonal stripe pattern or semi-transparent overlay respecting dark mode).
- Single-day: small rounded badge (distinct from shift pill styling; maybe outline only) appended within cell below shifts.
- Multi-day: CSS bar spanning horizontally across contiguous day cells (month view). Approach: Each day cell checks if row.start_date == day to create a bar element with `data-span` length; subsequent days detect continuation (row present but not start) and either skip or render continuation stub (simpler: render per-day pill first pass; upgrade to spanning bar once stable).
- Week view: similar but always contiguous; simpler horizontal bar across 7-day grid.

Phase 2 Minimum: Per-day discrete pill (start + subsequent days identical) — spanning bar is stretch goal (Phase 2b) to reduce complexity initially.

### User Flow (Phase 3)

Initial Creation UI (Minimum):

- Add "Add Time Off" button near "New Shift" (opens modal) OR a tab in existing wizard container (simpler: dedicated smaller modal).
- Fields: Employee select, Start Date, End Date (default = Start Date), Reason (optional, small text input), Submit.
- On success: close modal, update local structures & re-render visible days.

Deletion UI:

- Clicking a time off pill opens a tiny popover with details + "Delete".

### Phased Rollout

| Phase | Deliverables |
|-------|--------------|
| 1 | DB migration + model, endpoints (GET/POST/DELETE), backend validation, basic tests |
| 2 | Calendar fetch + per-day pill rendering + legend entry |
| 2b (opt) | Multi-day spanning bar styling (month/week) |
| 3 | Create/Delete UI modal + inline popover delete |
| 4 | Conflict highlighting (shifts overlapping time off tinted / exclamation icon) |
| 5 | Edit (PATCH) + partial-day + reporting (per-employee upcoming time off, hours impact) |

### Testing Strategy

- Unit: overlap validator queries (edge cases: abutting ranges, identical, nested, large spans, limit breach).
- API: create, duplicate overlap (expect 409), delete then recreate, max span enforcement, reason length.
- Calendar: month navigation triggers single GET per month (cache), DOM contains expected pill count for known fixtures.
- Accessibility: modal focus trap; pill has aria-label ("Time off: Employee Name Start to End").

### Risks & Mitigations

- Rendering clutter if many overlapping time off entries: mitigate via stacking limit + "+N" overflow indicator (defer if low incidence).
- Large spans ( >30d ) degrade per-day indexing: enforce length cap.
- Date iteration performance: safe (<=31 days * entry count); optimize later if needed.

### Future Enhancements

- Supervisor approval workflow + status field (pending/approved/denied).
- Partial-day (start_time/end_time) for appointments.
- Export time off to ICS; include in hours report (deductions / PTO tracking).
- Policy enforcement: block shift creation overlapping time off (toggleable).
- Bulk creation (e.g., holidays) for all caregivers.

### Implementation Notes (Dev Handoff)

Migration: Add table creation in existing init_db; ensure idempotent (CREATE TABLE IF NOT EXISTS). Safe to run on Pi before endpoints are used.
Security: Reuse existing auth decorator; same session requirements as shift APIs.
Failure Codes: 400 (validation), 404 (delete not found), 409 (overlap), 500 (unexpected).
Logging: Log POST with employee_id and span for traceability.

---
