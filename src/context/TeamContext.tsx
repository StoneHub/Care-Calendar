import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { Caregiver } from '../types';
import { apiService } from '../services/core';
import { mapCaregivers } from '../utils/mappers';
import { useAppStatus } from './AppStatusContext';
import { logger } from '../utils/logger';

interface TeamContextType {
  caregivers: Caregiver[];
  addCaregiver: (caregiver: Omit<Caregiver, 'id'>) => Promise<Caregiver | null>;
  updateCaregiver: (caregiver: Caregiver) => Promise<Caregiver | null>;
  deleteCaregiver: (id: string) => Promise<boolean>;
  refetchCaregivers: () => void;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TeamProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const { setLoading, setError } = useAppStatus();

  const fetchCaregivers = useCallback(async () => {
    setLoading(true, 'Fetching caregivers...');
    try {
      const backendCaregivers = await apiService.getTeamMembers();
      const mappedCaregivers = mapCaregivers(backendCaregivers);
      setCaregivers(mappedCaregivers);
      logger.info('Successfully fetched and mapped caregivers', { count: mappedCaregivers.length });
    } catch (e) {
      const error = e as Error;
      logger.error('Failed to fetch caregivers', { error: error.message });
      setError('Failed to load team members. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  useEffect(() => {
    fetchCaregivers();
  }, [fetchCaregivers]);

  const addCaregiver = async (caregiver: Omit<Caregiver, 'id'>): Promise<Caregiver | null> => {
    setLoading(true, 'Adding caregiver...');
    try {
      const newCaregiverBackend = await apiService.createTeamMember(caregiver);
      const newCaregiver = mapCaregivers([newCaregiverBackend])[0];
      setCaregivers(prev => [...prev, newCaregiver]);
      logger.info('Successfully added caregiver', { caregiverId: newCaregiver.id });
      return newCaregiver;
    } catch (e) {
      const error = e as Error;
      logger.error('Failed to add caregiver', { error: error.message });
      setError('Failed to add caregiver.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateCaregiver = async (caregiver: Caregiver): Promise<Caregiver | null> => {
    setLoading(true, 'Updating caregiver...');
    try {
      const updatedCaregiverBackend = await apiService.updateTeamMember(caregiver);
      const updatedCaregiver = mapCaregivers([updatedCaregiverBackend])[0];
      setCaregivers(prev => prev.map(c => c.id === caregiver.id ? updatedCaregiver : c));
      logger.info('Successfully updated caregiver', { caregiverId: caregiver.id });
      return updatedCaregiver;
    } catch (e) {
      const error = e as Error;
      logger.error('Failed to update caregiver', { error: error.message });
      setError('Failed to update caregiver.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteCaregiver = async (id: string): Promise<boolean> => {
    const numericId = parseInt(id);
    setLoading(true, 'Deleting caregiver...');
    try {
      await apiService.deleteTeamMember(numericId);
      setCaregivers(prev => prev.filter(c => c.id.toString() !== id));
      logger.info('Successfully deleted caregiver', { caregiverId: id });
      return true;
    } catch (e) {
      const error = e as Error;
      logger.error('Failed to delete caregiver', { error: error.message });
      setError('Failed to delete caregiver.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    caregivers,
    addCaregiver,
    updateCaregiver,
    deleteCaregiver,
    refetchCaregivers: fetchCaregivers,
  };

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};
