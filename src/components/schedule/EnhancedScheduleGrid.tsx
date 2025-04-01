import React from 'react';
import { DayName, Shift } from '../../types';
import { useScheduleContext } from '../../context/ScheduleContext';
import { dateService } from '../../services/core/DateService';

interface EnhancedScheduleGridProps {
  onDayClick?: (day: DayName) => void;
  onShiftClick?: (day: DayName, shift: Shift) => void;
}

const EnhancedScheduleGrid: React.FC<EnhancedScheduleGridProps> = ({ 
  onDayClick, 
  onShiftClick 
}) => {
  // Get data from context
  const { schedule, selectedWeek, isLoading, error } = useScheduleContext();
  
  // Ensure days are in correct order (Monday to Sunday)
  const orderedDays: DayName[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  // Function to determine shift status color
  const getShiftStatusColor = (status: string): string => {
    switch(status) {
      case 'confirmed': return 'bg-green-100 border-green-300';
      case 'dropped': return 'bg-red-100 border-red-300';
      case 'adjusted': return 'bg-blue-100 border-blue-300';
      case 'swap-proposed': return 'bg-purple-100 border-purple-300';
      case 'requested-off': return 'bg-amber-100 border-amber-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  // Render a single shift card
  const renderShiftCard = (shift: Shift, day: DayName) => (
    <div 
      key={shift.id} 
      className={`p-2 mb-2 rounded border ${getShiftStatusColor(shift.status)} hover:shadow-md transition-all cursor-pointer`}
      onClick={(e) => {
        e.stopPropagation();
        if (onShiftClick) onShiftClick(day, shift);
      }}
    >
      <div className="font-medium">{shift.caregiver}</div>
      <div className="text-sm text-gray-600">{shift.start} - {shift.end}</div>
      {shift.status !== 'confirmed' && (
        <div className="mt-1 text-xs inline-block px-1.5 py-0.5 rounded bg-white">
          {shift.status.replace('-', ' ')}
        </div>
      )}
    </div>
  );
  
  // If loading, show a skeleton UI
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden animate-pulse">
        <div className="grid grid-cols-7 border-b">
          {orderedDays.map((day) => (
            <div key={day} className="p-2 border-r last:border-r-0">
              <div className="h-6 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 text-sm">
          {orderedDays.map((day) => (
            <div key={day} className="border-r last:border-r-0 min-h-64 p-2">
              <div className="h-20 bg-gray-100 rounded mb-2"></div>
              <div className="h-20 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // If error, show error message
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4 text-center text-red-500">
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
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Schedule Header */}
      <div className="grid grid-cols-7 border-b">
        {orderedDays.map((day) => {
          // Get day info from the date service
          const dayInfo = dateService.getDayInfo(day, selectedWeek);
          const isToday = dayInfo.isToday && dateService.isDateInWeek(new Date(), selectedWeek!);
          
          return (
            <div key={day} className={`p-2 border-r last:border-r-0 text-center ${isToday ? 'bg-blue-50' : ''}`}>
              <div className="font-medium">{dayInfo.dayName}</div>
              <div className={`text-lg ${isToday ? 'font-bold text-blue-700' : ''}`}>{dayInfo.dateStr}</div>
              {isToday && <div className="text-xs text-blue-500">Today</div>}
            </div>
          );
        })}
      </div>
      
      {/* Schedule Grid */}
      <div className="grid grid-cols-7 text-sm">
        {orderedDays.map((day) => (
          <div 
            key={day} 
            className="border-r last:border-r-0 min-h-64 relative p-2"
            onClick={() => onDayClick && onDayClick(day)}
          >
            {/* Empty state with add button when no shifts */}
            {(!schedule[day] || schedule[day].length === 0) && (
              <div 
                className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
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
            
            {/* Render shifts */}
            {(schedule[day] || []).map((shift) => renderShiftCard(shift, day))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnhancedScheduleGrid;
