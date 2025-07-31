import React, { useMemo } from 'react';
import { DayName, Shift, Unavailability } from '../../types';
import { useScheduleData } from '../../context/ScheduleContext';
import { useAppStatus } from '../../context/AppStatusContext';
import { dateService } from '../../services/core/DateService';
import ShiftCard from '../shared/ShiftCard';

interface EnhancedScheduleGridProps {
  onDayClick?: (day: DayName) => void;
  onShiftClick?: (day: DayName, shift: Shift) => void;
}

const EnhancedScheduleGrid: React.FC<EnhancedScheduleGridProps> = ({ 
  onDayClick, 
  onShiftClick 
}) => {
  // Ensure days are in correct order (Monday to Sunday)
  const orderedDays: DayName[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // Get data from context
  const { schedule, selectedWeek } = useScheduleData();
  const { isLoading, error } = useAppStatus();
  
  // For now, create empty unavailability until we add that context
  const unavailability: Unavailability[] = [];
  
  // Group unavailability by day for the selected week
  const unavailabilityByDay = useMemo(() => {
    const result: Record<DayName, Unavailability[]> = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    };
    
    // Since unavailability is empty for now, just return the initialized result
    return result;
  }, [unavailability, selectedWeek]);
  
  // Function to determine shift status color
  const getShiftStatusColor = (status: string): string => {
    switch(status) {
      case 'confirmed': return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-800';
      case 'dropped': return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-800';
      case 'adjusted': return 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-800';
      case 'swap-proposed': return 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-800';
      case 'requested-off': return 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-800';
      default: return 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600';
    }
  };

  // No longer need the renderShiftCard function as we're using the ShiftCard component
  
  // If loading, show a skeleton UI
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden animate-pulse">
        <div className="grid grid-cols-7 border-b">
          {orderedDays.map((day) => (
            <div key={day} className="p-2 border-r last:border-r-0">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 text-sm">
          {orderedDays.map((day) => (
            <div key={day} className="border-r last:border-r-0 min-h-64 p-2">
              <div className="h-20 bg-gray-100 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-20 bg-gray-100 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // If error, show error message
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center text-red-500 dark:text-red-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="font-medium">Error loading schedule</p>
        <p className="text-sm mt-1">{error}</p>
        <button 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Schedule Header */}
      <div className="grid grid-cols-7 border-b">
        {orderedDays.map((day) => {
          // Get day info from the date service
          const dayInfo = dateService.getDayInfo(day, selectedWeek);
          const isActuallyToday = dayInfo.isToday; // Does the calculated date match today?
          const isCurrentWeekSelected = selectedWeek ? dateService.isCurrentWeek(selectedWeek) : false; // Is the currently viewed week the real current week?
          const shouldHighlightToday = isActuallyToday && isCurrentWeekSelected;
          
          return (
            <div key={day} className={`p-2 border-r last:border-r-0 text-center ${shouldHighlightToday ? 'bg-blue-50 dark:bg-blue-900/30' : 'dark:border-gray-700'} dark:text-white`}>
              <div className="font-medium">{dayInfo.dayName}</div>
              <div className={`text-lg ${shouldHighlightToday ? 'font-bold text-blue-700 dark:text-blue-400' : 'dark:text-white'}`}>{dayInfo.dateStr}</div>
              {shouldHighlightToday && <div className="text-xs text-blue-500 dark:text-blue-400">Today</div>}
            </div>
          );
        })}
      </div>
      
      {/* Schedule Grid */}
      <div className="grid grid-cols-7 text-sm">
        {orderedDays.map((day) => (
          <div 
            key={day} 
            className="border-r last:border-r-0 dark:border-gray-700 min-h-64 relative p-2 dark:bg-gray-800"
            onClick={() => onDayClick && onDayClick(day)}
          >
            {/* Empty state with add button when no shifts */}
            {(!schedule[day] || schedule[day].length === 0) && (
              <div 
                className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onDayClick) onDayClick(day);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="mt-2 text-sm">Add Shift</span>
              </div>
            )}
            
            {/* Render unavailability markers */}
            {(unavailabilityByDay[day] || []).map((item) => (
              <div 
                key={`unavailable-${item.id}`}
                className="mb-2 p-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs rounded border border-red-300 dark:border-red-700"
              >
                <div className="font-medium">{item.caregiverName}</div>
                <div>Unavailable {item.isRecurring ? '(Weekly)' : ''}</div>
                {item.reason && <div className="text-red-700 dark:text-red-300">{item.reason}</div>}
              </div>
            ))}
            
            {/* Render shifts */}
            {(schedule[day] || []).map((shift) => (
              <ShiftCard 
                key={shift.id}
                shift={shift}
                statusColorClass={getShiftStatusColor(shift.status)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onShiftClick) onShiftClick(day, shift);
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnhancedScheduleGrid;
