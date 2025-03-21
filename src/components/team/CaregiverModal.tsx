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

  const handleSubmit = () => {
    const updatedCaregiver = {
      id: caregiver?.id,
      name,
      role,
      availability,
      hours
    };
    
    onSave(mode === 'edit' ? updatedCaregiver as Caregiver : updatedCaregiver);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-4">
        <h3 className="text-lg font-medium mb-4">
          {mode === 'add' ? 'Add New Team Member' : 'Edit Team Member'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded" 
              placeholder="Enter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select 
              className="w-full p-2 border rounded"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option>Day Shift</option>
              <option>Evening Shift</option>
              <option>Weekend Shift</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
            <select 
              className="w-full p-2 border rounded"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            >
              <option>Weekdays</option>
              <option>Weekends</option>
              <option>All days</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hours per week</label>
            <input 
              type="number" 
              className="w-full p-2 border rounded" 
              placeholder="Enter hours"
              value={hours}
              onChange={(e) => setHours(parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="text-gray-600 px-4 py-2"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {mode === 'add' ? 'Add Member' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaregiverModal;