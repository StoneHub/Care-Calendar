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

/**
 * Converts a backend shift to frontend shift format
 */
export function mapShiftFromBackend(backendShift: ShiftBackend): Shift {
  return {
    id: backendShift.id,
    caregiver: backendShift.caregiver_name,
    start: backendShift.start_time,
    end: backendShift.end_time,
    status: backendShift.status,
    caregiver_id: backendShift.caregiver_id,
    week_id: backendShift.week_id,
    day: backendShift.day_of_week
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
    status: shift.status
  };
}

/**
 * Converts a backend caregiver to frontend format
 */
export function mapCaregiverFromBackend(backendCaregiver: CaregiverBackend): Caregiver {
  return {
    id: backendCaregiver.id,
    name: backendCaregiver.name,
    hours: backendCaregiver.hours_per_week,
    availability: backendCaregiver.availability,
    role: backendCaregiver.role
  };
}

/**
 * Converts a frontend caregiver to backend format
 */
export function mapCaregiverToBackend(caregiver: Caregiver): CaregiverBackend {
  return {
    id: caregiver.id,
    name: caregiver.name,
    hours_per_week: caregiver.hours,
    availability: caregiver.availability,
    role: caregiver.role
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
export function organizeShiftsByDay(shifts: ShiftBackend[]): WeeklySchedule {
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
  if (!shifts || !Array.isArray(shifts) || shifts.length === 0) {
    console.log('No shifts to organize, returning empty schedule');
    return schedule as WeeklySchedule;
  }
  
  // Group shifts by day
  shifts.forEach(shift => {
    const frontendShift = mapShiftFromBackend(shift);
    const day = shift.day_of_week;
    
    // Ensure day is valid
    if (days.includes(day as DayName)) {
      schedule[day as DayName]!.push(frontendShift);
    } else {
      console.warn(`Ignoring shift with invalid day: ${day}`, shift);
    }
  });
  
  console.log('Organized schedule:', schedule);
  return schedule as WeeklySchedule;
}