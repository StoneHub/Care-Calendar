import React from 'react';
import { Caregiver } from '../../types';
import CaregiverCard from './CaregiverCard';

interface TeamViewProps {
  caregivers: Caregiver[];
  isLoading?: boolean;
  error?: string | null;
  onAddMember: () => void;
  onEditMember: (caregiver: Caregiver) => void;
  onDeleteMember: (caregiverId: number) => void;
  onToggleActiveMember: (caregiverId: number, isActive: boolean) => void;
  onViewUnavailability?: (caregiver: Caregiver) => void;
  showInactive?: boolean;
  onToggleShowInactive?: () => void;
}

const TeamView: React.FC<TeamViewProps> = ({
  caregivers,
  isLoading = false,
  error = null,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onToggleActiveMember,
  onViewUnavailability,
  showInactive = false,
  onToggleShowInactive
}) => {
  // Filter caregivers based on active status
  const displayedCaregivers = showInactive 
    ? caregivers 
    : caregivers.filter(caregiver => caregiver.is_active);
  
  // Count of inactive members
  const inactiveCount = caregivers.filter(c => !c.is_active).length;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-medium dark:text-white">Care Team</h2>
          {inactiveCount > 0 && onToggleShowInactive && (
            <button 
              onClick={onToggleShowInactive}
              className={`px-3 py-1 text-xs rounded-full font-medium ${
                showInactive 
                  ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300' 
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
              }`}
            >
              {showInactive ? 'Hide Inactive' : `Show Inactive (${inactiveCount})`}
            </button>
          )}
        </div>
        <button 
          onClick={onAddMember}
          className="bg-blue-600 dark:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 dark:hover:bg-blue-600"
        >
          Add Member
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="p-4 mb-4 bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-700 text-red-700 dark:text-red-300">
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {/* Loading state */}
      {isLoading ? (
        <div className="p-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
        </div>
      ) : displayedCaregivers.length === 0 ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          {caregivers.length === 0 ? (
            <p>No team members yet. Add your first team member to get started.</p>
          ) : (
            <p>No active team members. Toggle 'Show Inactive' to see inactive members.</p>
          )}
        </div>
      ) : (
        <div className="divide-y dark:divide-gray-700">
          {displayedCaregivers.map((caregiver) => (
            <CaregiverCard 
              key={caregiver.id}
              caregiver={caregiver}
              onEdit={onEditMember}
              onDelete={onDeleteMember}
              onToggleActive={onToggleActiveMember}
              onViewUnavailability={onViewUnavailability}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamView;