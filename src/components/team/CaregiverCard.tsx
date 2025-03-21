import React from 'react';
import { Caregiver } from '../../types';

interface CaregiverCardProps {
  caregiver: Caregiver;
  onEdit: (caregiver: Caregiver) => void;
}

const CaregiverCard: React.FC<CaregiverCardProps> = ({ caregiver, onEdit }) => {
  return (
    <div className="p-4 flex justify-between items-center">
      <div>
        <div className="font-medium">{caregiver.name}</div>
        <div className="text-sm text-gray-600">{caregiver.role} • {caregiver.availability}</div>
      </div>
      <div className="flex items-center">
        <div className="text-right mr-4">
          <div className="font-medium">{caregiver.hours} hrs/week</div>
          <div className="text-sm text-gray-600">
            {caregiver.hours > 30 ? 'Full Time' : 'Part Time'}
          </div>
        </div>
        <button 
          onClick={() => onEdit(caregiver)}
          className="text-blue-600 px-2 py-2 rounded"
        >
          Edit
        </button>
      </div>
    </div>
  );
};

export default CaregiverCard;