import { useState, useEffect } from 'react';
import { WeeklySchedule, Shift, DayName, Notification, Week } from '../types';
import { mockSchedule, mockNotifications } from '../services/mockData';
import { createTimestamp, adjustTime } from '../utils/dateUtils';
import { apiService } from '../services/api';
import { organizeShiftsByDay } from '../utils/mappers';
import { logger } from '../utils/logger';

interface UseScheduleProps {
  selectedWeek?: Week | null;
}

export const useSchedule = ({ selectedWeek }: UseScheduleProps = {}) => {
  const [schedule, setSchedule] = useState<WeeklySchedule>(mockSchedule);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [selectedDay, setSelectedDay] = useState<DayName | null>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeekId, setSelectedWeekId] = useState<number | null>(null);

  // Update selected week ID when it changes
  useEffect(() => {
    if (selectedWeek) {
      logger.info('Selected week changed', {
        week_id: selectedWeek.id,
        start_date: selectedWeek.start_date,
        end_date: selectedWeek.end_date
      });
      setSelectedWeekId(selectedWeek.id);
      fetchScheduleForWeek(selectedWeek.id);
      fetchNotifications();
    }
  }, [selectedWeek]);
  
  // Debug selectedWeekId changes
  useEffect(() => {
    logger.debug('selectedWeekId value changed', { selectedWeekId });
  }, [selectedWeekId]);

  const fetchScheduleForWeek = async (weekId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      logger.info('Fetching schedule for week', { weekId });
      const shiftsData = await apiService.getScheduleForWeek(weekId);
      logger.debug('Schedule data received', { 
        count: shiftsData.length,
        firstShift: shiftsData.length > 0 ? shiftsData[0] : null
      });
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
      logger.error('Error fetching schedule', {
        weekId,
        error: err.message,
        details: err.response?.data
      });
      setError(`Failed to fetch schedule: ${err.message}`);
      // Fallback to mock data in case of error
      setSchedule(mockSchedule);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      logger.info('Fetching notifications');
      const notificationsData = await apiService.getAllNotifications();
      logger.debug('Notifications received', { 
        count: notificationsData.length,
        pendingCount: notificationsData.filter((n: Notification) => n.status === 'pending').length
      });
      setNotifications(notificationsData);
    } catch (err: any) {
      logger.error('Error fetching notifications', {
        error: err.message,
        details: err.response?.data
      });
      setError(`Failed to fetch notifications: ${err.message}`);
      // Fallback to mock data in case of error
      setNotifications(mockNotifications);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShiftClick = (day: DayName, shift: Shift) => {
    setSelectedDay(day);
    setSelectedShift(shift);
    return { day, shift };
  };

  const handleDropShift = async () => {
    if (!selectedDay || !selectedShift || !selectedWeekId) {
      logger.error('Cannot drop shift: missing data', { 
        selectedDay, 
        selectedShift: selectedShift?.id, 
        selectedWeekId 
      });
      return false;
    }
    
    try {
      setIsLoading(true);
      
      // Call the API to drop the shift
      if (!selectedShift.id) {
        logger.error('Cannot drop shift: missing shift ID');
        return false;
      }
      
      logger.info('Dropping shift', { 
        shiftId: selectedShift.id,
        caregiver: selectedShift.caregiver,
        day: selectedDay,
        time: `${selectedShift.start}-${selectedShift.end}`
      });
      
      const result = await apiService.dropShift(selectedShift.id);
      logger.debug('Drop shift result', { result });
      
      // Update the local data after successful API call
      if (result) {
        logger.info('Shift dropped successfully, refreshing data', { 
          shiftId: selectedShift.id,
          weekId: selectedWeekId 
        });
        
        // Refresh the schedule data
        await fetchScheduleForWeek(selectedWeekId);
        // Refresh notifications
        await fetchNotifications();
        return true;
      }
      
      return false;
    } catch (err: any) {
      logger.error('Error dropping shift', {
        shiftId: selectedShift.id,
        error: err.message,
        details: err.response?.data
      });
      setError(`Failed to drop shift: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwapShift = async () => {
    if (!selectedDay || !selectedShift || !selectedWeekId) {
      console.error('Cannot swap shift: missing data', { 
        selectedDay, 
        selectedShift: selectedShift?.id, 
        selectedWeekId 
      });
      return false;
    }
    
    try {
      setIsLoading(true);
      
      // Need to find a shift to swap with
      const dayShifts = schedule[selectedDay];
      if (!dayShifts || dayShifts.length < 2) {
        console.error('Cannot swap shift: not enough shifts on this day');
        return false;
      }
      
      // Find another shift on the same day to swap with
      const otherShift = dayShifts.find(s => s.id !== selectedShift.id);
      if (!otherShift || !otherShift.id || !selectedShift.id) {
        console.error('Cannot swap shift: no other shift found or missing IDs');
        return false;
      }
      
      // Call the API to swap the shifts
      console.log(`Swapping shifts: ${selectedShift.id} with ${otherShift.id}`);
      const result = await apiService.swapShift(selectedShift.id, otherShift.id);
      console.log('Swap result:', result);
      
      // Update the local data after successful API call
      if (result) {
        console.log(`Refreshing schedule for week: ${selectedWeekId}`);
        // Refresh the schedule data
        await fetchScheduleForWeek(selectedWeekId);
        // Refresh notifications
        await fetchNotifications();
        return true;
      }
      
      return false;
    } catch (err: any) {
      console.error('Error swapping shift:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError(`Failed to swap shift: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAdjustShift = async (newStartTime?: string, newEndTime?: string) => {
    if (!selectedDay || !selectedShift || !selectedWeekId) {
      console.error('Cannot adjust shift: missing data', { 
        selectedDay, 
        selectedShift: selectedShift?.id, 
        selectedWeekId 
      });
      return false;
    }
    
    try {
      setIsLoading(true);
      
      if (!selectedShift.id) {
        console.error('Cannot adjust shift: missing shift ID');
        return false;
      }
      
      // If no new times provided, default to shifting by 1 hour
      const defaultStartTime = newStartTime || adjustTime(selectedShift.start, 1);
      const defaultEndTime = newEndTime || adjustTime(selectedShift.end, 1);
      
      // Call the API to adjust the shift
      console.log(`Adjusting shift: ${selectedShift.id} to ${defaultStartTime}-${defaultEndTime}`);
      const result = await apiService.adjustShift(
        selectedShift.id, 
        defaultStartTime, 
        defaultEndTime
      );
      console.log('Adjust result:', result);
      
      // Update the local data after successful API call
      if (result) {
        console.log(`Refreshing schedule for week: ${selectedWeekId}`);
        // Refresh the schedule data
        await fetchScheduleForWeek(selectedWeekId);
        // Refresh notifications
        await fetchNotifications();
        return true;
      }
      
      return false;
    } catch (err: any) {
      console.error('Error adjusting shift:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError(`Failed to adjust shift: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const approveRequest = async (notificationId: number) => {
    if (!selectedWeekId) {
      console.error('Cannot approve notification: missing selectedWeekId');
      return false;
    }
    
    try {
      setIsLoading(true);
      
      // Call the API to approve the notification
      console.log(`Approving notification: ${notificationId}`);
      const result = await apiService.approveNotification(notificationId);
      console.log('Approval result:', result);
      
      // Update the local data after successful API call
      if (result) {
        console.log(`Refreshing schedule for week: ${selectedWeekId}`);
        // Refresh the schedule data
        await fetchScheduleForWeek(selectedWeekId);
        // Refresh notifications
        await fetchNotifications();
        return true;
      }
      
      return false;
    } catch (err: any) {
      console.error('Error approving notification:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError(`Failed to approve notification: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to add a shift with improved error handling
  const addShift = async (day: DayName, shift: Omit<Shift, 'id'>) => {
    if (!selectedWeekId) {
      const errorMsg = 'Cannot add shift: No week is selected';
      logger.error(errorMsg);
      setError(errorMsg);
      return false;
    }
    
    // Input validation
    if (!day) {
      const errorMsg = 'Cannot add shift: Day is required';
      logger.error(errorMsg);
      setError(errorMsg);
      return false;
    }
    
    if (!shift.caregiver_id) {
      const errorMsg = 'Cannot add shift: Caregiver selection is required';
      logger.error(errorMsg);
      setError(errorMsg);
      return false;
    }
    
    if (!shift.start || !shift.end) {
      const errorMsg = 'Cannot add shift: Start and end times are required';
      logger.error(errorMsg);
      setError(errorMsg);
      return false;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Prepare shift data for the API
      const shiftData = {
        week_id: selectedWeekId,
        day_of_week: day,
        caregiver_id: shift.caregiver_id,
        start_time: shift.start,
        end_time: shift.end,
        status: shift.status || 'confirmed'
      };
      
      // Call the API to create a new shift
      logger.info('Adding new shift', shiftData);
      
      try {
        const result = await apiService.createShift(shiftData);
        
        if (!result) {
          const errorMsg = 'Failed to add shift: Server returned empty response';
          logger.warn(errorMsg);
          setError(errorMsg);
          return false;
        }
        
        if (!result.id) {
          const errorMsg = 'Failed to add shift: Created shift is missing ID';
          logger.warn(errorMsg, { result });
          setError(errorMsg);
          return false;
        }
        
        logger.info('Shift added successfully', { 
          shiftId: result.id,
          weekId: selectedWeekId,
          day,
          caregiver: shift.caregiver_id,
          time: `${shift.start}-${shift.end}`
        });
        
        // Refresh the schedule data
        await fetchScheduleForWeek(selectedWeekId);
        return true;
      } catch (apiError: any) {
        // Handle specific API error cases
        let errorMsg = 'Failed to add shift: ';
        
        if (apiError.response?.status === 400) {
          errorMsg += 'Invalid shift data provided';
        } else if (apiError.response?.status === 409) {
          errorMsg += 'This time slot conflicts with an existing shift';
        } else if (apiError.response?.status === 404) {
          errorMsg += 'Week or caregiver not found';
        } else if (apiError.response?.status >= 500) {
          errorMsg += 'Server error, please try again later';
        } else {
          errorMsg += apiError.message || 'Unknown error occurred';
        }
        
        logger.error('API error while adding shift', {
          error: apiError.message,
          status: apiError.response?.status,
          data: apiError.response?.data,
          requestData: shiftData
        });
        
        setError(errorMsg);
        return false;
      }
    } catch (err: any) {
      const errorMsg = `Failed to add shift: ${err.message || 'Unknown error'}`;
      logger.error('Unexpected error adding shift', {
        error: err.message,
        stack: err.stack,
        day,
        caregiver_id: shift.caregiver_id,
        selectedWeekId
      });
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // New function to delete a shift
  const deleteShift = async (shiftId: number) => {
    if (!selectedWeekId) {
      console.error('Cannot delete shift: missing selectedWeekId');
      return false;
    }
    
    try {
      setIsLoading(true);
      
      // Call the API to delete the shift
      console.log(`Deleting shift: ${shiftId}`);
      await apiService.deleteShift(shiftId);
      console.log('Delete successful');
      
      // Refresh the schedule data
      console.log(`Refreshing schedule for week: ${selectedWeekId}`);
      await fetchScheduleForWeek(selectedWeekId);
      return true;
    } catch (err: any) {
      console.error('Error deleting shift:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError(`Failed to delete shift: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getShiftStatusColor = (status: string): string => {
    switch(status) {
      case 'confirmed': return 'bg-green-100';
      case 'dropped': return 'bg-red-100';
      case 'adjusted': return 'bg-blue-100';
      case 'swap-proposed': return 'bg-purple-100';
      case 'requested-off': return 'bg-amber-100';
      default: return 'bg-gray-100';
    }
  };

  return {
    schedule,
    notifications,
    selectedDay,
    selectedShift,
    isLoading,
    error,
    handleShiftClick,
    handleDropShift,
    handleSwapShift,
    handleAdjustShift,
    approveRequest,
    getShiftStatusColor,
    setSelectedDay,
    setSelectedShift,
    addShift,
    deleteShift,
    fetchScheduleForWeek,
    fetchNotifications
  };
};