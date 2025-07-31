import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { logger } from '../utils/logger';

interface AppStatusContextType {
  isLoading: boolean;
  error: string | null;
  setLoading: (status: boolean, message?: string) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const AppStatusContext = createContext<AppStatusContextType | undefined>(undefined);

export const AppStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setErrorState] = useState<string | null>(null);

  const setLoading = useCallback((status: boolean, message?: string) => {
    if (status) {
      logger.info(message || 'Loading data...');
    }
    setIsLoading(status);
  }, []);

  const setError = useCallback((error: string | null) => {
    if (error) {
      logger.error('An error occurred', { error });
    }
    setErrorState(error);
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const value = {
    isLoading,
    error,
    setLoading,
    setError,
    clearError,
  };

  return (
    <AppStatusContext.Provider value={value}>
      {children}
    </AppStatusContext.Provider>
  );
};

export const useAppStatus = () => {
  const context = useContext(AppStatusContext);
  if (context === undefined) {
    throw new Error('useAppStatus must be used within an AppStatusProvider');
  }
  return context;
};
