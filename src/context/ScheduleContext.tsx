import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { Week, Shift, WeeklySchedule } from '../types';
import { apiService } from '../services/core';
import { mapWeeks, organizeShiftsByDay } from '../utils/mappers';
import { useAppStatus } from './AppStatusContext';
import { logger } from '../utils/logger';

// Define the context state shape
interface ScheduleDataContextType {
  // Data
  weeks: Week[];
  shifts: { [weekId: string]: Shift[] };
  selectedWeek: Week | null;
  schedule: WeeklySchedule; // Computed from shifts for current week
  
  // Operations
  setSelectedWeek: (week: Week | null) => void;
  addShift: (shiftData: Omit<Shift, 'id' | 'status'>) => Promise<Shift | null>;
  updateShift: (shiftData: Shift) => Promise<Shift | null>;
  deleteShift: (shiftId: string) => Promise<boolean>;
  dropShift: (shiftId: string) => Promise<boolean>;
  fetchShiftsForWeek: (weekId: string) => Promise<void>;
}

// Create the context with a default value
const ScheduleDataContext = createContext<ScheduleDataContextType | undefined>(
  undefined
);

// Provider component
export const ScheduleDataProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // State
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [shifts, setShifts] = useState<{ [weekId: string]: Shift[] }>({});
  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);
  const { setLoading, setError } = useAppStatus();

  // Fetch all weeks
  const fetchWeeks = useCallback(async () => {
    setLoading(true, 'Fetching weeks...');
    try {
      const backendWeeks = await apiService.getAllWeeks();
      const mappedWeeks = mapWeeks(backendWeeks);
      setWeeks(mappedWeeks);
      
      const currentWeek =
        mappedWeeks.find((w: any) => w.is_current) || mappedWeeks[0];
      if (currentWeek) {
        setSelectedWeek(currentWeek);
        logger.info('Successfully fetched weeks and set current week.', { weekCount: mappedWeeks.length, currentWeekId: currentWeek.id });
      } else {
        logger.warn('No weeks found or no current week designated.');
      }
    } catch (e) {
      const error = e as Error;
      logger.error('Failed to fetch weeks', { error: error.message });
      setError('Failed to load schedule weeks.');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Initialize data
  useEffect(() => {
    fetchWeeks();
  }, [fetchWeeks]);

  // Fetch shifts for a specific week
  const fetchShiftsForWeek = useCallback(async (weekId: string) => {
    // Remove the parseInt conversion since weekIds are UUIDs, not numbers
    if (!weekId) return;
    setLoading(true, `Fetching shifts for week ${weekId}...`);
    try {
      const backendShifts = await apiService.getScheduleForWeek(weekId);
      // backendShifts should already be in the right format from the API, treat them as Shift[]
      const mappedShifts = backendShifts as any[]; // Temporary cast to avoid type issues
      setShifts(prevShifts => ({
        ...prevShifts,
        [weekId]: mappedShifts,
      }));
      logger.info('Successfully fetched shifts for week', { weekId, shiftCount: mappedShifts.length });
    } catch (e) {
      const error = e as Error;
      logger.error('Failed to fetch shifts for week', { weekId, error: error.message });
      setError(`Failed to load shifts for week ${weekId}.`);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Auto-fetch shifts for the selected week
  useEffect(() => {
    if (selectedWeek?.id && !shifts[selectedWeek.id.toString()]) {
      fetchShiftsForWeek(selectedWeek.id.toString());
    }
  }, [selectedWeek, shifts, fetchShiftsForWeek]);

  // Add a new shift
  const addShift = async (shiftData: Omit<Shift, 'id' | 'status'>): Promise<Shift | null> => {
    setLoading(true, 'Adding new shift...');
    try {
      const newShiftBackend = await apiService.createShift(shiftData);
      // newShiftBackend is already in the correct format from the API
      const newShift = newShiftBackend as Shift;
      if (newShift.week_id !== undefined) {
        setShifts(prev => ({
          ...prev,
          [newShift.week_id!.toString()]: [...(prev[newShift.week_id!.toString()] || []), newShift],
        }));
      }
      logger.info('Successfully added shift', { shiftId: newShift.id });
      return newShift;
    } catch (e) {
      const error = e as Error;
      logger.error('Failed to add shift', { error: error.message });
      setError('Failed to add shift.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update a shift
  const updateShift = async (shiftData: Shift): Promise<Shift | null> => {
    setLoading(true, `Updating shift ${shiftData.id}...`);
    try {
      const updatedShiftBackend = await apiService.updateShift(shiftData);
      // updatedShiftBackend is already in the correct format from the API
      const updatedShift = updatedShiftBackend as Shift;
      if (updatedShift.week_id !== undefined) {
        setShifts(prev => ({
          ...prev,
          [updatedShift.week_id!.toString()]: (prev[updatedShift.week_id!.toString()] || []).map(s =>
            s.id === updatedShift.id ? updatedShift : s
          ),
        }));
      }
      logger.info('Successfully updated shift', { shiftId: updatedShift.id });
      return updatedShift;
    } catch (e) {
      const error = e as Error;
      logger.error('Failed to update shift', { shiftId: shiftData.id, error: error.message });
      setError('Failed to update shift.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete a shift
  const deleteShift = async (shiftId: string): Promise<boolean> => {
    const numericShiftId = parseInt(shiftId);
    setLoading(true, `Deleting shift ${shiftId}...`);
    try {
      await apiService.deleteShift(numericShiftId);
      setShifts(prev => {
        const newShifts = { ...prev };
        for (const weekId in newShifts) {
          newShifts[weekId] = newShifts[weekId].filter(s => s.id.toString() !== shiftId);
        }
        return newShifts;
      });
      logger.info('Successfully deleted shift', { shiftId });
      return true;
    } catch (e) {
      const error = e as Error;
      logger.error('Failed to delete shift', { shiftId, error: error.message });
      setError('Failed to delete shift.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Drop a shift
  const dropShift = async (shiftId: string): Promise<boolean> => {
    const numericShiftId = parseInt(shiftId);
    setLoading(true, `Dropping shift ${shiftId}...`);
    try {
      const updatedShiftBackend = await apiService.dropShift(numericShiftId);
      // updatedShiftBackend is already in the correct format from the API
      const updatedShift = updatedShiftBackend as Shift;
      if (updatedShift.week_id !== undefined) {
        setShifts(prev => ({
          ...prev,
          [updatedShift.week_id!.toString()]: (prev[updatedShift.week_id!.toString()] || []).map(s =>
            s.id === updatedShift.id ? updatedShift : s
          ),
        }));
      }
      logger.info('Successfully dropped shift', { shiftId });
      return true;
    } catch (e) {
      const error = e as Error;
      logger.error('Failed to drop shift', { shiftId, error: error.message });
      setError('Failed to drop shift.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Compute schedule from shifts for the selected week
  const schedule = useMemo(() => {
    if (!selectedWeek) {
      return {
        monday: [], tuesday: [], wednesday: [], thursday: [],
        friday: [], saturday: [], sunday: []
      };
    }
    
    const weekShifts = shifts[selectedWeek.id.toString()] || [];
    // If shifts are already in the right format, use them directly
    return organizeShiftsByDay(weekShifts);
  }, [selectedWeek, shifts]);

  // Construct the context value
  const value = {
    weeks,
    shifts,
    selectedWeek,
    schedule,
    setSelectedWeek,
    addShift,
    updateShift,
    deleteShift,
    dropShift,
    fetchShiftsForWeek,
  };

  return (
    <ScheduleDataContext.Provider value={value}>
      {children}
    </ScheduleDataContext.Provider>
  );
};

// Custom hook to use the schedule data context
export const useScheduleData = () => {
  const context = useContext(ScheduleDataContext);
  if (context === undefined) {
    throw new Error('useScheduleData must be used within a ScheduleDataProvider');
  }
  return context;
};

// Legacy exports for backward compatibility during refactoring
export const ScheduleProvider = ScheduleDataProvider;
export const useScheduleContext = useScheduleData;
