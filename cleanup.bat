@echo off
echo Cleaning up deprecated files...

REM Remove utility files
del /Q src\utils\dateUtils.ts
echo Removed dateUtils.ts

REM Remove service files
del /Q src\services\api.ts
echo Removed api.ts

REM Remove hook files
del /Q src\hooks\useSchedule.ts
del /Q src\hooks\useWeeks.ts
del /Q src\hooks\useUIState.ts
echo Removed deprecated hooks

REM Remove component files
del /Q src\components\schedule\AddShiftModal.tsx
del /Q src\components\schedule\ScheduleGrid.tsx
del /Q src\components\schedule\WeekSelector.tsx
del /Q src\pages\CareSchedulerPage.tsx
echo Removed deprecated components

echo Cleanup complete!
echo Note: The hooks/index.ts file has already been updated to export useScheduleContext.
pause
