# Implementation Notes for Care Calendar

## Current Project Status

The Care Calendar application has been updated to support repeating weekly shifts. This document provides context for the next developer working on this project.

## Recent Changes

### 1. Repeating Weekly Shifts Feature

We've implemented the ability to create shifts that repeat weekly until a specified end date. The implementation includes:

- Frontend UI changes to add a "Repeats Weekly" checkbox and date picker
- Backend schema updates to support recurring shifts
- API service updates to handle the new data structure

### 2. Database Schema Updates

The database schema has been updated to include:
- `is_recurring` (boolean) column in the shifts table
- `recurring_end_date` (date) column in the shifts table
- `parent_shift_id` (integer) column to track relationships between recurring shifts

### 3. Code Cleanup

We've also removed the unused `hours_per_week` field from:
- The `Caregiver` and `CaregiverBackend` interfaces in `src/types/index.ts`
- The team controller in `backend/src/controllers/teamController.js`
- The API service in `src/services/core/APIService.ts`
- The caregiver modal in `src/components/team/CaregiverModal.tsx`

## Known Issues

### 1. Database Schema Issue

The initial issue we encountered was that the database schema wasn't being updated to include the new columns for recurring shifts. This was because the migration wasn't being run on the existing database.

To resolve this, we created a reset-and-test.sh script that:
1. Resets the database using the backend/reset-db.sh script
2. Starts the application with npm run dev:all

### 2. Recurring Shifts Not Appearing

Even after resetting the database, there is still an issue with the repeating weekly shifts feature. The recurring shifts are not appearing on subsequent weeks as expected. After examining the code in `scheduleController.js`, there appear to be several potential issues:

#### Potential Issues in the Implementation:

1. **Week Creation Logic**: 
   - The code attempts to create future weeks for recurring shifts, but these weeks might not be properly created or linked.
   - In `scheduleController.js` around line 400-450, the code calculates dates for future weeks and creates them if they don't exist.
   - There might be an issue with the date calculations or the week creation process.

2. **Shift Creation for Future Weeks**:
   - After creating future weeks, the code creates shifts for those weeks.
   - These shifts are linked to the original shift via the `parent_shift_id` field.
   - There might be an issue with how these shifts are being created or linked.

3. **UI Display Issues**:
   - The UI might not be correctly displaying shifts from auto-generated weeks.
   - The `EnhancedScheduleGrid.tsx` component might need to be updated to handle recurring shifts.

4. **Data Retrieval Issues**:
   - When navigating to future weeks, the application might not be correctly retrieving the recurring shifts.
   - This could be due to issues with the API calls or how the data is being processed.

## Important Files

The key files for understanding the repeating weekly shifts feature are:

1. **Frontend:**
   - `src/components/schedule/EnhancedAddShiftModal.tsx` - Contains the UI for adding recurring shifts
   - `src/types/index.ts` - Contains the updated interfaces for shift data
   - `src/services/core/APIService.ts` - Handles mapping between frontend and backend data formats

2. **Backend:**
   - `backend/src/controllers/scheduleController.js` - Contains the logic for creating and managing recurring shifts
   - `backend/db/migrations/20250410100000_add_recurring_to_shifts.js` - Contains the migration for adding recurring columns
   - `backend/src/utils/setupDb.js` - Contains the schema setup for new installations

## Next Steps

The following tasks could be considered for future development:

1. **Enhance Recurring Shifts Management:**
   - Add ability to edit all occurrences of a recurring shift
   - Add ability to edit only future occurrences
   - Add ability to edit a single occurrence while keeping others unchanged

2. **Improve Error Handling:**
   - Add better error handling for database schema issues
   - Provide more informative error messages when operations fail

3. **UI Improvements:**
   - Add visual indicators for recurring shifts in the calendar view
   - Add a filter to show/hide recurring shifts

## Testing

To test the repeating weekly shifts feature:

1. Reset the database using `./backend/reset-db.sh`
2. Start the application using `npm run dev:all`
3. Create a new shift with the "Repeats Weekly" checkbox selected
4. Navigate through the weeks to verify the shift appears on the same day each week
5. Delete one of the recurring shifts to verify all related shifts are deleted

## Deployment Notes

When deploying this update to production:

1. Make sure to run the migration script to update the database schema
2. If the migration fails, consider backing up the data and resetting the database
3. Test the recurring shifts feature thoroughly after deployment
