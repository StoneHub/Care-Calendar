import React, { useState, useEffect } from 'react';
import { DayName } from '../../types';
import { logger } from '../../utils/logger';
import { dateService } from '../../services/core/DateService';
import { useScheduleContext } from '../../context/ScheduleContext';

interface EnhancedAddShiftModalProps {
  initialDay?: DayName | null;
  onClose: () => void;
}

const EnhancedAddShiftModal: React.FC<EnhancedAddShiftModalProps> = ({
  initialDay = null,
  onClose
}) => {
  // Get context data
  const { 
    caregivers, 
    selectedWeek, 
    weeks, 
    addShift,
    selectWeek,
    isLoading, 
    error: contextError 
  } = useScheduleContext();
  
  // Local state
  const [day, setDay] = useState<DayName>(initialDay || 'monday');
  const [caregiver, setCaregiver] = useState<number>(0);
  const [startTime, setStartTime] = useState<string>('9:00 AM');
  const [endTime, setEndTime] = useState<string>('5:00 PM');
  const [weekId, setWeekId] = useState<number | null>(selectedWeek?.id || null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [formTouched, setFormTouched] = useState<boolean>(false);
  
  // Generate time options using the date service
  const timeOptions = dateService.generateTimeOptions(60); // 1 hour intervals
  
  // Set initial caregiver when data loads
  useEffect(() => {
    if (caregivers.length > 0 && caregiver === 0) {
      setCaregiver(caregivers[0].id);
    }
  }, [caregivers]);
  
  // Update day when initialDay changes
  useEffect(() => {
    if (initialDay) {
      setDay(initialDay);
    }
  }, [initialDay]);
  
  // Update week ID when selectedWeek changes
  useEffect(() => {
    if (selectedWeek) {
      setWeekId(selectedWeek.id);
    }
  }, [selectedWeek]);
  
  // Reset local error when context error changes
  useEffect(() => {
    if (contextError) {
      setLocalError(contextError);
    }
  }, [contextError]);
  
  // Days of the week
  const days: DayName[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  // Display names for days
  const dayDisplayNames: Record<DayName, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };
  
  // Handle week selection
  const handleWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newWeekId = Number(e.target.value);
    setWeekId(newWeekId);
    setFormTouched(true);
    
    // Check if we need to change the selected week
    if (newWeekId !== selectedWeek?.id) {
      const selectedWeekObj = weeks.find(w => w.id === newWeekId);
      if (selectedWeekObj) {
        logger.info('Changing selected week in add shift modal', {
          from: selectedWeek?.id,
          to: newWeekId
        });
      }
    }
  };
  
  // Form validation
  const validateForm = (): boolean => {
    if (!weekId) {
      setLocalError('Please select a week');
      return false;
    }
    
    if (!caregiver) {
      setLocalError('Please select a caregiver');
      return false;
    }
    
    if (!startTime || !endTime) {
      setLocalError('Please select both start and end times');
      return false;
    }
    
    // Validate start time is before end time
    const startIndex = timeOptions.indexOf(startTime);
    const endIndex = timeOptions.indexOf(endTime);
    
    if (startIndex >= endIndex) {
      setLocalError('End time must be after start time');
      return false;
    }
    
    setLocalError(null);
    return true;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark form as touched
    setFormTouched(true);
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    logger.info('Add shift form validated successfully', {
      day,
      caregiver,
      weekId,
      startTime,
      endTime
    });
    
    // If the selected week is different from the form week, update it first
    if (weekId && weekId !== selectedWeek?.id) {
      logger.info('Updating selected week before adding shift', {
        fromWeekId: selectedWeek?.id,
        toWeekId: weekId
      });
      
      selectWeek(weekId);
      
      // Set an informational message
      setLocalError('Changing to selected week. Please try submitting again in a moment.');
      return;
    }
    
    // Add the shift
    const shiftData = {
      caregiver_id: caregiver,
      start: startTime,
      end: endTime,
      status: 'confirmed'
    };
    
    try {
      const success = await addShift(day, shiftData as any);
      
      if (success) {
        logger.info('Shift added successfully');
        onClose();
      } else {
        logger.error('Failed to add shift');
        setLocalError(contextError || 'Failed to add shift. Please try again.');
      }
    } catch (err: any) {
      logger.error('Error in add shift form submission', {
        error: err.message
      });
      setLocalError(`Error: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Add New Shift</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Error message */}
        {(localError || contextError) && (
          <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{localError || contextError}</p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Week Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Week
            </label>
            <select 
              className={`w-full p-2 border ${!weekId && formTouched ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-blue-500 focus:border-blue-500`}
              value={weekId || ''}
              onChange={handleWeekChange}
              disabled={isLoading}
            >
              <option value="" disabled>Select a week</option>
              {dateService.sortWeeksByDate(weeks).map(week => (
                <option key={week.id} value={week.id}>
                  {dateService.formatWeekRangeForDisplay(week)}
                  {week.id === selectedWeek?.id ? ' (Current)' : ''}
                </option>
              ))}
            </select>
            {!weekId && formTouched && (
              <p className="mt-1 text-xs text-red-500">Please select a week</p>
            )}
          </div>

          {/* Day Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Day
            </label>
            <select 
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              value={day}
              onChange={(e) => {
                setDay(e.target.value as DayName);
                setFormTouched(true);
              }}
              disabled={isLoading}
            >
              {days.map(dayOption => {
                // Get the date for this day based on the selected week
                const weekObj = weekId ? weeks.find(w => w.id === weekId) : selectedWeek;
                const dayInfo = dateService.getDayInfo(dayOption, weekObj || null);
                
                return (
                  <option key={dayOption} value={dayOption}>
                    {dayDisplayNames[dayOption]} ({dayInfo.dateStr}) {dayInfo.isToday ? '- Today' : ''}
                  </option>
                );
              })}
            </select>
          </div>
          
          {/* Caregiver Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Caregiver
            </label>
            <select 
              className={`w-full p-2 border ${!caregiver && formTouched ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-blue-500 focus:border-blue-500`}
              value={caregiver}
              onChange={(e) => {
                setCaregiver(Number(e.target.value));
                setFormTouched(true);
              }}
              disabled={isLoading}
            >
              <option value={0} disabled>Select a caregiver</option>
              {caregivers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.role})
                </option>
              ))}
            </select>
            {!caregiver && formTouched && (
              <p className="mt-1 text-xs text-red-500">Please select a caregiver</p>
            )}
          </div>
          
          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <select 
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setFormTouched(true);
                }}
                disabled={isLoading}
              >
                {timeOptions.map(time => (
                  <option key={`start-${time}`} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <select 
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  setFormTouched(true);
                }}
                disabled={isLoading}
              >
                {timeOptions.map(time => (
                  <option key={`end-${time}`} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Invalid time range error */}
          {formTouched && startTime && endTime && timeOptions.indexOf(startTime) >= timeOptions.indexOf(endTime) && (
            <p className="text-xs text-red-500">End time must be after start time</p>
          )}
          
          {/* Action buttons */}
          <div className="flex justify-end space-x-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </span>
              ) : (
                'Add Shift'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedAddShiftModal;
