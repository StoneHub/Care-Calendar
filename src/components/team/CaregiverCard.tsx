import React from 'react';
import { Caregiver } from '../../types';

interface CaregiverCardProps {
  caregiver: Caregiver;
  onEdit: (caregiver: Caregiver) => void;
  onDelete: (caregiverId: number) => void;
  onToggleActive: (caregiverId: number, isActive: boolean) => void;
  onViewUnavailability?: (caregiver: Caregiver) => void;
}

const CaregiverCard: React.FC<CaregiverCardProps> = ({ 
  caregiver, 
  onEdit, 
  onDelete, 
  onToggleActive,
  onViewUnavailability 
}) => {
  const { is_active = true } = caregiver; // Default to true for backward compatibility
  
  return (
    <div className={`p-4 flex justify-between items-center ${!is_active ? 'opacity-60 bg-gray-100 dark:bg-gray-800' : ''}`}>
      <div>
        <div className="flex items-center gap-2">
          <div className="font-medium dark:text-white">{caregiver.name}</div>
          {!is_active && (
            <span className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
              Inactive
            </span>
          )}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300">{caregiver.role} • {caregiver.availability}</div>
      </div>
      <div className="flex items-center">
        <div className="text-right mr-4">
          <div className="font-medium dark:text-white">{caregiver.hours} hrs/week</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {caregiver.hours > 30 ? 'Full Time' : 'Part Time'}
          </div>
        </div>
        <div className="flex space-x-1">
          <button 
            onClick={() => onEdit(caregiver)}
            className="text-blue-600 dark:text-blue-400 px-2 py-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30"
          >
            Edit
          </button>
          {onViewUnavailability && (
            <button 
              onClick={() => onViewUnavailability(caregiver)}
              className="text-purple-600 dark:text-purple-400 px-2 py-2 rounded hover:bg-purple-50 dark:hover:bg-purple-900/30"
            >
              Time Off
            </button>
          )}
          <button 
            onClick={() => onToggleActive(caregiver.id, !is_active)}
            className={`${is_active 
              ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30' 
              : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'
            } px-2 py-2 rounded`}
          >
            {is_active ? 'Deactivate' : 'Activate'}
          </button>
          <button 
            onClick={() => onDelete(caregiver.id)}
            className="text-red-600 dark:text-red-400 px-2 py-2 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaregiverCard;