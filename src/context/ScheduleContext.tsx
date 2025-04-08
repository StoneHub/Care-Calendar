import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/core/APIService';
import { dateService } from '../services/core/DateService';
import { Week, Shift, DayName, Caregiver, Notification, WeeklySchedule, NewShiftData } from '../types';
import { logger } from '../utils/logger';
import { organizeShiftsByDay } from '../utils/mappers';

// Define the context state shape
interface ScheduleContextState {
  // Data
  weeks: Week[];
  currentWeek: Week | null;
  selectedWeek: Week | null;
  schedule: WeeklySchedule;
  notifications: Notification[];
  caregivers: Caregiver[];
  
  // UI state
  selectedDay: DayName | null;
  selectedShift: Shift | null;
  
  // Status flags
  isLoading: boolean;
  error: string | null;
  
  // Operations
  selectWeek: (weekId: number) => void;
  goToNextWeek: () => void;
  goToPreviousWeek: () => void;
  goToCurrentWeek: () => void;
  refreshSchedule: () => Promise<void>;
  addShift: (day: DayName, shift: NewShiftData, targetWeekId?: number) => Promise<boolean>;
  deleteShift: (shiftId: number) => Promise<boolean>;
  dropShift: (shiftId: number, reason?: string) => Promise<boolean>;
  adjustShift: (shiftId: number, newStartTime?: string, newEndTime?: string) => Promise<boolean>;
  swapShift: (shiftId: number, swapWithId: number) => Promise<boolean>;
  approveRequest: (notificationId: number) => Promise<boolean>;
  setSelectedDay: (day: DayName | null) => void;
  setSelectedShift: (shift: Shift | null) => void;
  createWeek: (startDate: string) => Promise<Week | null>;
}

// Create the context with a default value
const ScheduleContext = createContext<ScheduleContextState | undefined>(undefined);

// Provider component
export const ScheduleProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  // State
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [currentWeek, setCurrentWeek] = useState<Week | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);
  const [schedule, setSchedule] = useState<WeeklySchedule>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayName | null>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        logger.info('Initializing schedule data');
        
        // Load all required data
        await Promise.all([
          fetchWeeks(),
          fetchCaregivers(),
          fetchNotifications()
        ]);
        
        logger.info('Schedule data initialized');
      } catch (err: any) {
        logger.error('Failed to initialize schedule data', {
          error: err.message,
          stack: err.stack
        });
        setError('Failed to load initial data. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeData();
  }, []);
  
  // Fetch all weeks
  const fetchWeeks = async (): Promise<void> => {
    try {
      logger.info('Fetching all weeks');
      
      // Get all weeks and current week in parallel
      const [allWeeks, currentWeekData] = await Promise.all([
        apiService.getAllWeeks(),
        apiService.getCurrentWeek().catch(err => {
          logger.warn('Failed to fetch current week', { error: err.message });
          return null;
        })
      ]);
      
      if (allWeeks && allWeeks.length > 0) {
        // Sort weeks by start date
        const sortedWeeks = dateService.sortWeeksByDate(allWeeks);
        
        logger.debug('Weeks sorted by date', {
          count: sortedWeeks.length,
          firstWeek: sortedWeeks[0]?.start_date,
          lastWeek: sortedWeeks[sortedWeeks.length - 1]?.start_date
        });
        
        setWeeks(sortedWeeks);
        
        // Set current week if available
        if (currentWeekData) {
          setCurrentWeek(currentWeekData);
          
          // If no week is selected, select the current week
          if (!selectedWeek) {
            setSelectedWeek(currentWeekData);
            await fetchScheduleForWeek(currentWeekData.id);
          }
        } else if (!selectedWeek && sortedWeeks.length > 0) {
          // Fallback to the most recent week if current week not available
          const mostRecentWeek = findMostRecentWeek(sortedWeeks);
          setSelectedWeek(mostRecentWeek);
          await fetchScheduleForWeek(mostRecentWeek.id);
        }
      } else {
        logger.warn('No weeks available');
      }
    } catch (err: any) {
      logger.error('Error fetching weeks', {
        error: err.message,
        stack: err.stack
      });
      throw err;
    }
  };
  
  // Find the most recent week from a sorted list
  const findMostRecentWeek = (sortedWeeks: Week[]): Week => {
    const today = new Date();
    
    // Find the first week that contains today or is in the future
    const currentOrFutureWeek = sortedWeeks.find(week => {
      const weekStart = new Date(week.start_date);
      return weekStart >= today;
    });
    
    // If found, return it, otherwise return the last week (most recent past week)
    return currentOrFutureWeek || sortedWeeks[sortedWeeks.length - 1];
  };
  
  // Fetch schedule for a specific week
  const fetchScheduleForWeek = async (weekId: number): Promise<void> => {
    try {
      logger.info('Fetching schedule for week', { weekId });
      
      const shiftsData = await apiService.getScheduleForWeek(weekId);
      
      logger.debug('Schedule data received from API', { 
        count: shiftsData?.length || 0,
        type: typeof shiftsData,
        isArray: Array.isArray(shiftsData),
        sample: Array.isArray(shiftsData) && shiftsData.length > 0 ? shiftsData[0] : null
      });
      
      // Organize shifts by day
      const organizedSchedule = organizeShiftsByDay(shiftsData);
      
      logger.debug('Schedule organized by day', { 
        days: Object.keys(organizedSchedule),
        shiftCounts: Object.entries(organizedSchedule).reduce((acc, [day, shifts]) => {
          acc[day] = shifts.length;
          return acc;
        }, {} as Record<string, number>)
      });
      
      setSchedule(organizedSchedule);
    } catch (err: any) {
      logger.error('Error fetching schedule for week', {
        weekId,
        error: err.message,
        stack: err.stack
      });
      
      // Reset schedule on error
      setSchedule({
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: []
      });
      
      throw err;
    }
  };
  
  // Fetch notifications
  const fetchNotifications = async (): Promise<void> => {
    try {
      logger.info('Fetching notifications');
      
      const notificationsData = await apiService.getAllNotifications();
      
      logger.debug('Notifications received', { 
        count: notificationsData.length,
        pendingCount: notificationsData.filter(n => n.status === 'pending').length
      });
      
      setNotifications(notificationsData);
    } catch (err: any) {
      logger.error('Error fetching notifications', {
        error: err.message,
        stack: err.stack
      });
      
      throw err;
    }
  };
  
  // Fetch caregivers
  const fetchCaregivers = async (): Promise<void> => {
    try {
      logger.info('Fetching caregivers');
      
      const caregiversData = await apiService.getTeamMembers();
      
      logger.debug('Caregivers received', { 
        count: caregiversData.length
      });
      
      setCaregivers(caregiversData);
    } catch (err: any) {
      logger.error('Error fetching caregivers', {
        error: err.message,
        stack: err.stack
      });
      
      throw err;
    }
  };
  
  // Select a specific week
  const selectWeek = (weekId: number): void => {
    const week = weeks.find(w => w.id === weekId);
    
    if (week) {
      logger.info('Selecting week', { 
        week_id: week.id, 
        start_date: week.start_date, 
        end_date: week.end_date 
      });
      
      setSelectedWeek(week);
      fetchScheduleForWeek(week.id).catch(err => {
        setError(`Failed to load schedule: ${err.message}`);
      });
    } else {
      logger.warn('Failed to select week - week not found', { 
        requested_id: weekId, 
        available_ids: weeks.map(w => w.id)
      });
    }
  };
  
  // Navigate to next week - FIXED to use date calculation instead of array index
  const goToNextWeek = (): void => {
    if (!weeks.length || !selectedWeek) {
      logger.warn('Cannot navigate to next week - no weeks available or no week selected');
      return;
    }
    
    try {
      // Parse the current selected week's start date
      const currentStartDate = dateService.parseISO(selectedWeek.start_date);
      
      // Calculate the next week's start date (current start + 7 days)
      const nextWeekStartDate = dateService.addDays(currentStartDate, 7);
      
      // Format the date to match the format in the weeks array
      const nextStartDateStr = dateService.formatISO(nextWeekStartDate);
      
      // Find the week with this start date
      const targetWeek = weeks.find(w => w.start_date === nextStartDateStr);
      
      if (targetWeek) {
        logger.debug('goToNextWeek: Navigating', { 
          currentId: selectedWeek.id, 
          nextWeekId: targetWeek.id,
          from_dates: `${selectedWeek.start_date} to ${selectedWeek.end_date}`,
          to_dates: `${targetWeek.start_date} to ${targetWeek.end_date}`
        });
        
        selectWeek(targetWeek.id);
      } else {
        logger.warn('Cannot navigate to next week - no week found with start date', {
          nextStartDate: nextStartDateStr,
          availableWeeks: weeks.map(w => w.start_date)
        });
      }
    } catch (error) {
      logger.error('Error navigating to next week', error);
      setError('Could not navigate to the next week.');
    }
  };
  
  // Navigate to previous week - FIXED to use date calculation instead of array index
  const goToPreviousWeek = (): void => {
    if (!weeks.length || !selectedWeek) {
      logger.warn('Cannot navigate to previous week - no weeks available or no week selected');
      return;
    }
    
    try {
      // Parse the current selected week's start date
      const currentStartDate = dateService.parseISO(selectedWeek.start_date);
      
      // Calculate the previous week's start date (current start - 7 days)
      const prevWeekStartDate = dateService.addDays(currentStartDate, -7);
      
      // Format the date to match the format in the weeks array
      const prevStartDateStr = dateService.formatISO(prevWeekStartDate);
      
      // Find the week with this start date
      const targetWeek = weeks.find(w => w.start_date === prevStartDateStr);
      
      if (targetWeek) {
        logger.debug('goToPreviousWeek: Navigating', { 
          currentId: selectedWeek.id, 
          prevWeekId: targetWeek.id,
          from_dates: `${selectedWeek.start_date} to ${selectedWeek.end_date}`,
          to_dates: `${targetWeek.start_date} to ${targetWeek.end_date}`
        });
        
        selectWeek(targetWeek.id);
      } else {
        logger.warn('Cannot navigate to previous week - no week found with start date', {
          prevStartDate: prevStartDateStr,
          availableWeeks: weeks.map(w => w.start_date)
        });
      }
    } catch (error) {
      logger.error('Error navigating to previous week', error);
      setError('Could not navigate to the previous week.');
    }
  };
  
  // Navigate to current week
  const goToCurrentWeek = (): void => {
    if (!currentWeek) {
      logger.warn('Cannot navigate to current week - current week not available');
      return;
    }
    
    logger.info('Navigating to current week', { week_id: currentWeek.id });
    selectWeek(currentWeek.id);
  };
  
  // Refresh all schedule data
  const refreshSchedule = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      logger.info('Refreshing schedule data');
      
      // Reload all data
      await Promise.all([
        fetchWeeks(),
        fetchNotifications()
      ]);
      
      // Reload schedule for the selected week
      if (selectedWeek) {
        await fetchScheduleForWeek(selectedWeek.id);
      }
      
      logger.info('Schedule data refreshed');
    } catch (err: any) {
      logger.error('Failed to refresh schedule data', {
        error: err.message,
        stack: err.stack
      });
      setError(`Failed to refresh data: ${err.message}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add a new shift - FIXED to accept target week ID
  const addShift = async (
    day: DayName, 
    shift: NewShiftData, 
    targetWeekId?: number
  ): Promise<boolean> => {
    // Use provided target week or fall back to selected week
    const weekId = targetWeekId || selectedWeek?.id;
    
    if (!weekId) {
      const errorMsg = 'Cannot add shift: No week is selected';
      logger.error(errorMsg);
      setError(errorMsg);
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Prepare shift data for the API
      const shiftData = {
        week_id: weekId,
        day_of_week: day,
        caregiver_id: shift.caregiver_id,
        start_time: shift.start,
        end_time: shift.end,
        status: shift.status || 'confirmed'
      };
      
      // Log the request data
      logger.info('Adding new shift', {
        shiftData,
        weekId,
        day,
        requestTime: new Date().toISOString()
      });
      
      // Call the API
      const result = await apiService.createShift(shiftData);
      
      logger.info('Shift added successfully', { 
        shiftId: result.id,
        weekId,
        day,
        caregiver: shift.caregiver_id,
        time: `${shift.start}-${shift.end}`
      });
      
      // Refresh the schedule to include the new shift
      // Only refresh if it's the currently selected week to avoid unnecessary API calls
      if (selectedWeek?.id === weekId) {
        await fetchScheduleForWeek(weekId);
      }
      
      return true;
    } catch (err: any) {
      // The error message from apiService is already normalized with user-friendly messages
      const normalizedError = err;
      
      logger.error('Context: Failed to add shift', { 
        error: normalizedError,
        originalPayload: {
          day,
          caregiverId: shift.caregiver_id,
          weekId,
          startTime: shift.start,
          endTime: shift.end
        }
      });
      
      setError(normalizedError.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete a shift
  const deleteShift = async (shiftId: number): Promise<boolean> => {
    if (!selectedWeek) {
      const errorMsg = 'Cannot delete shift: No week is selected';
      logger.error(errorMsg);
      setError(errorMsg);
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      logger.info('Deleting shift', { shiftId, weekId: selectedWeek.id });
      
      // Call the API
      await apiService.deleteShift(shiftId);
      
      logger.info('Shift deleted successfully', { shiftId, weekId: selectedWeek.id });
      
      // Refresh the schedule to remove the deleted shift
      await fetchScheduleForWeek(selectedWeek.id);
      
      return true;
    } catch (err: any) {
      // The error message from apiService is already normalized with user-friendly messages
      const normalizedError = err;
      
      logger.error('Context: Failed to delete shift', {
        error: normalizedError,
        shiftId,
        selectedWeekId: selectedWeek.id
      });
      
      setError(normalizedError.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Drop a shift
  const dropShift = async (shiftId: number, reason?: string): Promise<boolean> => {
    if (!selectedWeek) {
      const errorMsg = 'Cannot drop shift: No week is selected';
      logger.error(errorMsg);
      setError(errorMsg);
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      logger.info('Dropping shift', { 
        shiftId, 
        weekId: selectedWeek.id,
        reason
      });
      
      // Call the API
      await apiService.dropShift(shiftId, reason);
      
      logger.info('Shift dropped successfully', { shiftId, weekId: selectedWeek.id });
      
      // Refresh data
      await Promise.all([
        fetchScheduleForWeek(selectedWeek.id),
        fetchNotifications()
      ]);
      
      return true;
    } catch (err: any) {
      // The error message from apiService is already normalized with user-friendly messages
      const normalizedError = err;
      
      logger.error('Context: Failed to drop shift', {
        error: normalizedError,
        shiftId,
        reason,
        selectedWeekId: selectedWeek.id
      });
      
      setError(normalizedError.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Adjust a shift's times
  const adjustShift = async (shiftId: number, newStartTime?: string, newEndTime?: string): Promise<boolean> => {
    if (!selectedWeek) {
      const errorMsg = 'Cannot adjust shift: No week is selected';
      logger.error(errorMsg);
      setError(errorMsg);
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      logger.info('Adjusting shift', { 
        shiftId, 
        weekId: selectedWeek.id,
        newStartTime,
        newEndTime
      });
      
      // Call the API
      await apiService.adjustShift(shiftId, newStartTime, newEndTime);
      
      logger.info('Shift adjusted successfully', { 
        shiftId, 
        weekId: selectedWeek.id 
      });
      
      // Refresh data
      await Promise.all([
        fetchScheduleForWeek(selectedWeek.id),
        fetchNotifications()
      ]);
      
      return true;
    } catch (err: any) {
      // The error message from apiService is already normalized with user-friendly messages
      const normalizedError = err;
      
      logger.error('Context: Failed to adjust shift', {
        error: normalizedError,
        shiftId,
        newStartTime,
        newEndTime,
        selectedWeekId: selectedWeek.id
      });
      
      setError(normalizedError.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Swap shifts
  const swapShift = async (shiftId: number, swapWithId: number): Promise<boolean> => {
    if (!selectedWeek) {
      const errorMsg = 'Cannot swap shifts: No week is selected';
      logger.error(errorMsg);
      setError(errorMsg);
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      logger.info('Swapping shifts', { 
        shiftId, 
        swapWithId,
        weekId: selectedWeek.id
      });
      
      // Call the API
      await apiService.swapShift(shiftId, swapWithId);
      
      logger.info('Shifts swapped successfully', { 
        shiftId, 
        swapWithId,
        weekId: selectedWeek.id 
      });
      
      // Refresh data
      await Promise.all([
        fetchScheduleForWeek(selectedWeek.id),
        fetchNotifications()
      ]);
      
      return true;
    } catch (err: any) {
      // The error message from apiService is already normalized with user-friendly messages
      const normalizedError = err;
      
      logger.error('Context: Failed to swap shifts', {
        error: normalizedError,
        shiftId,
        swapWithId,
        selectedWeekId: selectedWeek.id
      });
      
      setError(normalizedError.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Approve a notification request
  const approveRequest = async (notificationId: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      logger.info('Approving notification request', { notificationId });
      
      // Call the API
      await apiService.approveNotification(notificationId);
      
      logger.info('Notification approved successfully', { notificationId });
      
      // Refresh data
      await Promise.all([
        fetchNotifications(),
        selectedWeek ? fetchScheduleForWeek(selectedWeek.id) : Promise.resolve()
      ]);
      
      return true;
    } catch (err: any) {
      // The error message from apiService is already normalized with user-friendly messages
      const normalizedError = err;
      
      logger.error('Context: Failed to approve notification', {
        error: normalizedError,
        notificationId
      });
      
      setError(normalizedError.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create a new week
  const createWeek = async (startDate: string): Promise<Week | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      logger.info('Creating new week', { startDate });
      
      // Parse the start date
      const startDateObj = new Date(startDate);
      
      // Create the week using the DateService
      const weekData = dateService.createWeek(startDateObj);
      
      logger.debug('Week data created', {
        start_date: weekData.start_date,
        end_date: weekData.end_date
      });
      
      // Call the API to create the week
      const createdWeek = await apiService.createWeek(weekData);
      
      logger.info('Week created successfully', { 
        weekId: createdWeek.id,
        start_date: createdWeek.start_date,
        end_date: createdWeek.end_date
      });
      
      // Refresh weeks
      await fetchWeeks();
      
      return createdWeek;
    } catch (err: any) {
      // The error message from apiService is already normalized with user-friendly messages
      const normalizedError = err;
      
      logger.error('Context: Failed to create week', {
        error: normalizedError,
        startDate
      });
      
      setError(normalizedError.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Construct the context value
  const contextValue: ScheduleContextState = {
    // Data
    weeks,
    currentWeek,
    selectedWeek,
    schedule,
    notifications,
    caregivers,
    
    // UI state
    selectedDay,
    selectedShift,
    
    // Status flags
    isLoading,
    error,
    
    // Operations
    selectWeek,
    goToNextWeek,
    goToPreviousWeek,
    goToCurrentWeek,
    refreshSchedule,
    addShift,
    deleteShift,
    dropShift,
    adjustShift,
    swapShift,
    approveRequest,
    setSelectedDay,
    setSelectedShift,
    createWeek
  };

  return (
    <ScheduleContext.Provider value={contextValue}>
      {children}
    </ScheduleContext.Provider>
  );
};

// Custom hook to use the schedule context
export const useScheduleContext = () => {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useScheduleContext must be used within a ScheduleProvider');
  }
  return context;
};
