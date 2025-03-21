import { useState } from 'react';
import { WeeklySchedule, Shift, DayName, Notification } from '../types';
import { mockSchedule, mockNotifications } from '../services/mockData';
import { createTimestamp, adjustTime } from '../utils/dateUtils';

export const useSchedule = () => {
  const [schedule, setSchedule] = useState<WeeklySchedule>(mockSchedule);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [selectedDay, setSelectedDay] = useState<DayName | null>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  const handleShiftClick = (day: DayName, shift: Shift) => {
    setSelectedDay(day);
    setSelectedShift(shift);
    return { day, shift };
  };

  const handleDropShift = () => {
    if (!selectedDay || !selectedShift) return false;
    
    const updatedSchedule = {...schedule};
    const shift = updatedSchedule[selectedDay].find(s => s.id === selectedShift.id);
    
    if (shift) {
      shift.status = 'dropped';
      shift.droppedBy = shift.caregiver;
      setSchedule(updatedSchedule);
      
      const timeString = createTimestamp();
      
      // Add notification for dropped shift
      setNotifications([
        ...notifications,
        { 
          id: notifications.length + 1, 
          type: 'drop', 
          from: shift.caregiver, 
          date: selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1), 
          time: timeString,
          message: `Dropped shift (${shift.start}-${shift.end}), needs coverage`, 
          status: 'pending' 
        },
        { 
          id: notifications.length + 2, 
          type: 'suggestion', 
          from: 'System', 
          date: selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1), 
          time: timeString,
          message: `Suggested: ${shift.caregiver === 'Robin' || shift.caregiver === 'Scarlet' ? 'Joanne' : 'Scarlet'} is available to cover this shift`, 
          status: 'pending' 
        }
      ]);
      
      return true;
    }
    
    return false;
  };

  const handleSwapShift = () => {
    if (!selectedDay || !selectedShift) return false;
    
    const updatedSchedule = {...schedule};
    const shift = updatedSchedule[selectedDay].find(s => s.id === selectedShift.id);
    
    if (shift) {
      // Find who to swap with based on time of day
      const swapWith = shift.caregiver === 'Robin' ? 'Scarlet' : 
                       shift.caregiver === 'Scarlet' ? 'Robin' :
                       shift.caregiver === 'Kelly' ? 'Joanne' : 'Kelly';
                       
      shift.status = 'swap-proposed';
      shift.swapWith = swapWith;
      setSchedule(updatedSchedule);
      
      const timeString = createTimestamp();
      
      // Add notification for swap request
      setNotifications([
        ...notifications,
        { 
          id: notifications.length + 1, 
          type: 'swap', 
          from: shift.caregiver, 
          date: selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1), 
          time: timeString,
          message: `Proposed shift swap with ${swapWith}`, 
          status: 'pending' 
        }
      ]);
      
      return true;
    }
    
    return false;
  };
  
  const handleAdjustShift = () => {
    if (!selectedDay || !selectedShift) return false;
    
    const updatedSchedule = {...schedule};
    const shift = updatedSchedule[selectedDay].find(s => s.id === selectedShift.id);
    
    if (shift) {
      // For demonstration, adjust the shift by 1 hour later
      const originalStart = shift.start;
      const originalEnd = shift.end;
      
      shift.start = adjustTime(shift.start, 1);
      shift.end = adjustTime(shift.end, 1);
      shift.status = 'adjusted';
      setSchedule(updatedSchedule);
      
      const timeString = createTimestamp();
      
      // Add notification for adjusted shift
      setNotifications([
        ...notifications,
        { 
          id: notifications.length + 1, 
          type: 'adjust', 
          from: shift.caregiver, 
          date: selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1), 
          time: timeString,
          message: `Changed shift from ${originalStart}-${originalEnd} to ${shift.start}-${shift.end}`, 
          status: 'completed' 
        }
      ]);
      
      return true;
    }
    
    return false;
  };

  const approveRequest = (notificationId: number) => {
    const updatedNotifications = notifications.map(notification => 
      notification.id === notificationId ? {...notification, status: 'completed'} : notification
    );
    
    // Update the schedule based on notification type
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      const timeString = createTimestamp();
      
      if (notification.type === 'drop') {
        // Handle dropped shift confirmation
        Object.keys(schedule).forEach(day => {
          schedule[day as DayName].forEach(shift => {
            if (shift.status === 'dropped' && shift.caregiver === notification.from) {
              shift.status = 'confirmed'; // Reset to confirmed but now with new caregiver
              shift.caregiver = 'You'; // For demo, assume you're covering
              
              // Add confirmation to notifications
              const newNotification = {
                id: notifications.length + 1,
                type: 'coverage' as const,
                from: 'You',
                date: notification.date,
                time: timeString,
                message: `Confirmed coverage for ${notification.from}'s shift`,
                status: 'completed' as const
              };
              updatedNotifications.push(newNotification);
            }
          });
        });
      } else if (notification.type === 'swap') {
        // Handle swap confirmation
        Object.keys(schedule).forEach(day => {
          schedule[day as DayName].forEach(shift => {
            if (shift.status === 'swap-proposed' && shift.caregiver === notification.from) {
              // Find the other person's shift to swap with
              const otherShift = schedule[day as DayName].find(s => 
                s.caregiver === shift.swapWith
              );
              
              if (otherShift) {
                // Swap the caregivers
                const tempCaregiver = shift.caregiver;
                shift.caregiver = otherShift.caregiver;
                otherShift.caregiver = tempCaregiver;
                
                // Reset statuses
                shift.status = 'confirmed';
                otherShift.status = 'confirmed';
                delete shift.swapWith;
                
                // Add confirmation to notifications
                const newNotification = {
                  id: notifications.length + 1,
                  type: 'swap' as const,
                  from: 'System',
                  date: notification.date,
                  time: timeString,
                  message: `Confirmed shift swap between ${tempCaregiver} and ${shift.caregiver}`,
                  status: 'completed' as const
                };
                updatedNotifications.push(newNotification);
              }
            }
          });
        });
      } else if (notification.type === 'suggestion') {
        // Handle suggestion application
        const newNotification = {
          id: notifications.length + 1,
          type: 'suggestion' as const,
          from: 'System',
          date: notification.date,
          time: timeString,
          message: `Applied suggested solution: ${notification.message}`,
          status: 'completed' as const
        };
        updatedNotifications.push(newNotification);
      }
      
      setSchedule({...schedule});
      setNotifications(updatedNotifications);
      return true;
    }
    
    return false;
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
    handleShiftClick,
    handleDropShift,
    handleSwapShift,
    handleAdjustShift,
    approveRequest,
    getShiftStatusColor,
    setSelectedDay,
    setSelectedShift
  };
};