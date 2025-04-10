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
  onViewUnavailability?: (caregiver: Caregiver) => void;
}

const TeamView: React.FC<TeamViewProps> = ({
  caregivers,
  isLoading = false,
  error = null,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onViewUnavailability
}) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-medium">Care Team</h2>
        <button 
          onClick={onAddMember}
          className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm"
        >
          Add Member
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="p-4 mb-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {/* Loading state */}
      {isLoading ? (
        <div className="p-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : caregivers.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p>No team members yet. Add your first team member to get started.</p>
        </div>
      ) : (
        <div className="divide-y">
          {caregivers.map((caregiver) => (
            <CaregiverCard 
              key={caregiver.id}
              caregiver={caregiver}
              onEdit={onEditMember}
              onDelete={onDeleteMember}
              onViewUnavailability={onViewUnavailability}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamView;