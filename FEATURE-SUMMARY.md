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

4. **API Service Updates**:
   - Updated the API service to properly map frontend recurring fields to backend format

### Files Modified

- `src/components/schedule/EnhancedAddShiftModal.tsx`
- `backend/src/controllers/scheduleController.js`
- `src/types/index.ts`
- `src/services/core/APIService.ts`

## Testing the Feature

To test the "repeating weekly" shifts feature:

1. Start the application using the WSL environment:
   ```bash
   ./start-wsl.sh
   ```

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
   - Try deleting one of the recurring shifts - all related shifts should be deleted

## Behavior Notes

- When a recurring shift is created, it generates shifts for all weeks up to the end date
- If a week doesn't exist in the system, it will be automatically created
- Deleting any shift in a recurring series will delete all related shifts
- The recurring relationship is tracked using the `parent_shift_id` field in the database

## Future Enhancements (Not Implemented)

- Edit all occurrences of a recurring shift
- Edit only future occurrences
- Edit a single occurrence while keeping others unchanged
