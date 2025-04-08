import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { Shift } from '../../types';

interface ShiftCardProps {
  shift: Shift;
  onClick: (e: React.MouseEvent) => void;
  statusColorClass: string;
}

const ShiftCard: React.FC<ShiftCardProps> = ({ shift, onClick, statusColorClass }) => {
  return (
    <div 
      className={`p-2 mb-2 rounded border ${statusColorClass} hover:shadow-md transition-all cursor-pointer`}
      onClick={onClick}
    >
      <div className="font-medium">{shift.caregiver}</div>
      <div className="text-sm text-gray-600">{shift.start} - {shift.end}</div>
      
      {shift.status !== 'confirmed' && (
        <div className="mt-1 text-xs inline-block px-1.5 py-0.5 rounded bg-white">
          {shift.status.replace('-', ' ')}
        </div>
      )}
    </div>
  );
};

export default ShiftCard;