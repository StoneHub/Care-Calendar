import React from 'react';
import { Caregiver } from '../../types';
import CaregiverCard from './CaregiverCard';

interface TeamViewProps {
  caregivers: Caregiver[];
  onAddMember: () => void;
  onEditMember: (caregiver: Caregiver) => void;
}

const TeamView: React.FC<TeamViewProps> = ({
  caregivers,
  onAddMember,
  onEditMember
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
      <div className="divide-y">
        {caregivers.map((caregiver) => (
          <CaregiverCard 
            key={caregiver.id}
            caregiver={caregiver}
            onEdit={onEditMember}
          />
        ))}
      </div>
    </div>
  );
};

export default TeamView;