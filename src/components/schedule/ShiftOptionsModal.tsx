import React, { useState } from 'react';
import { DayName, Shift } from '../../types';

interface ShiftOptionsModalProps {
  selectedDay: DayName | null;
  selectedShift: Shift | null;
  onClose: () => void;
  onDropShift: () => void;
  onSwapShift: () => void;
  onAdjustShift: () => void;
  onDeleteShift?: (shiftId: number) => Promise<boolean>;
}

const ShiftOptionsModal: React.FC<ShiftOptionsModalProps> = ({
  selectedDay,
  selectedShift,
  onClose,
  onDropShift,
  onSwapShift,
  onAdjustShift,
  onDeleteShift
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  if (!selectedDay || !selectedShift) return null;

  const handleDelete = async () => {
    if (!selectedShift.id || !onDeleteShift) return;
    
    setIsDeleting(true);
    const success = await onDeleteShift(selectedShift.id);
    if (success) {
      onClose();
    } else {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-4">
        <h3 className="text-lg font-medium mb-4">Shift Options</h3>
        <div className="mb-4">
          <div className="font-medium">{selectedShift.caregiver}'s Shift</div>
          <div className="text-sm text-gray-600">
            {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}, {selectedShift.start} - {selectedShift.end}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Status: {selectedShift.status.charAt(0).toUpperCase() + selectedShift.status.slice(1).replace('-', ' ')}
          </div>
        </div>
        
        {!confirmDelete ? (
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
              className="bg-blue-100 border border-blue-300 rounded-lg p-3 text-center"
            >
              <div className="font-medium text-blue-800">Adjust Hours</div>
              <div className="text-xs text-blue-700 mt-1">Change times</div>
            </button>
            {onDeleteShift && (
              <button 
                onClick={() => setConfirmDelete(true)}
                className="bg-gray-100 border border-gray-300 rounded-lg p-3 text-center"
              >
                <div className="font-medium text-gray-800">Delete Shift</div>
                <div className="text-xs text-gray-700 mt-1">Remove permanently</div>
              </button>
            )}
          </div>
        ) : (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
            <p className="text-red-800 font-medium mb-2">Delete this shift?</p>
            <p className="text-red-700 text-sm mb-3">This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded text-sm"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        )}
        
        <div className="mt-4 text-right">
          <button 
            onClick={onClose}
            className="text-gray-600 px-4 py-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShiftOptionsModal;