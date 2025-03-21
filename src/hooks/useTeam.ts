import { useState } from 'react';
import { Caregiver } from '../types';
import { mockCaregivers } from '../services/mockData';

export const useTeam = () => {
  const [caregivers, setCaregivers] = useState<Caregiver[]>(mockCaregivers);
  const [selectedCaregiver, setSelectedCaregiver] = useState<Caregiver | null>(null);

  const addCaregiver = (caregiver: Omit<Caregiver, 'id'>): void => {
    const newId = Math.max(0, ...caregivers.map(c => c.id)) + 1;
    const newCaregiver = {
      ...caregiver,
      id: newId
    };
    
    setCaregivers([...caregivers, newCaregiver]);
  };

  const updateCaregiver = (updatedCaregiver: Caregiver): void => {
    setCaregivers(
      caregivers.map(caregiver => 
        caregiver.id === updatedCaregiver.id ? updatedCaregiver : caregiver
      )
    );
  };

  const deleteCaregiver = (id: number): void => {
    setCaregivers(caregivers.filter(caregiver => caregiver.id !== id));
  };

  const selectCaregiver = (id: number): void => {
    const caregiver = caregivers.find(c => c.id === id) || null;
    setSelectedCaregiver(caregiver);
  };

  return {
    caregivers,
    selectedCaregiver,
    addCaregiver,
    updateCaregiver,
    deleteCaregiver,
    selectCaregiver,
    setSelectedCaregiver
  };
};