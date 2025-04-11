# Care Calendar: Fixing the Repeating Weekly Shifts Feature

## Task Overview

We've implemented a "repeating weekly shifts" feature in our Care Calendar application, but it's not working correctly. The feature allows users to create shifts that repeat weekly until a specified end date, but currently, the recurring shifts are not appearing on subsequent weeks.

Your task is to debug and fix this issue. The code for creating recurring shifts is in place, but something is preventing the shifts from appearing on future weeks.

## Important Note

**DO NOT run any npm commands yourself.** The project owner will handle all npm commands, database resets, and application restarts. Focus solely on code analysis and modifications.

## Getting Started

1. **Review the Documentation:**
   - Read `FEATURE-SUMMARY.md` for an overview of the feature and known issues
   - Read `IMPLEMENTATION-NOTES.md` for implementation details
   - Read `DEBUGGING-GUIDE.md` for specific debugging steps
   - Check `ROADMAP.md` to understand where this feature fits in the project

2. **Understand the Code Structure:**
   - The main backend logic is in `backend/src/controllers/scheduleController.js`
   - The frontend UI is in `src/components/schedule/EnhancedAddShiftModal.tsx`
   - The data types are defined in `src/types/index.ts`
   - The API service is in `src/services/core/APIService.ts`

3. **Focus on These Key Areas:**

   a. **Shift Creation Logic (scheduleController.js):**
   - Examine the `createShift` function (around line 300)
   - Pay special attention to the recurring shift creation logic (around line 400-450)
   - Check the date calculations for future weeks
   - Verify the transaction handling

   b. **Week Creation Logic:**
   - Look at how future weeks are created for recurring shifts
   - Check if the weeks are being created with the correct date ranges

   c. **Data Retrieval Logic:**
   - Examine the `getShiftsByWeek` function (around line 150)
   - Check if it's correctly retrieving shifts for a given week

   d. **Frontend Display:**
   - Look at `EnhancedScheduleGrid.tsx` to see how shifts are displayed
   - Check if there's any filtering that might be excluding recurring shifts

## Debugging Approach

1. **Add Logging Statements:**
   - Add detailed logging in the createShift function to track:
     - The values of isRecurring and recurringEndDate
     - The date calculations for future weeks
     - The creation of future shifts

2. **Check Database State:**
   - Ask the project owner to run SQL queries to check:
     - If the shifts table has the correct schema
     - If recurring shifts are being created in the database
     - If future weeks are being created correctly

3. **Test with Direct API Calls:**
   - Ask the project owner to use curl or Postman to test API endpoints directly
   - Check if the API returns recurring shifts for future weeks

4. **Potential Issues to Look For:**

   a. **Date Calculation Issues:**
   - Off-by-one errors in the date calculations
   - Incorrect mapping of day index to day of week
   - Timezone issues affecting date comparisons

   b. **Transaction Issues:**
   - Errors causing the transaction to roll back
   - Missing await statements in async code

   c. **Week Creation Issues:**
   - Logic errors in finding or creating future weeks
   - Incorrect date ranges for weeks

   d. **UI Display Issues:**
   - Filtering that excludes recurring shifts
   - Issues with how shifts are rendered

## Communication Protocol

1. **When You Find Issues:**
   - Document the issue clearly
   - Explain the root cause
   - Propose a specific fix

2. **When You Make Changes:**
   - Explain what you changed and why
   - Highlight any potential side effects
   - Suggest how to test the changes

3. **If You Need More Information:**
   - Specify exactly what information you need
   - Explain why it's needed
   - Suggest how to obtain it (e.g., specific SQL queries)

## Testing Your Changes

After making changes, ask the project owner to:

1. Reset the database: `./backend/reset-db.sh`
2. Start the application: `npm run dev:all`
3. Create a new shift with "Repeats Weekly" checked
4. Navigate to future weeks to verify the shift appears
5. Delete one of the recurring shifts to verify all related shifts are deleted

## Success Criteria

Your solution will be considered successful when:

1. A shift created with "Repeats Weekly" checked appears on all subsequent weeks until the end date
2. Deleting any shift in a recurring series deletes all related shifts
3. The application handles edge cases gracefully (e.g., recurring shifts that span multiple years)
4. The code is clean, well-documented, and follows the project's coding standards

Good luck with fixing the repeating weekly shifts feature! The project owner is available to answer questions and run commands as needed.
