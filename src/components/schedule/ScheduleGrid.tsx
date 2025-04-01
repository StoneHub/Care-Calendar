import React, { useEffect } from 'react';
import { WeeklySchedule, DayName, Shift, Week } from '../../types';
import DayHeader from './DayHeader';
import ShiftCard from '../shared/ShiftCard';

interface ScheduleGridProps {
  schedule: WeeklySchedule;
  selectedWeek: Week | null;
  onShiftClick: (day: DayName, shift: Shift) => void;
  getShiftStatusColor: (status: string) => string;
  onDayClick?: (day: DayName) => void; // Add callback for day clicks
}

const ScheduleGrid: React.FC<ScheduleGridProps> = ({ 
  schedule, 
  selectedWeek,
  onShiftClick, 
  getShiftStatusColor,
  onDayClick 
}) => {
  // Debug log when selectedWeek changes
  useEffect(() => {
    if (selectedWeek) {
      console.log('ScheduleGrid rendering with week:', {
        id: selectedWeek.id,
        start_date: selectedWeek.start_date,
        end_date: selectedWeek.end_date
      });
    }
  }, [selectedWeek]);
  
  // Make sure days are in correct order (Monday to Sunday)
  const orderedDays: DayName[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Schedule Header */}
      <div className="grid grid-cols-7 border-b">
        {orderedDays.map((day) => (
          <div key={day} className="p-2 border-r last:border-r-0">
            <DayHeader day={day} selectedWeek={selectedWeek} />
          </div>
        ))}
      </div>
      
      {/* Schedule Grid */}
      <div className="grid grid-cols-7 text-sm">
        {orderedDays.map((day) => (
          <div 
            key={day} 
            className="border-r last:border-r-0 min-h-64 relative"
            onClick={onDayClick ? () => onDayClick(day) : undefined}
          >
            {/* Add empty state with clickable area when no shifts */}
            {(!schedule[day] || schedule[day].length === 0) && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            )}
            
            {/* Render shifts */}
            {(schedule[day] || []).map((shift) => (
              <ShiftCard 
                key={shift.id}
                shift={shift}
                onClick={(e) => {
                  // Stop propagation to parent div to prevent both handlers firing
                  e.stopPropagation();
                  onShiftClick(day, shift);
                }}
                statusColorClass={getShiftStatusColor(shift.status)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScheduleGrid;