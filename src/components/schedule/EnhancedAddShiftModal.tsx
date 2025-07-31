import React, { useState, useEffect } from 'react';
import { DayName } from '../../types';
import { logger } from '../../utils/logger';
import { dateService } from '../../services/core/DateService';
import { useScheduleData } from '../../context/ScheduleContext';
import { useTeam } from '../../context/TeamContext';
import { useAppStatus } from '../../context/AppStatusContext';
import { useTheme } from '../../context/ThemeContext';

interface EnhancedAddShiftModalProps {
  initialDay?: DayName | null;
  onClose: () => void;
}

const EnhancedAddShiftModal: React.FC<EnhancedAddShiftModalProps> = ({
  initialDay = null,
  onClose
}) => {
  // Get context data
  const { selectedWeek, weeks, addShift } = useScheduleData();
  const { caregivers } = useTeam();
  const { isLoading, error: contextError } = useAppStatus();
  
  // Get theme (but don't use it to avoid lint error)
  useTheme();
  
  // Local state
  const [day, setDay] = useState<DayName>(initialDay || 'monday');
  const [caregiver, setCaregiver] = useState<number>(0);
  const [startTime, setStartTime] = useState<string>('9:00 AM');
  const [endTime, setEndTime] = useState<string>('5:00 PM');
  const [weekId, setWeekId] = useState<number | null>(selectedWeek?.id || null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [formTouched, setFormTouched] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isTimeOff, setIsTimeOff] = useState<boolean>(false);
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringEndDate, setRecurringEndDate] = useState<string>('');
  
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
  
  // Calculate end of year date for recurring events
  const endOfYearDate = new Date();
  endOfYearDate.setMonth(11); // December (0-indexed)
  endOfYearDate.setDate(31);
  const endOfYearISODate = endOfYearDate.toISOString().split('T')[0];

  // Set initial recurring end date to end of year
  useEffect(() => {
    if (!recurringEndDate) {
      setRecurringEndDate(endOfYearISODate);
    }
  }, []);
  
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
    
    // Just log the selection, but don't change the context's selectedWeek
    logger.info('Week selected in add shift modal', {
      weekId: newWeekId,
      currentContextWeek: selectedWeek?.id
    });
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
  
  // Get the selected date string in YYYY-MM-DD format
  const getSelectedDate = (): string => {
    if (!weekId) return '';
    
    const selectedWeekObj = weeks.find(w => w.id === weekId);
    if (!selectedWeekObj) return '';
    
    const dayDate = dateService.getDayDate(day, selectedWeekObj);
    return dayDate.toISOString().split('T')[0];
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark form as touched
    setFormTouched(true);
    
    // Validate form
    if (!validateForm() || !weekId) {
      return;
    }
    
    // Prevent double submission
    if (isLoading || submitting) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      if (isTimeOff) {
        // Handle unavailability creation
        logger.info('Adding unavailability record', {
          caregiver,
          startDate: getSelectedDate(),
          endDate: getSelectedDate(),
          isRecurring,
          recurringEndDate: isRecurring ? recurringEndDate : undefined
        });

        // Prepare unavailability data - TODO: Add unavailability context
        setLocalError('Time off functionality will be added in a future update.');
        return;
      } else {
        // Handle regular shift creation
        logger.info('Add shift form validated successfully', {
          day,
          caregiver,
          weekId,
          startTime,
          endTime,
          isRecurring
        });
        
        // Get caregiver name
        const selectedCaregiver = caregivers.find((c: any) => c.id === caregiver);
        
        // Prepare shift data
        const shiftData = {
          caregiver: selectedCaregiver?.name || 'Unknown',
          caregiver_id: caregiver,
          start: startTime,
          end: endTime,
          week_id: weekId,
          day: day,
          is_recurring: isRecurring,
          recurring_end_date: isRecurring ? recurringEndDate : undefined
        };
        
        // Call addShift with the proper signature
        const success = await addShift(shiftData);
        
        if (success) {
          logger.info('Shift added successfully');
          onClose();
        } else {
          logger.error('Failed to add shift');
          setLocalError(contextError || 'Failed to add shift. Please try again.');
        }
      }
    } catch (err: any) {
      logger.error('Error in form submission', {
        error: err.message
      });
      setLocalError(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium dark:text-white">{isTimeOff ? 'Add Time Off' : 'Add New Shift'}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Error message */}
        {(localError || contextError) && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-600 text-red-700 dark:text-red-300">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
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
          {/* Entry Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Entry Type
            </label>
            <div className="flex mt-1 space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-blue-600"
                  name="entryType"
                  checked={!isTimeOff}
                  onChange={() => setIsTimeOff(false)}
                  disabled={isLoading || submitting}
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">Shift</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-purple-600"
                  name="entryType"
                  checked={isTimeOff}
                  onChange={() => setIsTimeOff(true)}
                  disabled={isLoading || submitting}
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">Time Off</span>
              </label>
            </div>
          </div>
          {/* Week Selection */}
          <div>
            <label htmlFor="weekSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Week
            </label>
            <select 
              id="weekSelect"
              className={`w-full p-2 border ${!weekId && formTouched ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
              value={weekId || ''}
              onChange={handleWeekChange}
              disabled={isLoading || submitting}
              aria-label="Select Week"
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
            <label htmlFor="daySelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Day
            </label>
            <select 
              id="daySelect"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              value={day}
              onChange={(e) => {
                setDay(e.target.value as DayName);
                setFormTouched(true);
              }}
              disabled={isLoading || submitting}
              aria-label="Select Day"
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
            <label htmlFor="caregiverSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Caregiver
            </label>
            <select 
              id="caregiverSelect"
              className={`w-full p-2 border ${!caregiver && formTouched ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
              value={caregiver}
              onChange={(e) => {
                setCaregiver(Number(e.target.value));
                setFormTouched(true);
              }}
              disabled={isLoading || submitting}
              aria-label="Select Caregiver"
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
          
          {/* Recurring Option */}
          <div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="isRecurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                disabled={isLoading || submitting}
                aria-label="Repeats Weekly"
              />
              <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Repeats Weekly
              </label>
            </div>
            
            {isRecurring && (
              <div className="mt-2">
                <label htmlFor="recurringEndDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Repeat Until
                </label>
                <input
                  id="recurringEndDate"
                  type="date"
                  value={recurringEndDate}
                  onChange={(e) => setRecurringEndDate(e.target.value)}
                  min={getSelectedDate()}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={isLoading || submitting}
                  aria-label="Repeat Until Date"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  If blank, will repeat until end of year
                </p>
              </div>
            )}
          </div>
          
          {/* Time Selection Section */}
          {!isTimeOff && (
            <React.Fragment>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startTimeSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Time
                  </label>
                  <select 
                    id="startTimeSelect"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      setFormTouched(true);
                    }}
                    disabled={isLoading || submitting}
                    aria-label="Select Start Time"
                  >
                    {timeOptions.map(time => (
                      <option key={`start-${time}`} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="endTimeSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Time
                  </label>
                  <select 
                    id="endTimeSelect"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(e.target.value);
                      setFormTouched(true);
                    }}
                    disabled={isLoading || submitting}
                    aria-label="Select End Time"
                  >
                    {timeOptions.map(time => (
                      <option key={`end-${time}`} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                {formTouched && startTime && endTime && timeOptions.indexOf(startTime) >= timeOptions.indexOf(endTime) && (
                  <p className="text-xs text-red-500 mt-1">End time must be after start time</p>
                )}
              </div>
            </React.Fragment>
          )}
          
          {/* Action buttons */}
          <div className="flex justify-end space-x-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800"
              disabled={isLoading || submitting}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || submitting}
            >
              {(isLoading || submitting) ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </span>
              ) : (
                isTimeOff ? 'Add Time Off' : 'Add Shift'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedAddShiftModal;
