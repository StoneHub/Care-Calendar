import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { darkModeClasses } from '../../utils/themeUtils';

const ThemeToggle: React.FC = () => {
  const { themeMode, setThemeMode } = useTheme();
  
  return (
    <div className="flex items-center space-x-1 bg-gray-200 dark:bg-gray-700 rounded-md p-0.5">
      <button
        onClick={() => setThemeMode('light')}
        className={`p-1.5 rounded-md text-sm ${
          themeMode === 'light'
            ? 'bg-white text-gray-800 shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
        }`}
        title="Light Mode"
        aria-label="Switch to light mode"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      </button>
      
      <button
        onClick={() => setThemeMode('auto')}
        className={`p-1.5 rounded-md text-sm ${
          themeMode === 'auto'
            ? 'bg-white text-gray-800 shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
        }`}
        title="Auto Mode (sunset/sunrise in Greenville, SC)"
        aria-label="Switch to automatic mode based on time"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      </button>
      
      <button
        onClick={() => setThemeMode('dark')}
        className={`p-1.5 rounded-md text-sm ${
          themeMode === 'dark'
            ? 'bg-white text-gray-800 shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
        }`}
        title="Dark Mode"
        aria-label="Switch to dark mode"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      </button>
    </div>
  );
};

export default ThemeToggle;
