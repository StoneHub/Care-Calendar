import React, { useEffect } from 'react';
import { DayName, Week } from '../../types';
import { formatDayTitle } from '../../utils/dateUtils';

interface DayHeaderProps {
  day: DayName;
  selectedWeek?: Week | null;
}

const DayHeader: React.FC<DayHeaderProps> = ({ day, selectedWeek }) => {
  const { dayName, dateStr, isToday } = formatDayTitle(day, selectedWeek);
  
  // Debug log when selectedWeek changes
  useEffect(() => {
    if (selectedWeek && day === 'monday') {
      console.log(`DayHeader for ${day} rendering with week:`, {
        weekId: selectedWeek.id,
        weekStart: selectedWeek.start_date,
        weekEnd: selectedWeek.end_date,
        calculatedDate: dateStr
      });
    }
  }, [selectedWeek, day, dateStr]);
  
  return (
    <div className={`text-center ${isToday ? 'font-bold bg-blue-100 rounded-t-lg' : ''}`}>
      <div className="text-sm uppercase">{dayName}</div>
      <div className="text-lg">{dateStr}</div>
    </div>
  );
};

export default DayHeader;