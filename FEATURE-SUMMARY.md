# Repeating Weekly Shifts Feature

## Implementation Summary

We've implemented the "repeating weekly" feature for shifts in the Care Calendar application. This feature allows users to create shifts that repeat weekly until a specified end date (defaulting to the end of the calendar year).

### Changes Made

1. **Frontend Changes**:
   - Added "Repeats Weekly" checkbox to the Add Shift modal
   - Added "Repeat Until" date picker when the checkbox is selected
   - Updated the shift data structure to include recurring information

2. **Backend Changes**:
   - Updated the database schema to support recurring shifts
   - Modified the `createShift` endpoint to handle recurring shifts
   - Enhanced the `deleteShift` endpoint to delete all related recurring shifts

3. **Type Updates**:
   - Updated the `NewShiftData` interface to include recurring fields
   - Removed `hours_per_week` field from `Caregiver` interface

4. **API Service Updates**:
   - Updated the API service to properly map frontend recurring fields to backend format

### Files Modified

- `src/components/schedule/EnhancedAddShiftModal.tsx`
- `backend/src/controllers/scheduleController.js`
- `src/types/index.ts`
- `src/services/core/APIService.ts`
- `backend/src/controllers/teamController.js`
- `src/components/team/CaregiverModal.tsx`

## Current Status

The repeating weekly shifts feature has been partially implemented but is not functioning correctly. While the UI changes and database schema updates are in place, the recurring shifts are not appearing on subsequent weeks as expected.

### Known Issues

1. **Database Schema Issue:**
   - The database schema needs to be reset to include the new columns for recurring shifts (`is_recurring`, `recurring_end_date`, and `parent_shift_id`)
   - When attempting to create a recurring shift without the proper schema, the application shows no error but the shift is not created with recurring properties

2. **Recurring Shifts Not Appearing:**
   - Even after resetting the database, the recurring shifts are not showing up on subsequent weeks
   - The code in `scheduleController.js` appears to create the recurring shifts, but they are not visible in the UI
   - Possible issues:
     - The recurring shifts might not be properly linked to their parent shift
     - There might be an issue with how the future weeks are being created
     - The UI might not be correctly displaying shifts from auto-generated weeks
     - The date calculations for recurring shifts might be incorrect

### Resolution Steps

To fix the issue:

1. Reset the database using the provided script:
   ```bash
   cd backend
   ./reset-db.sh
   ```

2. This will:
   - Remove the existing database file
   - Run the database setup script which includes the new schema
   - Set up the history and unavailability tables

3. After resetting the database, restart the application:
   ```bash
   npm run dev:all
   ```

## Testing the Feature

To test the "repeating weekly" shifts feature:

1. Start the application after resetting the database
2. Navigate to the Schedule view in the application
3. Click the "+" button to add a new shift
4. Fill in the shift details:
   - Select a week
   - Choose a day
   - Select a caregiver
   - Check the "Repeats Weekly" checkbox
   - Optionally modify the "Repeat Until" date (defaults to end of year)
   - Set the start and end times
   - Click "Add Shift"
5. The shift will be created for the selected day and will repeat weekly until the specified end date
6. To verify:
   - Navigate through the weeks using the week selector
   - You should see the same shift appearing on the same day of each week

## Behavior Notes

- When a recurring shift is created, it generates shifts for all weeks up to the end date
- If a week doesn't exist in the system, it will be automatically created
- Deleting any shift in a recurring series will delete all related shifts
- The recurring relationship is tracked using the `parent_shift_id` field in the database

## Future Enhancements (Not Implemented)

- Edit all occurrences of a recurring shift
- Edit only future occurrences
- Edit a single occurrence while keeping others unchanged
