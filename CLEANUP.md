# Code Cleanup Guide

## Files Marked for Removal

The following files have been replaced by our new architecture and should be removed:

### Utility Files
- `src/utils/dateUtils.ts` - Replaced by `src/services/core/DateService.ts`

### Service Files
- `src/services/api.ts` - Replaced by `src/services/core/APIService.ts`

### Hook Files
- `src/hooks/useSchedule.ts` - Functionality moved to `src/context/ScheduleContext.tsx`
- `src/hooks/useWeeks.ts` - Functionality moved to `src/context/ScheduleContext.tsx`
- `src/hooks/useUIState.ts` - Functionality moved to `src/context/ScheduleContext.tsx`

### Component Files
- `src/components/schedule/AddShiftModal.tsx` - Replaced by `src/components/schedule/EnhancedAddShiftModal.tsx`
- `src/components/schedule/ScheduleGrid.tsx` - Replaced by `src/components/schedule/EnhancedScheduleGrid.tsx`
- `src/components/schedule/WeekSelector.tsx` - Replaced by `src/components/schedule/EnhancedWeekSelector.tsx`
- `src/pages/CareSchedulerPage.tsx` - Replaced by `src/pages/EnhancedCareSchedulerPage.tsx`

## Why These Files Can Be Removed

1. **DateUtils**: All date functionality has been centralized in the DateService, which provides a more comprehensive and reliable approach to date handling.

2. **API Service**: The new APIService includes improved error handling, retry logic, and request tracking.

3. **Hooks**: The separate hooks created a complex web of dependencies that led to bugs. The ScheduleContext centralizes all state management in one place.

4. **Components**: The enhanced versions of these components are designed to work with the new ScheduleContext and provide better error handling and user feedback.

## How to Remove

You can remove these files using:

```bash
# Remove utility files
rm src/utils/dateUtils.ts

# Remove service files
rm src/services/api.ts

# Remove hook files
rm src/hooks/useSchedule.ts
rm src/hooks/useWeeks.ts
rm src/hooks/useUIState.ts

# Remove component files
rm src/components/schedule/AddShiftModal.tsx
rm src/components/schedule/ScheduleGrid.tsx
rm src/components/schedule/WeekSelector.tsx
rm src/pages/CareSchedulerPage.tsx
```

## Remaining Dependencies

After removing these files, update any remaining imports in other files. The `src/hooks/index.ts` file may need to be updated to remove exports of the deleted hooks.
