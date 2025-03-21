export type ShiftStatus = 
  | 'confirmed' 
  | 'requested-off' 
  | 'dropped' 
  | 'adjusted' 
  | 'swap-proposed';

export type DayName = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface Shift {
  id: number;
  caregiver: string;
  start: string;
  end: string;
  status: ShiftStatus;
  requestBy?: string;
  swapWith?: string;
  droppedBy?: string;
}

export type WeeklySchedule = Record<DayName, Shift[]>;

export interface Caregiver {
  id: number;
  name: string;
  hours: number;
  availability: string;
  role: string;
}

export type NotificationType = 'adjust' | 'swap' | 'drop' | 'suggestion' | 'coverage';

export interface Notification {
  id: number;
  type: NotificationType;
  from: string;
  date: string;
  time: string;
  message: string;
  status: 'pending' | 'completed';
}