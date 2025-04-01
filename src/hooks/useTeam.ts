import { useState, useEffect } from 'react';
import { Caregiver } from '../types';
import { mockCaregivers } from '../services/mockData';
import { apiService } from '../services/core/APIService';
import { mapCaregiverFromBackend, mapCaregiverToBackend } from '../utils/mappers';

export const useTeam = () => {
  const [caregivers, setCaregivers] = useState<Caregiver[]>(mockCaregivers);
  const [selectedCaregiver, setSelectedCaregiver] = useState<Caregiver | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch team members when the hook is initialized
  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const teamMembers = await apiService.getTeamMembers();
      // Map backend format to frontend format
      const mappedCaregivers = teamMembers.map(member => mapCaregiverFromBackend(member as any));
      setCaregivers(mappedCaregivers);
    } catch (err) {
      console.error('Error fetching team members:', err);
      setError('Failed to fetch team members');
      // Fallback to mock data in case of error
      setCaregivers(mockCaregivers);
    } finally {
      setIsLoading(false);
    }
  };

  const addCaregiver = async (caregiver: Omit<Caregiver, 'id'>): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert to backend format
      // Map frontend to backend format
      const backendCaregiver = {
        name: caregiver.name,
        hours_per_week: caregiver.hours,
        availability: caregiver.availability,
        role: caregiver.role
      } as any; // Type assertion because of mapping mismatch
      
      // Call API to create caregiver
      const result = await apiService.createTeamMember(backendCaregiver);
      
      if (result) {
        // Refresh the team members list
        await fetchTeamMembers();
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error adding caregiver:', err);
      setError('Failed to add caregiver');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCaregiver = async (updatedCaregiver: Caregiver): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert to backend format
      // Map to backend format
      const backendCaregiver = mapCaregiverToBackend(updatedCaregiver as any);
      
      // Call API to update caregiver
      const result = await apiService.updateTeamMember(backendCaregiver as any);
      
      if (result) {
        // Refresh the team members list
        await fetchTeamMembers();
        
        // Update selected caregiver if that's what was updated
        if (selectedCaregiver && selectedCaregiver.id === updatedCaregiver.id) {
          setSelectedCaregiver(updatedCaregiver);
        }
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error updating caregiver:', err);
      setError('Failed to update caregiver');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCaregiver = async (id: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call API to delete caregiver
      await apiService.deleteTeamMember(id);
      
      // Refresh the team members list
      await fetchTeamMembers();
      
      // Clear selected caregiver if that's what was deleted
      if (selectedCaregiver && selectedCaregiver.id === id) {
        setSelectedCaregiver(null);
      }
      
      return true;
    } catch (err) {
      console.error('Error deleting caregiver:', err);
      setError('Failed to delete caregiver');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const selectCaregiver = async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to find caregiver in current list
      let caregiver = caregivers.find(c => c.id === id) || null;
      
      // If not found, fetch from API
      if (!caregiver) {
        const fetchedCaregiver = await apiService.getTeamMember(id);
        if (fetchedCaregiver) {
          caregiver = mapCaregiverFromBackend(fetchedCaregiver as any);
        }
      }
      
      setSelectedCaregiver(caregiver);
    } catch (err) {
      console.error('Error selecting caregiver:', err);
      setError('Failed to select caregiver');
      // Try to find in local state as fallback
      const caregiver = caregivers.find(c => c.id === id) || null;
      setSelectedCaregiver(caregiver);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    caregivers,
    selectedCaregiver,
    isLoading,
    error,
    addCaregiver,
    updateCaregiver,
    deleteCaregiver,
    selectCaregiver,
    setSelectedCaregiver,
    fetchTeamMembers
  };
};