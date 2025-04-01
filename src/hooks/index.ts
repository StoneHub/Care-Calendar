export * from './useTeam';
// The following hooks have been replaced by ScheduleContext:
// export * from './useSchedule';
// export * from './useUIState';
// export * from './useWeeks';

// Import the ScheduleContext hook instead
export { useScheduleContext } from '../context/ScheduleContext';