import { useState, useEffect } from 'react';
import { Week } from '../types';
import { apiService } from '../services/api';
import { logger } from '../utils/logger';

interface UseWeeksReturn {
  weeks: Week[];
  currentWeek: Week | null;
  selectedWeek: Week | null;
  isLoading: boolean;
  error: string | null;
  fetchWeeks: () => Promise<void>;
  fetchCurrentWeek: () => Promise<void>;
  selectWeek: (weekId: number) => void;
  createWeek?: (weekData: Omit<Week, 'id'>) => Promise<Week | null>;
}

export const useWeeks = (): UseWeeksReturn => {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [currentWeek, setCurrentWeek] = useState<Week | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeeks = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      logger.info('Fetching all weeks');
      const fetchedWeeks = await apiService.getAllWeeks();
      logger.debug('Weeks received', { 
        count: fetchedWeeks.length, 
        weeks: fetchedWeeks.map(w => ({ id: w.id, start: w.start_date, end: w.end_date }))
      });
      
      // Sort weeks by start date
      const sortedWeeks = [...fetchedWeeks].sort((a, b) => 
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );
      
      logger.debug('Weeks sorted by date', {
        sortedIds: sortedWeeks.map(w => w.id)
      });
      
      setWeeks(sortedWeeks);
      
      // If there are weeks and no week is selected, select the current week
      if (sortedWeeks.length > 0 && !selectedWeek) {
        if (currentWeek) {
          logger.info('Selecting current week', { 
            week_id: currentWeek.id,
            date_range: `${currentWeek.start_date} to ${currentWeek.end_date}`
          });
          setSelectedWeek(currentWeek);
        } else {
          // Default to the first week if current week not available
          logger.info('Current week not available, selecting first week', { 
            week_id: sortedWeeks[0].id,
            date_range: `${sortedWeeks[0].start_date} to ${sortedWeeks[0].end_date}`
          });
          setSelectedWeek(sortedWeeks[0]);
        }
      }
    } catch (err: any) {
      logger.error('Error fetching weeks', {
        error: err.message,
        details: err.response?.data
      });
      setError(`Failed to fetch weeks: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentWeek = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      logger.info('Fetching current week');
      const fetchedCurrentWeek = await apiService.getCurrentWeek();
      logger.debug('Current week received', { 
        week_id: fetchedCurrentWeek.id,
        date_range: `${fetchedCurrentWeek.start_date} to ${fetchedCurrentWeek.end_date}`
      });
      
      setCurrentWeek(fetchedCurrentWeek);
      
      // If no week is selected, select the current week
      if (!selectedWeek) {
        logger.info('No week selected, selecting current week', { 
          week_id: fetchedCurrentWeek.id 
        });
        setSelectedWeek(fetchedCurrentWeek);
      }
    } catch (err: any) {
      logger.error('Error fetching current week', {
        error: err.message,
        details: err.response?.data
      });
      
      // Handle the case where there is no current week
      if (err.response?.status === 404) {
        logger.warn('No current week found, will use the first available week instead');
        // We'll rely on fetchWeeks to select the first week
      } else {
        setError(`Failed to fetch current week: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };


  const selectWeek = (weekId: number): void => {
    const week = weeks.find(w => w.id === weekId) || null;
    
    if (week) {
      logger.info('Selecting week', { 
        week_id: week.id, 
        start_date: week.start_date, 
        end_date: week.end_date 
      });
      setSelectedWeek(week);
    } else {
      logger.warn('Failed to select week - week not found', { 
        requested_id: weekId, 
        available_ids: weeks.map(w => w.id)
      });
    }
  };
  
  // For debugging week navigation
  useEffect(() => {
    if (selectedWeek) {
      logger.debug('Selected week changed', {
        week_id: selectedWeek.id,
        date_range: `${selectedWeek.start_date} to ${selectedWeek.end_date}`,
        is_current: currentWeek && currentWeek.id === selectedWeek.id
      });
    }
  }, [selectedWeek, currentWeek]);

  // Initialize by fetching weeks and current week
  useEffect(() => {
    logger.info('Initializing weeks hook');
    fetchWeeks();
    fetchCurrentWeek();
  }, []);

  return {
    weeks,
    currentWeek,
    selectedWeek,
    isLoading,
    error,
    fetchWeeks,
    fetchCurrentWeek,
    selectWeek
  };
};