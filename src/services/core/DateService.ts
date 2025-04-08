import { DayName, Week } from '../../types';

/**
 * DateService - Centralized service for all date-related operations
 * 
 * This service handles:
 * - Week boundary calculations
 * - Day name to date mapping
 * - Date formatting and validation
 * - Date comparisons
 */
class DateService {
  // Day name to index mapping (Monday = 0, Sunday = 6)
  private readonly DAY_INDICES: Record<DayName, number> = {
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3,
    friday: 4,
    saturday: 5,
    sunday: 6
  };

  /**
   * Gets the current date
   */
  getCurrentDate(): Date {
    return new Date();
  }
  
  /**
   * Creates a week with proper start and end dates
   * Always uses Monday as start and Sunday as end
   */
  createWeek(startDate: Date): Week {
    // Ensure startDate is a Monday
    const adjustedStart = this.getWeekStartDate(startDate);
    
    // End date is Sunday (start + 6 days)
    const endDate = new Date(adjustedStart);
    endDate.setDate(adjustedStart.getDate() + 6);
    
    // Create a week object without an ID (to be assigned by backend)
    return {
      id: 0, // Temporary ID, will be assigned by backend
      start_date: this.formatDateForAPI(adjustedStart),
      end_date: this.formatDateForAPI(endDate),
      is_published: false
    };
  }
  
  /**
   * Gets the start date (Monday) of the week containing the given date
   */
  getWeekStartDate(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate days to subtract to get to Monday
    // If Sunday (0), go back 6 days to previous Monday
    // If Monday (1), go back 0 days
    // If Tuesday (2), go back 1 day
    // etc.
    const daysToSubtract = day === 0 ? 6 : day - 1;
    
    // Set to midnight
    result.setDate(result.getDate() - daysToSubtract);
    result.setHours(0, 0, 0, 0);
    
    return result;
  }
  
  /**
   * Gets the end date (Sunday) of the week containing the given date
   */
  getWeekEndDate(date: Date): Date {
    const startDate = this.getWeekStartDate(date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    return endDate;
  }
  
  /**
   * Gets the current week's start and end dates
   */
  getCurrentWeekDates(): { start: Date, end: Date } {
    const today = this.getCurrentDate();
    const start = this.getWeekStartDate(today);
    const end = this.getWeekEndDate(today);
    return { start, end };
  }
  
  /**
   * Formats a date as YYYY-MM-DD for API use
   */
  formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  /**
   * Formats a date as Month DD, YYYY for display
   */
  formatDateForDisplay(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
  
  /**
   * Formats a date range for display (e.g., "Mar 1-7, 2025")
   */
  formatDateRangeForDisplay(startDate: Date, endDate: Date): string {
    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
    const year = endDate.getFullYear();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDate.getDate()}-${endDate.getDate()}, ${year}`;
    } else {
      return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}, ${year}`;
    }
  }
  
  /**
   * Formats a week's date range for display
   */
  formatWeekRangeForDisplay(week: Week): string {
    const startDate = new Date(week.start_date);
    const endDate = new Date(week.end_date);
    return this.formatDateRangeForDisplay(startDate, endDate);
  }
  
  /**
   * Gets the date for a specific day within a week
   */
  getDateForDayInWeek(day: DayName, week: Week): Date {
    const startDate = new Date(week.start_date);
    const result = new Date(startDate);
    result.setDate(startDate.getDate() + this.DAY_INDICES[day]);
    return result;
  }
  
  /**
   * Gets information about a day in a week (for rendering)
   */
  getDayInfo(day: DayName, week: Week | null): { 
    dayName: string,
    dateStr: number,
    date: Date,
    isToday: boolean
  } {
    const today = this.getCurrentDate();
    let dateObj: Date;
    
    if (week) {
      // Calculate date based on the week's start date
      dateObj = this.getDateForDayInWeek(day, week);
    } else {
      // Fallback to current week
      const { start } = this.getCurrentWeekDates();
      dateObj = new Date(start);
      dateObj.setDate(start.getDate() + this.DAY_INDICES[day]);
    }
    
    // Compare dates to check if it's today
    const isToday = this.isSameDay(dateObj, today);
    
    return {
      dayName: day.slice(0, 3).toUpperCase(),
      dateStr: dateObj.getDate(),
      date: dateObj,
      isToday
    };
  }
  
  /**
   * Checks if a date is the same as today
   */
  isToday(date: Date): boolean {
    return this.isSameDay(date, this.getCurrentDate());
  }
  
  /**
   * Checks if two dates are the same day (ignoring time)
   */
  isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
  
  /**
   * Checks if a date falls within a week's range
   */
  isDateInWeek(date: Date, week: Week): boolean {
    if (!week) return false;
    
    const targetDate = new Date(date);
    const weekStart = new Date(week.start_date);
    const weekEnd = new Date(week.end_date);
    
    // Reset hours to compare dates only
    targetDate.setHours(0, 0, 0, 0);
    weekStart.setHours(0, 0, 0, 0);
    weekEnd.setHours(0, 0, 0, 0);
    
    return targetDate >= weekStart && targetDate <= weekEnd;
  }
  
  /**
   * Checks if a week contains today's date
   */
  isCurrentWeek(week: Week): boolean {
    return this.isDateInWeek(this.getCurrentDate(), week);
  }
  
  /**
   * Gets the previous week's start date
   */
  getPreviousWeekStartDate(date: Date): Date {
    const currentWeekStart = this.getWeekStartDate(date);
    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(currentWeekStart.getDate() - 7);
    return previousWeekStart;
  }
  
  /**
   * Gets the next week's start date
   */
  getNextWeekStartDate(date: Date): Date {
    const currentWeekStart = this.getWeekStartDate(date);
    const nextWeekStart = new Date(currentWeekStart);
    nextWeekStart.setDate(currentWeekStart.getDate() + 7);
    return nextWeekStart;
  }
  
  /**
   * Sorts weeks by start date
   */
  sortWeeksByDate(weeks: Week[]): Week[] {
    return [...weeks].sort((a, b) => {
      const dateA = new Date(a.start_date);
      const dateB = new Date(b.start_date);
      
      // Check for invalid dates
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        return a.id - b.id; // Fallback to ID-based sorting
      }
      
      return dateA.getTime() - dateB.getTime();
    });
  }
  
  /**
   * Converts 12-hour time format to 24-hour time format
   */
  convertTo24Hour(timeStr: string): string {
    if (!timeStr) return '';
    
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    
    let hoursNum = parseInt(hours, 10);
    
    if (modifier === 'PM' && hoursNum < 12) {
      hoursNum += 12;
    }
    if (modifier === 'AM' && hoursNum === 12) {
      hoursNum = 0;
    }
    
    return `${hoursNum.toString().padStart(2, '0')}:${minutes}`;
  }
  
  /**
   * Converts 24-hour time format to 12-hour time format
   */
  convertTo12Hour(timeStr: string): string {
    if (!timeStr) return '';
    
    const [hours, minutes] = timeStr.split(':');
    let hoursNum = parseInt(hours, 10);
    const suffix = hoursNum >= 12 ? 'PM' : 'AM';
    
    hoursNum = hoursNum % 12;
    if (hoursNum === 0) hoursNum = 12;
    
    return `${hoursNum}:${minutes} ${suffix}`;
  }
  
  /**
   * Adjusts a time string by a number of hours
   */
  adjustTime(timeStr: string, hoursToAdd: number): string {
    // Convert to 24-hour format
    const timeIn24 = this.convertTo24Hour(timeStr);
    
    // Parse hours and minutes
    const [hours, minutes] = timeIn24.split(':').map(Number);
    
    // Add the hours
    let newHours = (hours + hoursToAdd) % 24;
    if (newHours < 0) newHours += 24; // Handle negative hours
    
    // Format back to 24-hour string
    const newTimeIn24 = `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    // Convert back to 12-hour format
    return this.convertTo12Hour(newTimeIn24);
  }
  
  /**
   * Validates a week's date range is consistent (7 days, Monday to Sunday)
   */
  validateWeekDates(week: Week): boolean {
    try {
      // Check that start and end dates are valid
      const startDate = new Date(week.start_date);
      const endDate = new Date(week.end_date);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return false;
      }
      
      // Check that start date is a Monday
      if (startDate.getDay() !== 1) { // 1 = Monday in JavaScript
        return false;
      }
      
      // Check that end date is a Sunday
      if (endDate.getDay() !== 0) { // 0 = Sunday in JavaScript
        return false;
      }
      
      // Check that the difference is 6 days (Monday to Sunday)
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays === 6;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Generate time options for shift selection (e.g., "6:00 AM", "6:30 AM", etc.)
   */
  generateTimeOptions(interval: number = 30): string[] {
    const options: string[] = [];
    
    // Generate times from 12:00 AM to 11:30 PM with specified interval
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const hourIn12 = hour % 12 || 12; // Convert 0 to 12
        const amPm = hour < 12 ? 'AM' : 'PM';
        const minuteStr = minute.toString().padStart(2, '0');
        
        options.push(`${hourIn12}:${minuteStr} ${amPm}`);
      }
    }
    
    return options;
  }
  
  /**
   * Find a week by its start date
   * This is used for more reliable week navigation
   */
  findWeekByStartDate(weeks: Week[], targetStartDate: string): Week | undefined {
    return weeks.find(week => week.start_date === targetStartDate);
  }
  
  /**
   * Add days to a date
   */
  addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(date.getDate() + days);
    return result;
  }
  
  /**
   * Parse ISO date string to Date object
   */
  parseISO(dateString: string): Date {
    return new Date(dateString);
  }
  
  /**
   * Format Date as ISO string
   */
  formatISO(date: Date): string {
    return this.formatDateForAPI(date);
  }
}

// Create and export a singleton instance
export const dateService = new DateService();