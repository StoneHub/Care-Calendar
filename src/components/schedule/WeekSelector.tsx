import React, { useState } from 'react';
import { Week } from '../../types';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

interface WeekSelectorProps {
  weeks: Week[];
  currentWeek: Week | null;
  selectedWeek: Week | null;
  onSelectWeek: (weekId: number) => void;
}

const WeekSelector: React.FC<WeekSelectorProps> = ({
  weeks,
  currentWeek,
  selectedWeek,
  onSelectWeek
}) => {
  const [expanded, setExpanded] = useState(false);
  
  // Sort weeks by start date (chronological order)
  const sortedWeeks = [...weeks].sort((a, b) => 
    new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );
  
  // Find the index of the selected week
  const currentIndex = selectedWeek 
    ? sortedWeeks.findIndex(w => w.id === selectedWeek.id)
    : -1;
  
  // Format the date range for display
  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
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
  
  // Navigate to previous week
  const goToPrevWeek = () => {
    if (currentIndex > 0) {
      onSelectWeek(sortedWeeks[currentIndex - 1].id);
    }
  };
  
  // Navigate to next week
  const goToNextWeek = () => {
    if (currentIndex < sortedWeeks.length - 1) {
      onSelectWeek(sortedWeeks[currentIndex + 1].id);
    }
  };
  
  // Check if we can navigate
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < sortedWeeks.length - 1;
  
  // Format the current selected week's date range
  const selectedDateRange = selectedWeek 
    ? formatDateRange(selectedWeek.start_date, selectedWeek.end_date)
    : 'Select a week';

  // Get the current week badge
  const CurrentWeekBadge = () => (
    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
      This Week
    </span>
  );

  return (
    <div className="bg-white shadow rounded-lg mb-4">
      <div className="px-4 py-2 flex items-center justify-between">
        <button 
          onClick={goToPrevWeek}
          disabled={!canGoPrev}
          className={`p-1 rounded-full ${canGoPrev ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300'}`}
          aria-label="Previous week"
        >
          <ChevronLeft size={20} />
        </button>
        
        <div className="flex items-center">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-1 text-gray-800 font-medium flex items-center"
            aria-expanded={expanded}
            aria-controls="week-selector-dropdown"
          >
            <CalendarDays size={16} className="mr-2" />
            <span>{selectedDateRange}</span>
            {currentWeek && selectedWeek && currentWeek.id === selectedWeek.id && <CurrentWeekBadge />}
          </button>
        </div>
        
        <button 
          onClick={goToNextWeek}
          disabled={!canGoNext}
          className={`p-1 rounded-full ${canGoNext ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300'}`}
          aria-label="Next week"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      
      {expanded && (
        <div 
          id="week-selector-dropdown"
          className="border-t p-2 max-h-60 overflow-y-auto"
        >
          <div className="grid gap-1">
            {sortedWeeks.map(week => (
              <button
                key={week.id}
                onClick={() => {
                  onSelectWeek(week.id);
                  setExpanded(false);
                }}
                className={`p-2 text-left rounded text-sm ${
                  selectedWeek && week.id === selectedWeek.id
                    ? 'bg-blue-100 text-blue-800'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="font-medium flex items-center">
                  <span>{formatDateRange(week.start_date, week.end_date)}</span>
                  {currentWeek && week.id === currentWeek.id && <CurrentWeekBadge />}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeekSelector;