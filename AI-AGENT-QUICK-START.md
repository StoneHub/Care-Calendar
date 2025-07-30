# AI Agent Quick Start Guide

## What is Care Calendar?
A locally hosted React/Express.js application for coordinating family caregiver schedules. Designed for Raspberry Pi deployment with smart fridge/tablet access.

## Current Critical Issue
**Repeating Weekly Shifts not working** - shifts created with "Repeats Weekly" don't appear on subsequent weeks despite backend logic being implemented.

## Project Status at a Glance
- ✅ **Working**: Team management, single shifts, dark mode, local network access, unavailability tracking
- 🔥 **Broken**: Repeating weekly shifts (main issue to fix)
- 🔄 **In Progress**: Backend migration from SQLite to LowDB for Pi 2B compatibility

## Quick Setup
```bash
# Essential commands only
npm install && npm run backend:install
npm run backend:setup-db && npm run backend:seed-db
npm run dev:all  # Start both frontend (5173) and backend (3001)
```

## Key Files for Current Issue
1. **`backend/src/controllers/scheduleController.js`** - Contains recurring shift creation logic (line ~400)
2. **`src/components/schedule/EnhancedAddShiftModal.tsx`** - UI for creating recurring shifts
3. **`src/types/index.ts`** - Type definitions for recurring shift data
4. **`src/services/core/APIService.ts`** - API service mapping frontend to backend

## Debugging the Recurring Shifts Issue
The issue is likely in one of these areas:
1. **Date calculations** - Week date ranges or day-of-week mapping
2. **Database transactions** - Rollback preventing recurring shifts from saving
3. **Week creation logic** - Future weeks not being created properly
4. **UI filtering** - Frontend not displaying existing recurring shifts

### Quick Debug Steps
```bash
# Check if shifts are in database
curl http://localhost:3001/api/debug/db

# View backend logs
curl http://localhost:3001/api/debug/logs

# Reset database if needed
cd backend && bash reset-db.sh
```

## Database Schema (Key Tables)
```sql
shifts: id, week_id, day_of_week, caregiver_id, start_time, end_time, 
        is_recurring, recurring_end_date, parent_shift_id

weeks: id, start_date, end_date

team_members: id, name, role, is_active
```

## Architecture Overview
- **Frontend**: React + TypeScript + Vite + Tailwind
- **Backend**: Express.js + SQLite (migrating to LowDB)
- **Real-time**: Socket.io
- **State**: React Context (ScheduleContext)

## Essential Documentation Files
- **README.md** - Project overview and setup
- **FEATURE-SUMMARY.md** - Detailed feature status and known issues
- **DEBUGGING-GUIDE.md** - Specific debugging steps for recurring shifts
- **IMPLEMENTATION-NOTES.md** - Backend migration details

## Code Quality Status
⚠️ **Critical**: The project currently has 17 TypeScript errors that prevent building and 64 ESLint errors. The application runs in development but cannot be built for production. Priority should be given to fixing TypeScript errors before adding new features.

**Key TypeScript Issues:**
- `hours` property referenced but removed from Caregiver interface
- Unused variables and imports throughout codebase
- Missing type definitions (extensive use of `any` type)

## Code Style
- 2 spaces indentation
- PascalCase for components, camelCase for functions
- Minimal changes approach - surgical fixes only
- TypeScript required, run `npm run typecheck`

## Testing Approach
1. **Create recurring shift**: Use UI with "Repeats Weekly" checked
2. **Navigate weeks**: Use week selector to check future weeks
3. **Verify database**: Check if recurring shifts exist in DB
4. **Test deletion**: Ensure deleting one recurring shift removes all

## Success Criteria
- Shift with "Repeats Weekly" appears on all subsequent weeks until end date
- Deleting any recurring shift removes all related shifts
- No errors in browser console or backend logs
- Database contains correct recurring shift records

## Emergency Commands
```bash
npm run backend:reset    # Reset database (destructive)
npm run typecheck        # Check TypeScript errors
npm run lint            # Check code style
```

---
**Remember**: This is production software that families use daily. Test thoroughly and make minimal changes.