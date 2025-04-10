import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { logger } from '../utils/logger';

type Theme = 'light' | 'dark';
type ThemeMode = 'auto' | 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  themeMode: 'auto',
  setThemeMode: () => {}
});

export const ThemeProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');
  const [theme, setTheme] = useState<Theme>('light');
  
  // Load saved settings
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('careCalendarThemeMode') as ThemeMode;
      if (savedMode && ['auto', 'light', 'dark'].includes(savedMode)) {
        setThemeMode(savedMode);
        logger.info('Loaded theme settings from storage', { mode: savedMode });
      }
    } catch (error) {
      logger.error('Failed to load theme settings', { error });
    }
  }, []);
  
  // Save settings
  useEffect(() => {
    try {
      localStorage.setItem('careCalendarThemeMode', themeMode);
      logger.info('Saved theme settings', { mode: themeMode });
    } catch (error) {
      logger.error('Failed to save theme settings', { error });
    }
  }, [themeMode]);
  
  // Check time of day and set theme accordingly when in auto mode
  useEffect(() => {
    // If not auto mode, just use the selected mode
    if (themeMode !== 'auto') {
      setTheme(themeMode);
      logger.debug('Theme set from manual selection', { theme: themeMode });
      return;
    }
    
    // Use fixed sunrise/sunset times for Greenville, SC
    const updateThemeByTime = () => {
      const hour = new Date().getHours();
      
      // Greenville, SC times: Daylight approx 6am-7pm
      const isDaytime = hour >= 6 && hour < 19; // 6am-7pm
      const newTheme = isDaytime ? 'light' : 'dark';
      
      if (newTheme !== theme) {
        logger.info('Auto-switching theme based on time', { 
          hour, 
          isDaytime, 
          newTheme 
        });
      }
      
      setTheme(newTheme);
    };
    
    // Initial check
    updateThemeByTime();
    
    // Set up interval to update theme (every 15 minutes)
    const interval = setInterval(updateThemeByTime, 15 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [themeMode, theme]);
  
  // Apply theme to HTML element
  useEffect(() => {
    const htmlElement = document.documentElement;
    
    if (theme === 'dark') {
      htmlElement.classList.add('dark');
      logger.debug('Applied dark theme to HTML element');
    } else {
      htmlElement.classList.remove('dark');
      logger.debug('Applied light theme to HTML element');
    }
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
