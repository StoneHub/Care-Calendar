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
      className={`p-3 border-b cursor-pointer ${statusColorClass}`}
      onClick={onClick}
    >
      <div className="font-medium">{shift.caregiver}</div>
      <div className="text-xs text-gray-600">{shift.start} - {shift.end}</div>
      
      {shift.status === 'requested-off' && (
        <div className="mt-1 text-xs flex items-center text-amber-700">
          <AlertTriangle size={12} className="mr-1" />
          Time off requested
        </div>
      )}
      
      {shift.status === 'swap-proposed' && (
        <div className="mt-1 text-xs flex items-center text-purple-700">
          <Clock size={12} className="mr-1" />
          Swap with {shift.swapWith}
        </div>
      )}
    </div>
  );
};

export default ShiftCard;