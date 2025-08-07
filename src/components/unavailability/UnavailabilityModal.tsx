import React from 'react';

interface UnavailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId?: number;
}

const UnavailabilityModal: React.FC<UnavailabilityModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Unavailability</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Unavailability management will be added in a future update.
        </p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnavailabilityModal;