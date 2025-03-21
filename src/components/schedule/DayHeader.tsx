import React from 'react';
import { DayName } from '../../types';
import { formatDayTitle } from '../../utils/dateUtils';

interface DayHeaderProps {
  day: DayName;
}

const DayHeader: React.FC<DayHeaderProps> = ({ day }) => {
  const { dayName, dateStr, isToday } = formatDayTitle(day);
  
  return (
    <div className={`text-center ${isToday ? 'font-bold bg-blue-100 rounded-t-lg' : ''}`}>
      <div className="text-sm uppercase">{dayName}</div>
      <div className="text-lg">{dateStr}</div>
    </div>
  );
};

export default DayHeader;