import { DayName, Week } from '../types';

// Map of DayName to JavaScript day index (0-6, where 0 is Sunday)
const dayNameToJsDay = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6
};

export const formatDayTitle = (
  day: DayName, 
  selectedWeek?: Week | null
): { dayName: string, dateStr: number, isToday: boolean } => {
  const today = new Date();
  let dateToShow: Date;

  if (selectedWeek) {
    // Assume selectedWeek.start_date is a Monday
    const weekStart = new Date(selectedWeek.start_date);
    // Map day names to offsets relative to Monday
    const dayOffsets: Record<DayName, number> = {
      monday: 0,
      tuesday: 1,
      wednesday: 2,
      thursday: 3,
      friday: 4,
      saturday: 5,
      sunday: 6
    };
    dateToShow = new Date(weekStart);
    dateToShow.setDate(weekStart.getDate() + dayOffsets[day]);
  } else {
    // Fallback: use current week calculation
    const currentDay = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    const dayOffsetsFallback: Record<DayName, number> = {
      monday: currentDay <= 1 ? 1 - currentDay : 8 - currentDay,
      tuesday: currentDay <= 2 ? 2 - currentDay : 9 - currentDay,
      wednesday: currentDay <= 3 ? 3 - currentDay : 10 - currentDay,
      thursday: currentDay <= 4 ? 4 - currentDay : 11 - currentDay,
      friday: currentDay <= 5 ? 5 - currentDay : 12 - currentDay,
      saturday: currentDay <= 6 ? 6 - currentDay : 13 - currentDay,
      sunday: currentDay === 0 ? 0 : 7 - currentDay
    };
    dateToShow = new Date(today);
    dateToShow.setDate(today.getDate() + dayOffsetsFallback[day]);
  }
  
  // Compare full date strings to check if it's today
  const isToday = dateToShow.toDateString() === today.toDateString();
  
  return {
    dayName: day.slice(0, 3).toUpperCase(),
    dateStr: dateToShow.getDate(),
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