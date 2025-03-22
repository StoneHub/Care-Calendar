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
  const dayOfWeekIndex = dayNameToJsDay[day]; // 0-6, where 0 is Sunday
  
  let dateToShow: Date;
  
  // If we have a selected week, use it to calculate the dates
  if (selectedWeek) {
    // Start with the week's start date (which should be a Monday)
    const weekStart = new Date(selectedWeek.start_date);
    dateToShow = new Date(weekStart);
    
    // Calculate how many days to add to the start date (Monday)
    // If the day is Sunday (0), we need to add 6 days to get from Monday to Sunday
    // For all other days, just add the difference between the day index and Monday (1)
    const daysToAdd = dayOfWeekIndex === 0 ? 6 : dayOfWeekIndex - 1;
    
    dateToShow.setDate(weekStart.getDate() + daysToAdd);
  } else {
    // Fall back to current week calculation
    dateToShow = new Date(today);
    const diff = dayOfWeekIndex - today.getDay();
    dateToShow.setDate(today.getDate() + diff);
  }
  
  // Check if this date is today
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