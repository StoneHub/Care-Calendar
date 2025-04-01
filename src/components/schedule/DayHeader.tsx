import React, { useEffect } from 'react';
import { DayName, Week } from '../../types';
import { dateService } from '../../services/core/DateService';

interface DayHeaderProps {
  day: DayName;
  selectedWeek: Week | null;
}

const DayHeader: React.FC<DayHeaderProps> = ({ day, selectedWeek }) => {
  const { dayName, dateStr, isToday } = dateService.getDayInfo(day, selectedWeek);
  
  // Check if this week contains today's date (needed to conditionally show today highlight)
  const isCurrentWeek = (): boolean => {
    if (!selectedWeek) return false;
    return dateService.isDateInWeek(new Date(), selectedWeek);
  };
  
  // Only highlight today if we're viewing the current week
  const shouldHighlightToday = isToday && isCurrentWeek();
  
  // Improved debug logging with more accurate information
  useEffect(() => {
    if (selectedWeek && day === 'monday') {
      console.log(`DayHeader for ${day} rendering with week:`, {
        weekId: selectedWeek.id,
        weekStart: selectedWeek.start_date,
        weekEnd: selectedWeek.end_date,
        calculatedDate: dateStr,
        isToday,
        isCurrentWeek: isCurrentWeek(),
        shouldHighlight: shouldHighlightToday,
        today: new Date().toLocaleDateString()
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