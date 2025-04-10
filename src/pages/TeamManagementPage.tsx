import React, { useState, useEffect } from 'react';
import { useScheduleContext } from '../context/ScheduleContext';
import TeamView from '../components/team/TeamView';
import CaregiverModal from '../components/team/CaregiverModal';
import UnavailabilityList from '../components/unavailability/UnavailabilityList';
import { Caregiver } from '../types';
import { apiService } from '../services/core/APIService';
import { logger } from '../utils/logger';

const TeamManagementPage: React.FC = () => {
  // Get context data
  const { 
    caregivers, 
    isLoading: contextLoading, 
    error: contextError,
    refreshSchedule,
    refreshTeamMembers
  } = useScheduleContext();
  
  // State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentCaregiver, setCurrentCaregiver] = useState<Caregiver | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [forceDelete, setForceDelete] = useState<boolean>(false);
  const [selectedCaregiverId, setSelectedCaregiverId] = useState<number | null>(null);
  
  // Open add modal
  const handleAddMember = () => {
    setModalMode('add');
    setCurrentCaregiver(undefined);
    setIsModalOpen(true);
  };
  
  // Open edit modal
  const handleEditMember = (caregiver: Caregiver) => {
    setModalMode('edit');
    setCurrentCaregiver(caregiver);
    setIsModalOpen(true);
  };
  
  // Handle create or update caregiver
  const handleSaveCaregiver = async (caregiver: Caregiver | Omit<Caregiver, 'id'>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if ('id' in caregiver && caregiver.id !== undefined) {
        // Update existing caregiver
        logger.info('Updating caregiver', { id: caregiver.id, name: caregiver.name });
        
        // Make the API call directly - fields will be mapped in the service
        await apiService.updateTeamMember(caregiver as Caregiver);
        logger.info('Caregiver updated successfully');
      } else {
        // Create new caregiver
        logger.info('Creating new caregiver', { name: caregiver.name });
        // Make the API call directly - fields will be mapped in the service
        await apiService.createTeamMember(caregiver);
        logger.info('Caregiver created successfully');
      }
      
      // Close modal first
      setIsModalOpen(false);
      
      // Force caregivers refresh without page reload
      await refreshTeamMembers();
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to save team member';
      logger.error('Failed to save caregiver', { error: errorMsg });
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle delete caregiver
  const handleDeleteMember = async (caregiverId: number) => {
    // First time, just show confirm dialog
    if (confirmDelete !== caregiverId) {
      setConfirmDelete(caregiverId);
      // Reset force delete option
      setForceDelete(false);
      return;
    }
    
    // Second click confirms deletion
    setIsLoading(true);
    setError(null);
    
    try {
      logger.info('Deleting caregiver', { id: caregiverId, forceDelete });
      
      // Validate caregiverId
      if (!caregiverId || isNaN(caregiverId)) {
        throw new Error('Invalid caregiver ID');
      }
      
      // Make the API call directly, passing force delete flag
      await apiService.deleteTeamMember(caregiverId, forceDelete);
      logger.info('Caregiver deleted successfully', { id: caregiverId, forceDelete });
      
      // Refresh data
      await refreshSchedule();
      
      // Reset confirmation
      setConfirmDelete(null);
      
      // Force caregivers refresh without page reload
      await refreshTeamMembers();
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete team member';
      if (err.status === 500) {
        setError('Cannot delete team member who has assigned shifts. Please use force delete or reassign their shifts first.');
      } else {
        setError(errorMsg);
      }
      logger.error('Failed to delete caregiver', { error: errorMsg, id: caregiverId });
    } finally {
      setIsLoading(false);
    }
  };
  
  // We can remove this effect as we handle clicks in the dialog overlay now
  
  // Handle viewing caregiver's unavailability
  const handleViewUnavailability = (caregiver: Caregiver) => {
    setSelectedCaregiverId(caregiver.id);
  };
  
  // Reset error on context change
  useEffect(() => {
    if (contextError) {
      setError(contextError);
    }
  }, [contextError]);
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-6 dark:text-white">Team Management</h1>
      
      <div className="mb-8">
        <TeamView 
          caregivers={caregivers}
          isLoading={isLoading || contextLoading}
          error={error}
          onAddMember={handleAddMember}
          onEditMember={handleEditMember}
          onDeleteMember={handleDeleteMember}
          onViewUnavailability={handleViewUnavailability}
        />
      </div>
      
      <div className="mb-8 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium dark:text-white">
            {selectedCaregiverId ? 
              `Time Off for ${caregivers.find(c => c.id === selectedCaregiverId)?.name || 'Team Member'}` : 
              'Team Unavailability'}
          </h2>
          {selectedCaregiverId && (
            <button
              onClick={() => setSelectedCaregiverId(null)}
              className="text-blue-600 dark:text-blue-400 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-sm"
            >
              View All
            </button>
          )}
        </div>
        <UnavailabilityList caregiverId={selectedCaregiverId || undefined} />
      </div>
      
      {/* Deletion confirmation dialog */}
      {confirmDelete && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setConfirmDelete(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium mb-4 dark:text-white">Confirm Delete</h3>
            <p className="mb-4 dark:text-gray-300">
              Are you sure you want to delete this team member? This action cannot be undone.
            </p>
            
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={forceDelete}
                  onChange={(e) => setForceDelete(e.target.checked)}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Force delete (will also remove all shifts assigned to this team member)
                </span>
              </label>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteMember(confirmDelete)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add/Edit modal */}
      {isModalOpen && (
        <CaregiverModal 
          mode={modalMode}
          caregiver={currentCaregiver}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveCaregiver}
        />
      )}
    </div>
  );
};

export default TeamManagementPage;