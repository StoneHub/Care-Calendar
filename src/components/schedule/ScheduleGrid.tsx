import React, { useEffect } from 'react';
import { WeeklySchedule, DayName, Shift, Week } from '../../types';
import DayHeader from './DayHeader';
import ShiftCard from '../shared/ShiftCard';

interface ScheduleGridProps {
  schedule: WeeklySchedule;
  selectedWeek: Week | null;
  onShiftClick: (day: DayName, shift: Shift) => void;
  getShiftStatusColor: (status: string) => string;
}

const ScheduleGrid: React.FC<ScheduleGridProps> = ({ 
  schedule, 
  selectedWeek,
  onShiftClick, 
  getShiftStatusColor 
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
          <div key={day} className="border-r last:border-r-0 min-h-64">
            {(schedule[day] || []).map((shift) => (
              <ShiftCard 
                key={shift.id}
                shift={shift}
                onClick={() => onShiftClick(day, shift)}
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