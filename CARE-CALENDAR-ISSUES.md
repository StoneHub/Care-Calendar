# Care Calendar Project Issues and Handoff Documentation

## Critical Issues Overview

This document outlines the major issues with the Care Calendar application to facilitate handoff to another engineer. The primary issues are:

1. **Week Navigation Inconsistency**: When navigating between weeks using next/previous buttons, the calendar doesn't consistently move by full 7-day weeks.
2. **Current Day Highlighting**: The "current day" highlight on the week view is incorrectly marking days that aren't today.
3. **Add Shift Dialog Issues**: The dialog has usability issues with day selection and isn't properly submitting shifts.
4. **API Integration Problems**: Shift creation and management API calls are failing silently without proper error handling.

## Core Files and Components

### Data Structure & Types
**File**: `/src/types/index.ts`

Contains all TypeScript interfaces and types for the application, including:
- `Week`: Represents a calendar week (id, start_date, end_date, is_published, notes)
- `DayName`: Type alias for days ("monday" to "sunday")
- `Shift`: Represents a work shift with caregiver, time, status
- `WeeklySchedule`: Record mapping DayName to Shift arrays
- `Caregiver`: Team member data structure

### Date Utilities
**File**: `/src/utils/dateUtils.ts`

Contains date manipulation and formatting functions:
- `formatDayTitle`: Calculates day headers based on week selection (has issues)
- `dayNameToJsDay`: Maps day names to JavaScript day indices (Sunday=0, Monday=1, etc.)
- `getCurrentWeekRange`: Generates the current week range string
- `adjustTime`: Utility for time manipulation

### State Management Hooks

**File**: `/src/hooks/useWeeks.ts`

Manages week selection and navigation:
- Fetches all available weeks and the current week
- Maintains `selectedWeek` state 
- Handles week selection via `selectWeek` function
- Has issues maintaining proper week ordering during navigation

**File**: `/src/hooks/useSchedule.ts` 

Manages schedule data and operations:
- Fetches and organizes shift data based on selected week
- Handles shift actions (add, drop, swap, adjust)
- Has issues with API integration and error handling
- Contains the failing `addShift` function

**File**: `/src/hooks/useUIState.ts`

Manages UI state like:
- Active tab (schedule, team, notifications)
- Modal visibility and type
- Navigation between views

### Components

**File**: `/src/pages/CareSchedulerPage.tsx`

Main page component that:
- Integrates all hooks and manages state flow
- Contains `handleWeekNavigation` function with bugs
- Manages tab switching and modal visibility
- Handles shift operations via dialog components

**File**: `/src/components/schedule/ScheduleGrid.tsx`

Renders the weekly schedule grid:
- Displays shifts organized by day
- Uses correct day order but has issues with date calculation

**File**: `/src/components/schedule/DayHeader.tsx`

Displays the day name and date number:
- Uses `formatDayTitle` function which has calculation issues
- Incorrectly marks days as "today" in some cases

**File**: `/src/components/schedule/AddShiftModal.tsx`

Dialog for adding shifts:
- Missing date display in day dropdown (only shows day names)
- Form submission fails silently
- Has issues with week selection and API integration

## Detailed Issue Analysis

### 1. Week Navigation Issues

#### Problem Description
When clicking "next week" or "previous week", the calendar doesn't consistently move by full 7-day weeks. It sometimes shifts by only 1 day on first click, then jumps by 6-7 days on subsequent clicks.

#### Root Causes
1. **Week Sorting Inconsistency**: 
   - In `useWeeks.ts`, the weeks aren't consistently sorted by date
   - In `CareSchedulerPage.tsx`, the `handleWeekNavigation` function sorts weeks again but might not match the same sorting

2. **Date Calculation Errors**:
   - In `dateUtils.ts`, the `formatDayTitle` function has logic issues when calculating dates from week start
   - The day-to-index mapping sometimes causes off-by-one errors

#### Affected Code
- **`src/hooks/useWeeks.ts`** - Week selection and ordering logic
- **`src/pages/CareSchedulerPage.tsx`** - `handleWeekNavigation` function (lines 102-169)
- **`src/utils/dateUtils.ts`** - `formatDayTitle` function (lines 14-50)

### 2. Current Day Highlighting Issue

#### Problem Description
The calendar incorrectly highlights days as "today" when viewing weeks other than the current week.

#### Root Causes
1. **Incorrect IsToday Calculation**:
   - In `formatDayTitle`, the function doesn't properly account for selected week when determining if a day is "today"
   - The `isToday` flag isn't properly filtered based on whether we're viewing the current week

#### Affected Code
- **`src/utils/dateUtils.ts`** - `formatDayTitle` function (lines 14-50)
- **`src/components/schedule/DayHeader.tsx`** - highlighting logic (lines 25-30)

### 3. Add Shift Dialog Issues

#### Problem Description
1. The day dropdown only shows day names without dates
2. The dialog doesn't allow clicking directly on a day in the calendar to add a shift to that day
3. Shift submission is failing silently without proper error messages
4. Week selection in the dialog has issues

#### Root Causes
1. **UI Design Limitations**:
   - The day dropdown in `AddShiftModal.tsx` only displays day names without dates
   - No quick-add functionality from the calendar grid itself

2. **API Integration Issues**:
   - In `useSchedule.ts`, the `addShift` function doesn't properly handle API errors
   - Silent failures without showing proper error messages to users

#### Affected Code
- **`src/components/schedule/AddShiftModal.tsx`** - Dialog component (lines 14-278)
- **`src/hooks/useSchedule.ts`** - `addShift` function (lines 303-367)
- **`src/services/api.ts`** - `createShift` method (lines 63-66)

### 4. API Integration Problems

#### Problem Description
API calls for shift operations (add, drop, swap, adjust) are failing without proper error handling or user feedback.

#### Root Causes
1. **Incomplete Error Handling**:
   - Many API calls don't have proper try/catch blocks
   - Error messages aren't properly displayed to users
   - Console logging instead of proper user-facing error handling

2. **Data Conversion Issues**:
   - When sending shift data to the API, there's inconsistency between frontend and backend data structures
   - Property naming differences between UI models and API models

#### Affected Code
- **`src/hooks/useSchedule.ts`** - API integration methods
- **`src/services/api.ts`** - API service methods
- **`src/utils/mappers.ts`** - Data transformation functions

## Recommended Fixes

### 1. Week Navigation

1. **Fix the week sorting**:
   - Ensure weeks are properly sorted by start date in `useWeeks.ts`
   - Add a unit test to validate week ordering

2. **Fix date calculation**:
   - Completely rewrite the `formatDayTitle` function to correctly calculate dates based on selected week
   - Add validation to ensure the function handles edge cases correctly
   - Add unit tests for this critical function

### 2. Current Day Highlighting

1. **Fix the isToday calculation**:
   - Update `formatDayTitle` to properly check if a date is today based on actual date, not just day of week
   - Only allow "today" highlighting when viewing the current week

### 3. Add Shift Dialog

1. **Improve the UI**:
   - Add dates to the day dropdown values
   - Implement a click-on-day-to-add-shift functionality 
   - Better form validation with clear error messages

2. **Fix form submission**:
   - Add proper error handling and display in the modal
   - Add loading states during submission
   - Log detailed API errors for debugging

### 4. API Integration

1. **Improve error handling**:
   - Add proper try/catch blocks for all API calls
   - Create a standardized error handling approach
   - Show user-friendly error messages

2. **Fix data mapping**:
   - Update the data transformation functions to properly map between frontend and backend models
   - Add validation to ensure data consistency

## Logging and Debugging

A logger utility has been implemented in `/src/utils/logger.ts` to help with debugging. Use the "View Logs" button at the bottom of the screen during development to see detailed logs from:

- Week navigation operations
- Shift management operations
- API calls and responses
- Form submissions

This logging system is a crucial tool for diagnosing the issues outlined above.

## Additional Engineering Concerns

1. **Test Coverage**: The application lacks proper unit and integration tests, making it difficult to validate fixes.
2. **Data Consistency**: The relationship between weeks, shifts, and caregivers needs better validation.
3. **Performance**: The application might have performance issues with larger datasets.
4. **Accessibility**: The current UI doesn't properly address accessibility concerns.
5. **Mobile Responsiveness**: The calendar view needs improvement for smaller screens.

## Conclusion

The Care Calendar application has several critical issues centered around date handling, week navigation, and API integration. The most immediate concerns are the week navigation inconsistency and the non-functioning add shift dialog. Focus on these issues first, as they directly impact core functionality. The logging system added to the application will help diagnose the exact causes during live operation.