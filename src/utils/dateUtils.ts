import { DayName } from '../types';

export const formatDayTitle = (day: DayName): { dayName: string, dateStr: number, isToday: boolean } => {
  const today = new Date().getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayIndex = dayNames.indexOf(day);
  const isToday = today === dayIndex;
  
  // Calculate date for display
  const currentDate = new Date();
  const diff = dayIndex - currentDate.getDay();
  currentDate.setDate(currentDate.getDate() + diff);
  const dateStr = currentDate.getDate();
  
  return {
    dayName: day.slice(0, 3).toUpperCase(),
    dateStr,
    isToday
  };
};

export const getCurrentWeekRange = (): string => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Start with Monday
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // End with Sunday
  
  const startMonth = startOfWeek.toLocaleString('default', { month: 'short' });
  const endMonth = endOfWeek.toLocaleString('default', { month: 'short' });
  
  const startDate = startOfWeek.getDate();
  const endDate = endOfWeek.getDate();
  
  return `${startMonth} ${startDate}-${endMonth === startMonth ? '' : `${endMonth} `}${endDate}, ${now.getFullYear()}`;
};

export const createTimestamp = (): string => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

export const adjustTime = (timeStr: string, hoursToAdd: number): string => {
  const isPM = timeStr.includes('PM');
  const timeParts = timeStr.replace(/ [AP]M/, '').split(':');
  let hours = parseInt(timeParts[0]);
  const minutes = timeParts[1];
  
  hours = (hours + hoursToAdd) % 12;
  if (hours === 0) hours = 12;
  
  return `${hours}:${minutes} ${isPM ? 'PM' : 'AM'}`;
};