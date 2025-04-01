# Care Calendar Testing Guide

After implementing our new architecture and removing the old code, it's important to test the application thoroughly to ensure everything works as expected. This guide will help you test the key functionality and validate that our changes have fixed the issues.

## Setup for Testing

1. First, run the cleanup script to remove obsolete files:
   ```bash
   # On Unix/Mac/Linux
   sh cleanup.sh
   
   # On Windows
   cleanup.bat
   ```

2. Start the application:
   ```bash
   # Start both frontend and backend
   npm run dev:all
   ```

## Test Cases

### 1. Week Navigation

**Issue Fixed:** Week navigation was inconsistent, sometimes jumping by irregular intervals.

**How to Test:**
1. Open the application and observe the current week
2. Click "Next Week" several times
   - Verify that each click moves forward by exactly one week
   - Watch the date ranges to confirm they're sequential
3. Click "Previous Week" several times
   - Verify that each click moves back by exactly one week
4. Click "Today" to return to the current week
   - Verify it correctly selects the current week

**Expected Result:** Navigation between weeks should be consistent and predictable, with each click moving by exactly one week.

### 2. Current Day Highlighting

**Issue Fixed:** The app was incorrectly highlighting days as "today" when viewing weeks other than the current week.

**How to Test:**
1. Navigate to the current week
   - Verify that today's date is highlighted
2. Navigate to next week
   - Verify that NO day is highlighted as "today"
3. Navigate to previous week
   - Verify that NO day is highlighted as "today"
4. Return to current week
   - Verify that today's date is highlighted again

**Expected Result:** "Today" highlight should only appear when viewing the current week, and only for the correct day.

### 3. Add Shift Dialog

**Issue Fixed:** The dialog had usability issues and wasn't properly submitting shifts.

**How to Test:**
1. Click the "Add Shift" button
2. In the modal:
   - Select a week (should default to current week)
   - Select a day
   - Select a caregiver
   - Set start time to 9:00 AM
   - Set end time to 5:00 PM
3. Click "Add Shift" button
4. Check if the shift appears on the calendar
5. Try creating an invalid shift (end time before start time)
   - Should see validation error message
   - Should not be able to submit

**Expected Result:** The shift should be successfully added to the calendar, and validation should prevent invalid shifts.

### 4. API Integration

**Issue Fixed:** API calls were failing silently without proper error handling.

**How to Test:**
1. Temporarily disconnect from the internet or stop the backend server
2. Try to perform an operation (like adding a shift)
3. Check if an appropriate error message is displayed
4. Reconnect to the internet or restart the backend
5. Try the operation again

**Expected Result:** When API calls fail, clear error messages should be displayed. When the connection is restored, operations should work correctly.

### 5. Direct Day Click for Adding Shifts

**Feature Added:** Ability to click directly on a day to add a shift.

**How to Test:**
1. Click on an empty day cell in the calendar
2. Verify that the Add Shift modal opens
3. Verify that the day is pre-selected in the modal
4. Complete the form and submit
5. Verify the shift appears on the correct day

**Expected Result:** Clicking on a day should open the Add Shift modal with that day pre-selected, streamlining the process of adding shifts.

### 6. Deleting Shifts

**Feature Added:** Improved shift deletion functionality.

**How to Test:**
1. Click on an existing shift
2. Verify the shift options modal opens
3. Click "Delete Shift"
4. Verify the shift is removed from the calendar

**Expected Result:** The shift should be deleted from the database and removed from the calendar.

## Error Handling Verification

Our new architecture includes improved error handling. To verify this:

1. Check the browser console for any errors during testing
2. Intentionally cause errors (disconnect network, submit invalid data)
3. Verify that appropriate error messages are displayed to the user
4. Verify that the application recovers gracefully when errors are resolved

## Performance Considerations

While testing, pay attention to the application's performance:

1. Does the UI remain responsive during API calls?
2. Are loading indicators shown appropriately?
3. Does week navigation feel smooth and immediate?

## Reporting Issues

If you encounter any issues during testing, please document:

1. The steps to reproduce the issue
2. What you expected to happen
3. What actually happened
4. Any error messages that appeared
5. Screenshots if possible

Add these details to a new issue in the project repository so they can be addressed in the next iteration.
