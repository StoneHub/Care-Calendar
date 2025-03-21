import { WeeklySchedule, Caregiver, Notification } from '../types';

export const mockSchedule: WeeklySchedule = {
  monday: [
    { id: 1, caregiver: 'Robin', start: '9:00 AM', end: '4:00 PM', status: 'confirmed' },
    { id: 2, caregiver: 'Scarlet', start: '4:00 PM', end: '9:00 PM', status: 'confirmed' }
  ],
  tuesday: [
    { id: 3, caregiver: 'Robin', start: '9:00 AM', end: '4:00 PM', status: 'confirmed' },
    { id: 4, caregiver: 'Scarlet', start: '4:00 PM', end: '9:00 PM', status: 'confirmed' }
  ],
  wednesday: [
    { id: 5, caregiver: 'Robin', start: '9:00 AM', end: '4:00 PM', status: 'requested-off', requestBy: 'Robin' },
    { id: 6, caregiver: 'Scarlet', start: '4:00 PM', end: '9:00 PM', status: 'confirmed' }
  ],
  thursday: [
    { id: 7, caregiver: 'Robin', start: '9:00 AM', end: '4:00 PM', status: 'confirmed' },
    { id: 8, caregiver: 'Scarlet', start: '4:00 PM', end: '9:00 PM', status: 'confirmed' }
  ],
  friday: [
    { id: 9, caregiver: 'Robin', start: '9:00 AM', end: '4:00 PM', status: 'confirmed' },
    { id: 10, caregiver: 'Scarlet', start: '4:00 PM', end: '9:00 PM', status: 'confirmed' }
  ],
  saturday: [
    { id: 11, caregiver: 'Kelly', start: '9:00 AM', end: '3:00 PM', status: 'swap-proposed', swapWith: 'Joanne' },
    { id: 12, caregiver: 'Joanne', start: '3:00 PM', end: '9:00 PM', status: 'swap-proposed', swapWith: 'Kelly' }
  ],
  sunday: [
    { id: 13, caregiver: 'Kelly', start: '9:00 AM', end: '3:00 PM', status: 'confirmed' },
    { id: 14, caregiver: 'Joanne', start: '3:00 PM', end: '9:00 PM', status: 'confirmed' }
  ]
};

export const mockCaregivers: Caregiver[] = [
  { id: 1, name: 'Robin', hours: 35, availability: 'Weekdays', role: 'Day Shift' },
  { id: 2, name: 'Scarlet', hours: 25, availability: 'Weekdays', role: 'Evening Shift' },
  { id: 3, name: 'Kelly', hours: 12, availability: 'Weekends', role: 'Day Shift' },
  { id: 4, name: 'Joanne', hours: 12, availability: 'Weekends', role: 'Evening Shift' },
];

export const mockNotifications: Notification[] = [
  { id: 1, type: 'adjust', from: 'Robin', date: 'Wed, Mar 26', time: '14:35', message: 'Changed shift from 9AM-4PM to 10AM-5PM', status: 'completed' },
  { id: 2, type: 'swap', from: 'Kelly', date: 'Sat, Mar 29', time: '09:15', message: 'Swapped shift with Joanne', status: 'pending' },
  { id: 3, type: 'drop', from: 'Scarlet', date: 'Wed, Mar 26', time: '17:22', message: 'Dropped shift, needs coverage', status: 'pending' }
];