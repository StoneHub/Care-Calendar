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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-sm w-full p-4">
        <h3 className="text-lg font-medium mb-4 dark:text-white">Shift Options</h3>
        <div className="mb-4">
          <div className="font-medium dark:text-white">{selectedShift.caregiver}'s Shift</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}, {selectedShift.start} - {selectedShift.end}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Status: {selectedShift.status.charAt(0).toUpperCase() + selectedShift.status.slice(1).replace('-', ' ')}
          </div>
        </div>
        
        {!confirmDelete ? (
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={onDropShift}
              className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg p-3 text-center"
            >
              <div className="font-medium text-red-800 dark:text-red-300">Drop Shift</div>
              <div className="text-xs text-red-700 dark:text-red-400 mt-1">Need coverage</div>
            </button>
            <button 
              onClick={onSwapShift}
              className="bg-purple-100 dark:bg-purple-900/20 border border-purple-300 dark:border-purple-800 rounded-lg p-3 text-center"
            >
              <div className="font-medium text-purple-800 dark:text-purple-300">Swap Shift</div>
              <div className="text-xs text-purple-700 dark:text-purple-400 mt-1">With team member</div>
            </button>
            <button 
              onClick={onAdjustShift}
              className="bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-800 rounded-lg p-3 text-center"
            >
              <div className="font-medium text-blue-800 dark:text-blue-300">Adjust Hours</div>
              <div className="text-xs text-blue-700 dark:text-blue-400 mt-1">Change times</div>
            </button>
            {onDeleteShift && (
              <button 
                onClick={() => setConfirmDelete(true)}
                className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-center"
              >
                <div className="font-medium text-gray-800 dark:text-gray-300">Delete Shift</div>
                <div className="text-xs text-gray-700 dark:text-gray-400 mt-1">Remove permanently</div>
              </button>
            )}
          </div>
        ) : (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-3">
            <p className="text-red-800 dark:text-red-300 font-medium mb-2">Delete this shift?</p>
            <p className="text-red-700 dark:text-red-400 text-sm mb-3">This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded text-sm"
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
            className="text-gray-600 dark:text-gray-300 px-4 py-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShiftOptionsModal;