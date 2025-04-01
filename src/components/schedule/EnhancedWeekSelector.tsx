import React from 'react';
import { useScheduleContext } from '../../context/ScheduleContext';
import { dateService } from '../../services/core/DateService';

const EnhancedWeekSelector: React.FC = () => {
  // Get data and operations from context
  const { 
    weeks, 
    selectedWeek, 
    currentWeek,
    selectWeek,
    goToNextWeek,
    goToPreviousWeek,
    goToCurrentWeek,
    isLoading
  } = useScheduleContext();
  
  // Get sorted weeks
  const sortedWeeks = dateService.sortWeeksByDate(weeks);
  
  // Determine if we can navigate
  const canGoToPrevious = selectedWeek && sortedWeeks.findIndex(w => w.id === selectedWeek.id) > 0;
  const canGoToNext = selectedWeek && sortedWeeks.findIndex(w => w.id === selectedWeek.id) < sortedWeeks.length - 1;
  const isCurrentWeekSelected = selectedWeek && currentWeek && selectedWeek.id === currentWeek.id;
  
  // Handle direct week selection
  const handleWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const weekId = parseInt(e.target.value, 10);
    if (!isNaN(weekId)) {
      selectWeek(weekId);
    }
  };
  
  // Format the current week display
  const formattedWeekRange = selectedWeek ? dateService.formatWeekRangeForDisplay(selectedWeek) : 'No week selected';
  
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      {/* Week navigation controls */}
      <div className="flex items-center justify-between mb-4">
        {/* Previous week button */}
        <button
          onClick={goToPreviousWeek}
          disabled={!canGoToPrevious || isLoading}
          className={`p-2 rounded-full ${
            canGoToPrevious && !isLoading 
              ? 'text-blue-700 hover:bg-blue-100' 
              : 'text-gray-400 cursor-not-allowed'
          }`}
          aria-label="Previous week"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {/* Week selection dropdown (for mobile) */}
        <div className="block md:hidden w-full mx-4">
          <select
            value={selectedWeek?.id || ''}
            onChange={handleWeekChange}
            disabled={isLoading}
            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="" disabled>Select a week</option>
            {sortedWeeks.map(week => (
              <option key={week.id} value={week.id}>
                {dateService.formatWeekRangeForDisplay(week)}
                {currentWeek && week.id === currentWeek.id ? ' (Current)' : ''}
              </option>
            ))}
          </select>
        </div>
        
        {/* Week display (for desktop) */}
        <div className="hidden md:flex items-center space-x-4">
          <h2 className="text-lg font-medium text-gray-900">
            {isLoading ? (
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              formattedWeekRange
            )}
          </h2>
          
          {/* Current week indicator */}
          {isCurrentWeekSelected && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Current Week
            </span>
          )}
          
          {/* Go to today button */}
          {!isCurrentWeekSelected && currentWeek && (
            <button
              onClick={goToCurrentWeek}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition ease-in-out duration-150"
            >
              Today
            </button>
          )}
        </div>
        
        {/* Next week button */}
        <button
          onClick={goToNextWeek}
          disabled={!canGoToNext || isLoading}
          className={`p-2 rounded-full ${
            canGoToNext && !isLoading 
              ? 'text-blue-700 hover:bg-blue-100' 
              : 'text-gray-400 cursor-not-allowed'
          }`}
          aria-label="Next week"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Week selection tabs (for desktop) */}
      <div className="hidden md:block">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 overflow-x-auto pb-1">
            {sortedWeeks.slice(0, 10).map(week => {
              const isSelected = selectedWeek?.id === week.id;
              const isCurrent = currentWeek?.id === week.id;
              
              return (
                <button
                  key={week.id}
                  onClick={() => selectWeek(week.id)}
                  disabled={isLoading}
                  className={`whitespace-nowrap py-2 px-3 border-b-2 text-sm font-medium ${
                    isSelected
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } ${isCurrent ? 'font-bold' : ''}`}
                >
                  Week of {new Date(week.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  {isCurrent && (
                    <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Current
                    </span>
                  )}
                </button>
              );
            })}
            
            {/* Show dropdown for more weeks if there are more than 10 */}
            {sortedWeeks.length > 10 && (
              <div className="relative inline-block text-left">
                <select
                  value={selectedWeek && sortedWeeks.findIndex(w => w.id === selectedWeek.id) >= 10 ? selectedWeek.id : ''}
                  onChange={handleWeekChange}
                  className="py-2 px-3 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 bg-transparent"
                  disabled={isLoading}
                >
                  <option value="" disabled>More Weeks...</option>
                  {sortedWeeks.slice(10).map(week => (
                    <option key={week.id} value={week.id}>
                      Week of {new Date(week.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      {currentWeek && week.id === currentWeek.id ? ' (Current)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default EnhancedWeekSelector;
