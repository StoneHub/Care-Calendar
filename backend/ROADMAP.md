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

### Risks & Mitigations

- Incorrect pattern match removes wrong script: mitigated by anchoring search AFTER employees-data script & requiring absence of `src=`.
- Duplicate run introduces duplicate includes: script checks sentinel comments before altering unless `--force`.
- Cache stale on Pi: version query param ensures new fetch.

### Success Criteria

- File length of `shifts.html` reduced by >60% in Phase 1.
- No functional diffs (manual smoke: open calendar, create shift, open menu, wizards).
- Lighthouse / console shows zero new JS errors.

Status: Phase 1 NOT YET RUN (script added – ready). Proceed when convenient.

---
