import React, { useState } from 'react';
import { Caregiver } from '../../types';

interface CaregiverModalProps {
  mode: 'add' | 'edit';
  caregiver?: Caregiver;
  onClose: () => void;
  onSave: (caregiver: Caregiver | Omit<Caregiver, 'id'>) => void;
}

const CaregiverModal: React.FC<CaregiverModalProps> = ({
  mode,
  caregiver,
  onClose,
  onSave
}) => {
  const [name, setName] = useState(caregiver?.name || '');
  const [role, setRole] = useState(caregiver?.role || 'Day Shift');
  const [availability, setAvailability] = useState(caregiver?.availability || 'Weekdays');
  const [hours, setHours] = useState(caregiver?.hours || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the form
    if (!name.trim()) {
      alert('Name is required');
      return;
    }
    
    if (mode === 'edit' && caregiver) {
      // Ensure ID is correctly passed for updates
      const updatedCaregiver: Caregiver = {
        id: caregiver.id,
        name,
        role,
        availability,
        hours
      };
      onSave(updatedCaregiver);
    } else {
      // For new caregivers
      const newCaregiver = {
        name,
        role,
        availability,
        hours
      };
      onSave(newCaregiver);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-sm w-full p-4">
        <h3 className="text-lg font-medium mb-4 dark:text-white">
          {mode === 'add' ? 'Add New Team Member' : 'Edit Team Member'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
              placeholder="Enter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select 
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option>Day Shift</option>
              <option>Evening Shift</option>
              <option>Weekend Shift</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Availability</label>
            <select 
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              required
            >
              <option>Weekdays</option>
              <option>Weekends</option>
              <option>All days</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hours per week</label>
            <input 
              type="number" 
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
              placeholder="Enter hours"
              value={hours}
              onChange={(e) => setHours(parseInt(e.target.value) || 0)}
              required
              min="1"
            />
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button 
              type="button"
              onClick={onClose}
              className="text-gray-600 dark:text-gray-300 px-4 py-2"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded"
            >
              {mode === 'add' ? 'Add Member' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CaregiverModal;