import React from 'react';
import { Shift } from '../../types';

interface ShiftCardProps {
  shift: Shift;
  onClick: (e: React.MouseEvent) => void;
  statusColorClass: string;
}

const ShiftCard: React.FC<ShiftCardProps> = ({ shift, onClick, statusColorClass }) => {
  return (
    <div 
      className={`p-2 mb-2 rounded border ${statusColorClass} hover:shadow-md transition-all cursor-pointer dark:border-opacity-50`}
      onClick={onClick}
    >
      <div className="font-medium dark:text-gray-100">{shift.caregiver}</div>
      <div className="text-sm text-gray-600 dark:text-gray-300">{shift.start} - {shift.end}</div>
      
      {shift.status !== 'confirmed' && (
        <div className="mt-1 text-xs inline-block px-1.5 py-0.5 rounded bg-white dark:bg-gray-700 dark:text-white">
          {shift.status.replace('-', ' ')}
        </div>
      )}
    </div>
  );
};

export default ShiftCard;