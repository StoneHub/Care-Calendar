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
