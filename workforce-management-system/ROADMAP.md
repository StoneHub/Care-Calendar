# Care Calendar: Enhanced Experience & Accessibility Development Plan

## Overview

This plan tracks upgrades to repeating weekly shifts, interactive calendar UI, coverage gap detection, swaps, and reporting.

## Implementation Status (Aug 2025)

### Completed

- Repeating weekly shifts with optional end date and weekday selection (backend, idempotent insert guard).
- Batch selection and deletion of shifts (list view, retained temporarily for safety).
- Interactive calendar: month view with current-week highlight, legend, and per-employee colors.
- Click-to-act menu on shifts: delete single, delete entire series, and swap caregiver.
- End time support with validation (end > start) and serialization.
- Coverage gap highlighting for 09:00–21:00 window per day in month view.
- Deleting an employee deletes their shifts (soft cascade).
- Weekly hours report per employee (/hours) with nav links.
- Consistent header/navigation links on index and shifts pages.

### In Progress

- Remove legacy shift list table fully and rely solely on calendar view after validation on low-power devices.
- Performance tuning of month grid for Raspberry Pi 2B (DOM diffing, reduce reflows, optional week-only mode).
- Recurrence management: edit series metadata (UI), prevent duplicates (backend guard done).

### Next

- Add hours report link to other pages for full consistency.
- Add optional .gitattributes for line-ending normalization.
- Export weekly hours CSV.
