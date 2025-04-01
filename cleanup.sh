#!/bin/bash

# Cleanup script for removing old files that have been replaced

echo "Cleaning up deprecated files..."

# Remove utility files
rm -f src/utils/dateUtils.ts
echo "✓ Removed dateUtils.ts"

# Remove service files
rm -f src/services/api.ts
echo "✓ Removed api.ts"

# Remove hook files
rm -f src/hooks/useSchedule.ts
rm -f src/hooks/useWeeks.ts
rm -f src/hooks/useUIState.ts
echo "✓ Removed deprecated hooks"

# Remove component files
rm -f src/components/schedule/AddShiftModal.tsx
rm -f src/components/schedule/ScheduleGrid.tsx
rm -f src/components/schedule/WeekSelector.tsx
rm -f src/pages/CareSchedulerPage.tsx
echo "✓ Removed deprecated components"

echo "Cleanup complete!"
echo "Note: The hooks/index.ts file has already been updated to export useScheduleContext."
