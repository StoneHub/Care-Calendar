import { 
  Shift, 
  ShiftBackend, 
  DayName, 
  Caregiver, 
  CaregiverBackend, 
  Notification,
  NotificationBackend,
  WeeklySchedule
} from '../types';
import { logger } from './logger';

/**
 * Converts a backend shift to frontend shift format
 */
export function mapShiftFromBackend(backendShift: ShiftBackend): Shift {
  // Log the backend shift for debugging
  logger.debug('Mapping shift from backend', {
    id: backendShift.id,
    day: backendShift.day_of_week,
    caregiver: backendShift.caregiver_name,
    is_recurring: backendShift.is_recurring,
    parent_shift_id: backendShift.parent_shift_id
  });
  
  return {
    id: backendShift.id,
    caregiver: backendShift.caregiver_name,
    start: backendShift.start_time,
    end: backendShift.end_time,
    status: backendShift.status,
    caregiver_id: backendShift.caregiver_id,
    week_id: backendShift.week_id,
    day: backendShift.day_of_week,
    // Include recurring information if available
    is_recurring: backendShift.is_recurring,
    recurring_end_date: backendShift.recurring_end_date,
    parent_shift_id: backendShift.parent_shift_id
  };
}

/**
 * Converts a frontend shift to backend format
 */
export function mapShiftToBackend(shift: Shift, weekId: number, day: DayName): Partial<ShiftBackend> {
  return {
    id: shift.id,
    week_id: weekId,
    day_of_week: day,
    caregiver_id: shift.caregiver_id,
    start_time: shift.start,
    end_time: shift.end,
    status: shift.status,
    is_recurring: shift.is_recurring,
    recurring_end_date: shift.recurring_end_date,
    parent_shift_id: shift.parent_shift_id
  };
}

/**
 * Converts a backend caregiver to frontend format
 */
export function mapCaregiverFromBackend(backendCaregiver: CaregiverBackend): Caregiver {
  return {
    id: backendCaregiver.id,
    name: backendCaregiver.name,
    availability: backendCaregiver.availability,
    role: backendCaregiver.role,
    is_active: backendCaregiver.is_active
  };
}

/**
 * Converts a frontend caregiver to backend format
 */
export function mapCaregiverToBackend(caregiver: Caregiver): CaregiverBackend {
  return {
    id: caregiver.id,
    name: caregiver.name,
    availability: caregiver.availability,
    role: caregiver.role,
    is_active: caregiver.is_active
  };
}

/**
 * Converts a backend notification to frontend format
 */
export function mapNotificationFromBackend(
  backendNotification: NotificationBackend, 
  caregiverMap: Record<number, string>
): Notification {
  return {
    id: backendNotification.id,
    type: backendNotification.type,
    from: caregiverMap[backendNotification.from_caregiver_id] || 'Unknown',
    date: backendNotification.date,
    time: backendNotification.time,
    message: backendNotification.message,
    status: backendNotification.status,
    from_caregiver_id: backendNotification.from_caregiver_id,
    affected_shift_id: backendNotification.affected_shift_id,
    week_id: backendNotification.week_id
  };
}

/**
 * Organizes shifts by day to create a weekly schedule
 */
export function organizeShiftsByDay(shifts: Shift[] | ShiftBackend[]): WeeklySchedule {
  const schedule: Partial<WeeklySchedule> = {};
  
  const days: DayName[] = [
    'monday', 'tuesday', 'wednesday', 'thursday', 
    'friday', 'saturday', 'sunday'
  ];
  
  // Initialize all days with empty arrays
  days.forEach(day => {
    schedule[day] = [];
  });
  
  // If there are no shifts, just return the empty schedule
  if (!shifts) {
    logger.debug('No shifts to organize (shifts is null/undefined), returning empty schedule');
    return schedule as WeeklySchedule;
  }

  // Log what we received
  logger.debug('Received shifts to organize', {
    isArray: Array.isArray(shifts),
    length: Array.isArray(shifts) ? shifts.length : 'not an array',
    sample: Array.isArray(shifts) && shifts.length > 0 ? shifts[0] : null,
    type: Array.isArray(shifts) && shifts.length > 0 ? (typeof shifts[0]) : 'unknown'
  });
  
  if (!Array.isArray(shifts) || shifts.length === 0) {
    logger.debug('No valid shifts array to organize, returning empty schedule');
    return schedule as WeeklySchedule;
  }
  
  try {
    // Group shifts by day
    shifts.forEach(shift => {
      // Check if shift is already in frontend format
      let frontendShift: Shift;
      let day: DayName;
      
      if ('caregiver' in shift) {
        // Already a frontend shift
        frontendShift = shift as Shift;
        day = frontendShift.day as DayName;
      } else {
        // Backend shift, convert it
        const backendShift = shift as ShiftBackend;
        frontendShift = mapShiftFromBackend(backendShift);
        day = backendShift.day_of_week;
      }
      
      // Ensure day is valid
      if (days.includes(day)) {
        schedule[day]!.push(frontendShift);
      } else {
        logger.warn(`Ignoring shift with invalid day: ${day}`, { shift });
      }
    });
    
    // Sort shifts by start time within each day
    days.forEach(day => {
      schedule[day] = schedule[day]!.sort((a, b) => {
        const aTime = a.start.replace(/[^0-9:]/g, '');
        const bTime = b.start.replace(/[^0-9:]/g, '');
        return aTime.localeCompare(bTime);
      });
    });
    
    logger.debug('Organized schedule by day', { 
      totalShifts: shifts.length,
      shiftsByDay: Object.entries(schedule).reduce((acc, [day, shifts]) => {
        acc[day] = shifts.length;
        return acc;
      }, {} as Record<string, number>)
    });
  } catch (error) {
    logger.error('Error organizing shifts by day', { 
      error: error instanceof Error ? error.message : String(error),
      shifts: shifts.length
    });
  }
  
  return schedule as WeeklySchedule;
}
