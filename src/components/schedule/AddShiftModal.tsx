import React, { useState, useEffect } from 'react';
import { DayName, Caregiver, Week } from '../../types';

interface AddShiftModalProps {
  selectedDay: DayName | null;
  caregivers: Caregiver[];
  selectedWeek: Week | null;
  weeks: Week[];
  onClose: () => void;
  onAddShift: (day: DayName, shiftData: { caregiver_id: number, start: string, end: string, status: string }) => Promise<boolean>;
  onSelectWeek?: (weekId: number) => void;
}

// Map of days for user-friendly display
const dayDisplayNames: Record<DayName, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
};

const AddShiftModal: React.FC<AddShiftModalProps> = ({
  selectedDay,
  caregivers,
  selectedWeek,
  weeks,
  onClose,
  onAddShift,
  onSelectWeek
}) => {
  const [day, setDay] = useState<DayName>(selectedDay || 'monday');
  const [caregiver, setCaregiver] = useState<number>(0);
  const [startTime, setStartTime] = useState<string>('9:00 AM');
  const [endTime, setEndTime] = useState<string>('5:00 PM');
  const [weekId, setWeekId] = useState<number | null>(selectedWeek?.id || null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set default caregiver ID when caregivers array is loaded
    if (caregivers.length > 0 && caregiver === 0) {
      setCaregiver(caregivers[0].id);
    }
    
    // Update day when selectedDay changes
    if (selectedDay) {
      setDay(selectedDay);
    }

    // Update week ID when selectedWeek changes
    if (selectedWeek) {
      setWeekId(selectedWeek.id);
    }
  }, [caregivers, selectedDay, selectedWeek]);

  // Get days of the week for the dropdown
  const days: DayName[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // Time options for dropdowns
  const timeOptions = [
    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM',
    '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'
  ];

  // Format the date range for dropdown display
  const formatWeekDateRange = (week: Week) => {
    const startDate = new Date(week.start_date);
    const endDate = new Date(week.end_date);
    
    const startMonth = startDate.toLocaleString('default', { month: 'short' });
    const startDay = startDate.getDate();
    const endMonth = endDate.toLocaleString('default', { month: 'short' });
    const endDay = endDate.getDate();
    const year = endDate.getFullYear();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}, ${year}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
  };

  // Sort weeks by start date for the dropdown
  const sortedWeeks = [...weeks].sort((a, b) => 
    new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    // Validate input
    if (!caregiver) {
      setError('Please select a caregiver');
      setIsSubmitting(false);
      return;
    }
    
    if (!startTime || !endTime) {
      setError('Please select both start and end times');
      setIsSubmitting(false);
      return;
    }
    
    // Validate that end time is after start time
    const startIndex = timeOptions.indexOf(startTime);
    const endIndex = timeOptions.indexOf(endTime);
    
    if (startIndex >= endIndex) {
      setError('End time must be after start time');
      setIsSubmitting(false);
      return;
    }

    // Change the current week if needed and onSelectWeek is provided
    if (weekId && weekId !== selectedWeek?.id && onSelectWeek) {
      onSelectWeek(weekId);
    }

    try {
      const success = await onAddShift(day, {
        caregiver_id: caregiver,
        start: startTime,
        end: endTime,
        status: 'confirmed'
      });
      
      if (success) {
        onClose();
      } else {
        setError('Failed to add shift. Please try again.');
      }
    } catch (err) {
      console.error('Error adding shift:', err);
      setError('An error occurred while adding the shift.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h3 className="text-lg font-medium mb-4">Add New Shift</h3>
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 border border-red-300 text-red-800 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* Week Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Week
            </label>
            <select 
              className="w-full p-2 border border-gray-300 rounded"
              value={weekId || ''}
              onChange={(e) => setWeekId(Number(e.target.value))}
              disabled={isSubmitting}
            >
              <option value="" disabled>Select a week</option>
              {sortedWeeks.map(week => (
                <option key={week.id} value={week.id}>
                  {formatWeekDateRange(week)}
                  {week.id === selectedWeek?.id ? ' (Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Day Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Day
            </label>
            <select 
              className="w-full p-2 border border-gray-300 rounded"
              value={day}
              onChange={(e) => setDay(e.target.value as DayName)}
              disabled={isSubmitting}
            >
              {days.map(dayOption => (
                <option key={dayOption} value={dayOption}>
                  {dayDisplayNames[dayOption]}
                </option>
              ))}
            </select>
          </div>
          
          {/* Caregiver Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Caregiver
            </label>
            <select 
              className="w-full p-2 border border-gray-300 rounded"
              value={caregiver}
              onChange={(e) => setCaregiver(Number(e.target.value))}
              disabled={isSubmitting}
            >
              <option value={0} disabled>Select a caregiver</option>
              {caregivers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.role})
                </option>
              ))}
            </select>
          </div>
          
          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <select 
                className="w-full p-2 border border-gray-300 rounded"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isSubmitting}
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
                className="w-full p-2 border border-gray-300 rounded"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={isSubmitting}
              >
                {timeOptions.map(time => (
                  <option key={`end-${time}`} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddShiftModal;