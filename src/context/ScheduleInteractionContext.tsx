import React, { createContext, useState, useContext, ReactNode } from 'react';
import { DayName, Shift } from '../types';

interface ScheduleInteractionContextType {
  selectedDay: DayName | null;
  setSelectedDay: (day: DayName | null) => void;
  selectedShift: Shift | null;
  setSelectedShift: (shift: Shift | null) => void;
}

const ScheduleInteractionContext = createContext<ScheduleInteractionContextType | undefined>(undefined);

export const ScheduleInteractionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedDay, setSelectedDay] = useState<DayName | null>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  const value = {
    selectedDay,
    setSelectedDay,
    selectedShift,
    setSelectedShift,
  };

  return (
    <ScheduleInteractionContext.Provider value={value}>
      {children}
    </ScheduleInteractionContext.Provider>
  );
};

export const useScheduleInteraction = () => {
  const context = useContext(ScheduleInteractionContext);
  if (context === undefined) {
    throw new Error('useScheduleInteraction must be used within a ScheduleInteractionProvider');
  }
  return context;
};
