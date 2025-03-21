import React from 'react';
import { WeeklySchedule, DayName, Shift } from '../../types';
import DayHeader from './DayHeader';
import ShiftCard from '../shared/ShiftCard';

interface ScheduleGridProps {
  schedule: WeeklySchedule;
  onShiftClick: (day: DayName, shift: Shift) => void;
  getShiftStatusColor: (status: string) => string;
}

const ScheduleGrid: React.FC<ScheduleGridProps> = ({ 
  schedule, 
  onShiftClick, 
  getShiftStatusColor 
}) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Schedule Header */}
      <div className="grid grid-cols-7 border-b">
        {Object.keys(schedule).map((day) => (
          <div key={day} className="p-2 border-r last:border-r-0">
            <DayHeader day={day as DayName} />
          </div>
        ))}
      </div>
      
      {/* Schedule Grid */}
      <div className="grid grid-cols-7 text-sm">
        {Object.entries(schedule).map(([day, shifts]) => (
          <div key={day} className="border-r last:border-r-0 min-h-64">
            {shifts.map((shift) => (
              <ShiftCard 
                key={shift.id}
                shift={shift}
                onClick={() => onShiftClick(day as DayName, shift)}
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