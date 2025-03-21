import React from 'react';
import { DayName, Shift } from '../../types';

interface ShiftOptionsModalProps {
  selectedDay: DayName | null;
  selectedShift: Shift | null;
  onClose: () => void;
  onDropShift: () => void;
  onSwapShift: () => void;
  onAdjustShift: () => void;
}

const ShiftOptionsModal: React.FC<ShiftOptionsModalProps> = ({
  selectedDay,
  selectedShift,
  onClose,
  onDropShift,
  onSwapShift,
  onAdjustShift
}) => {
  if (!selectedDay || !selectedShift) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-4">
        <h3 className="text-lg font-medium mb-4">Shift Options</h3>
        <div className="mb-4">
          <div className="font-medium">{selectedShift.caregiver}'s Shift</div>
          <div className="text-sm text-gray-600">
            {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}, {selectedShift.start} - {selectedShift.end}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={onDropShift}
            className="bg-red-100 border border-red-300 rounded-lg p-3 text-center"
          >
            <div className="font-medium text-red-800">Drop Shift</div>
            <div className="text-xs text-red-700 mt-1">Need coverage</div>
          </button>
          <button 
            onClick={onSwapShift}
            className="bg-purple-100 border border-purple-300 rounded-lg p-3 text-center"
          >
            <div className="font-medium text-purple-800">Swap Shift</div>
            <div className="text-xs text-purple-700 mt-1">With team member</div>
          </button>
          <button 
            onClick={onAdjustShift}
            className="bg-blue-100 border border-blue-300 rounded-lg p-3 text-center col-span-2"
          >
            <div className="font-medium text-blue-800">Adjust Shift Hours</div>
            <div className="text-xs text-blue-700 mt-1">Change start/end times</div>
          </button>
        </div>
        <div className="mt-4 text-right">
          <button 
            onClick={onClose}
            className="text-gray-600 px-4 py-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShiftOptionsModal;