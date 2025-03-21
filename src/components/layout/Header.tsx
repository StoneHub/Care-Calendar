import React from 'react';
import { Week } from '../../types';

interface HeaderProps {
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onPayroll: () => void;
  selectedWeek?: Week | null;
  isCurrentWeek?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onPreviousWeek,
  onNextWeek,
  onToday,
  onPayroll,
  selectedWeek,
  isCurrentWeek
}) => {
  // Format the week date range for display
  const formatWeekRange = () => {
    if (!selectedWeek) return 'Select a week';
    
    const startDate = new Date(selectedWeek.start_date);
    const endDate = new Date(selectedWeek.end_date);
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };

  return (
    <div className="bg-blue-700 text-white p-4 shadow-md">
      <h1 className="text-xl font-semibold">Care Team Scheduler</h1>
      <div className="flex justify-between items-center">
        <button 
          className="text-sm bg-blue-600 px-3 py-1 rounded-full"
          onClick={onPreviousWeek}
        >
          &larr; Previous Week
        </button>
        <div className="text-center">
          <p className="text-sm opacity-80">
            {formatWeekRange()}
            {isCurrentWeek && <span className="ml-2 text-xs bg-green-500 px-1 py-0.5 rounded-full">Current</span>}
          </p>
          <div className="flex justify-center mt-1 text-xs space-x-2">
            <button 
              className="bg-blue-600 px-2 py-1 rounded"
              onClick={onToday}
            >
              Today
            </button>
            <button 
              className="bg-blue-600 px-2 py-1 rounded"
              onClick={onPayroll}
            >
              Payroll
            </button>
          </div>
        </div>
        <button 
          className="text-sm bg-blue-600 px-3 py-1 rounded-full"
          onClick={onNextWeek}
        >
          Next Week &rarr;
        </button>
      </div>
    </div>
  );
};

export default Header;