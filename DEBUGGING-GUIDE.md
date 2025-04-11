# Debugging Guide for Repeating Weekly Shifts

This guide provides steps and suggestions for debugging the issue with repeating weekly shifts not appearing on subsequent weeks in the Care Calendar application.

## Current Issue

The repeating weekly shifts feature is partially implemented but not functioning correctly. When a user creates a shift with the "Repeats Weekly" checkbox selected, the shift is created for the current week but does not appear on subsequent weeks as expected.

## Debugging Steps

### 1. Verify Database Schema

First, ensure the database has the correct schema with the necessary columns for recurring shifts:

```bash
cd backend
sqlite3 db/care_calendar.sqlite3 ".schema shifts"
```

The shifts table should have the following columns:
- `is_recurring` (boolean)
- `recurring_end_date` (date)
- `parent_shift_id` (integer)

If these columns are missing, reset the database:

```bash
./reset-db.sh
```

### 2. Check Shift Creation Logic

The issue might be in the shift creation logic in `scheduleController.js`. Here's what to check:

1. **Examine the createShift function (around line 300):**
   - Verify that `isRecurring` and `recurringEndDate` are being correctly passed from the frontend
   - Check that the original shift is being created with `is_recurring` set to true
   - Ensure the transaction is committing successfully

2. **Examine the recurring shift creation logic (around line 400-450):**
   - Check the date calculations for future weeks
   - Verify that future weeks are being created correctly
   - Ensure recurring shifts are being created with the correct `parent_shift_id`

3. **Add logging statements:**
   ```javascript
   logger.debug('Creating recurring shift', {
     isRecurring,
     recurringEndDate,
     firstShiftDate: firstShiftDate.toISOString(),
     endDate: endDate.toISOString(),
     dayIndex,
     day_of_week
   });
   ```

### 3. Verify Data in the Database

After creating a recurring shift, check if the shifts are actually being created in the database:

```bash
cd backend
sqlite3 db/care_calendar.sqlite3 "SELECT id, week_id, day_of_week, is_recurring, parent_shift_id FROM shifts;"
```

Look for:
- The original shift with `is_recurring = 1`
- Multiple shifts with the same `day_of_week` but different `week_id`
- Child shifts with `parent_shift_id` set to the ID of the original shift

### 4. Check Week Creation

Verify that future weeks are being created correctly:

```bash
sqlite3 db/care_calendar.sqlite3 "SELECT id, start_date, end_date FROM weeks ORDER BY start_date;"
```

### 5. Debug Frontend Display

If the shifts are being created in the database but not displaying in the UI:

1. **Check the getShiftsByWeek function (around line 150):**
   - Ensure it's retrieving all shifts for a given week, including recurring ones

2. **Examine the EnhancedScheduleGrid.tsx component:**
   - Check how it's fetching and displaying shifts for the selected week
   - Add console.log statements to see what data is being received from the API

3. **Check the network requests in the browser:**
   - When navigating to a different week, verify the API call to get shifts
   - Examine the response to see if recurring shifts are included

### 6. Test with Direct API Calls

Use a tool like Postman or curl to directly call the API endpoints:

```bash
# Get all weeks
curl http://localhost:3001/api/schedule/weeks

# Get shifts for a specific week (replace WEEK_ID with an actual week ID)
curl http://localhost:3001/api/schedule/weeks/WEEK_ID/shifts
```

### 7. Potential Fixes

Based on the debugging results, here are some potential fixes:

1. **Date Calculation Issues:**
   - Check for off-by-one errors in the date calculations
   - Ensure the day index is correctly mapped to the day of week

2. **Transaction Issues:**
   - Make sure all database operations are within the transaction
   - Check for any errors that might be causing the transaction to roll back

3. **Week Creation Issues:**
   - Verify the logic for finding or creating future weeks
   - Ensure weeks are being created with the correct date ranges

4. **UI Display Issues:**
   - Update the UI components to properly display recurring shifts
   - Add visual indicators for recurring shifts

## Testing Your Fix

After making changes:

1. Reset the database: `./backend/reset-db.sh`
2. Start the application: `npm run dev:all`
3. Create a new shift with "Repeats Weekly" checked
4. Navigate to future weeks to verify the shift appears
5. Delete one of the recurring shifts to verify all related shifts are deleted

## Additional Resources

- [Knex.js Documentation](https://knexjs.org/) - For database query issues
- [React DevTools](https://react.dev/learn/react-developer-tools) - For debugging React components
- [SQLite Documentation](https://www.sqlite.org/docs.html) - For direct database queries
