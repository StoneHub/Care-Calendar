export type ShiftStatus = 
  | 'confirmed' 
  | 'requested-off' 
  | 'dropped' 
  | 'adjusted' 
  | 'swap-proposed';

export type DayName = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface Week {
  id: number;
  start_date: string;
  end_date: string;
  is_published: boolean;
  notes?: string;
}

export interface ShiftBackend {
  id: number;
  week_id: number;
  day_of_week: DayName;
  caregiver_id: number;
  caregiver_name: string;
  caregiver_role?: string;
  start_time: string;
  end_time: string;
  status: ShiftStatus;
}

export interface Shift {
  id: number;
  caregiver: string;
  start: string;
  end: string;
  status: ShiftStatus;
  caregiver_id?: number;
  week_id?: number;
  day?: DayName;
  requestBy?: string;
  swapWith?: string;
  droppedBy?: string;
}

export interface NewShiftData {
  caregiver_id: number;
  start: string;
  end: string;
  status?: ShiftStatus;
}

export type WeeklySchedule = Record<DayName, Shift[]>;

export interface Caregiver {
  id: number;
  name: string;
  hours: number;
  availability: string;
  role: string;
}

export interface CaregiverBackend {
  id: number;
  name: string;
  hours_per_week: number;
  availability: string;
  role: string;
}

export type NotificationType = 'adjust' | 'swap' | 'drop' | 'suggestion' | 'coverage';

export interface NotificationBackend {
  id: number;
  type: NotificationType;
  from_caregiver_id: number;
  affected_shift_id?: number;
  week_id: number;
  message: string;
  date: string;
  time: string;
  status: 'pending' | 'completed';
}

export interface Notification {
  id: number;
  type: NotificationType;
  from: string;
  date: string;
  time: string;
  message: string;
  status: 'pending' | 'completed';
  from_caregiver_id?: number;
  affected_shift_id?: number;
  week_id?: number;
}

export interface PayrollRecord {
  id: number;
  caregiver_id: number;
  caregiver_name?: string;
  week_id: number;
  total_hours: number;
  date_calculated: string;
  notes?: string;
}

export type ActionType = 'create' | 'update' | 'delete' | 'drop' | 'adjust' | 'swap';
export type EntityType = 'shift' | 'week' | 'caregiver' | 'notification';

export interface HistoryRecord {
  id: number;
  timestamp: string;
  action_type: ActionType;
  entity_type: EntityType;
  entity_id: number;
  caregiver_id?: number;
  caregiver_name?: string;
  week_id?: number;
  description: string;
  details?: string;
}

export * from './unavailability';

