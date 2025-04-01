import React, { useEffect } from 'react';
import { DayName, Week } from '../../types';
import { formatDayTitle } from '../../utils/dateUtils';

interface DayHeaderProps {
  day: DayName;
  selectedWeek?: Week | null;
}

const DayHeader: React.FC<DayHeaderProps> = ({ day, selectedWeek }) => {
  const { dayName, dateStr, isToday } = formatDayTitle(day, selectedWeek);
  
  // Check if this week contains today's date (needed to conditionally show today highlight)
  const isCurrentWeek = (): boolean => {
    if (!selectedWeek) return false;
    
    const today = new Date();
    const weekStart = new Date(selectedWeek.start_date);
    const weekEnd = new Date(selectedWeek.end_date);
    
    return today >= weekStart && today <= weekEnd;
  };
  
  // Only highlight today if we're viewing the current week
  const shouldHighlightToday = isToday && isCurrentWeek();
  
  // Debug log when selectedWeek changes
  useEffect(() => {
    if (selectedWeek && day === 'monday') {
      console.log(`DayHeader for ${day} rendering with week:`, {
        weekId: selectedWeek.id,
        weekStart: selectedWeek.start_date,
        weekEnd: selectedWeek.end_date,
        calculatedDate: dateStr,
        isToday,
        isCurrentWeek: isCurrentWeek(),
        shouldHighlight: shouldHighlightToday
      });
    }
  }, [selectedWeek, day, dateStr, isToday]);
  
  return (
    <div className={`text-center ${shouldHighlightToday ? 'font-bold bg-blue-100 rounded-t-lg' : ''}`}>
      <div className="text-sm uppercase">{dayName}</div>
      <div className="text-lg">{dateStr}</div>
    </div>
  );
};

export default DayHeader;