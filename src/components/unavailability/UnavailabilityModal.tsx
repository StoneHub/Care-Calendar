import React, { useState, useEffect } from 'react';
import { useScheduleContext } from '../../context/ScheduleContext';
import { NewUnavailabilityData } from '../../types';
import { logger } from '../../utils/logger';

interface UnavailabilityModalProps {
  onClose: () => void;
  caregiverId?: number;
  editId?: number;
}

const UnavailabilityModal: React.FC<UnavailabilityModalProps> = ({ 
  onClose, 
  caregiverId,
  editId
}) => {
  const { caregivers, unavailability, addUnavailability, updateUnavailability } = useScheduleContext();
  
  // Form state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedCaregiverId, setSelectedCaregiverId] = useState<number>(caregiverId || 0);
  const [reason, setReason] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringEndDate, setRecurringEndDate] = useState<string>('');
  
  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load data if editing existing record
  useEffect(() => {
    if (editId) {
      const recordToEdit = unavailability.find(item => item.id === editId);
      if (recordToEdit) {
        setStartDate(recordToEdit.startDate);
        setEndDate(recordToEdit.endDate);
        setSelectedCaregiverId(recordToEdit.caregiverId);
        setReason(recordToEdit.reason || '');
        setIsRecurring(recordToEdit.isRecurring);
        setRecurringEndDate(recordToEdit.recurringEndDate || '');
      }
    } else {
      // Set default dates when creating a new record
      const today = new Date();
      const formattedToday = today.toISOString().split('T')[0];
      
      // Default to today and tomorrow for start/end dates
      setStartDate(formattedToday);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setEndDate(tomorrow.toISOString().split('T')[0]);
    }
  }, [editId, unavailability]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!startDate || !endDate || !selectedCaregiverId) {
      setError('Please fill out all required fields.');
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      setError('End date must be after start date.');
      return;
    }
    
    if (isRecurring && recurringEndDate && new Date(recurringEndDate) < new Date(endDate)) {
      setError('Recurring end date must be after the end date.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Prepare data
      const unavailabilityData: NewUnavailabilityData = {
        caregiverId: selectedCaregiverId,
        startDate,
        endDate,
        reason,
        isRecurring,
        recurringEndDate: isRecurring ? recurringEndDate : undefined
      };
      
      logger.info(
        editId ? 'Updating unavailability record' : 'Adding new unavailability record',
        unavailabilityData
      );
      
      // Create or update the record
      let success = false;
      
      if (editId) {
        success = await updateUnavailability(editId, unavailabilityData);
      } else {
        success = await addUnavailability(unavailabilityData);
      }
      
      if (success) {
        onClose();
      } else {
        setError('Failed to save. Please try again.');
      }
    } catch (err: any) {
      logger.error('Error in UnavailabilityModal', { error: err.message });
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4 dark:text-white">
            {editId ? 'Edit Unavailability' : 'Mark Unavailability'}
          </h2>
          
          {error && (
            <div className="mb-4 p-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-1 dark:text-white">Caregiver</label>
              <select 
                value={selectedCaregiverId || ''} 
                onChange={(e) => setSelectedCaregiverId(Number(e.target.value))}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                disabled={!!caregiverId || isLoading}
                required
              >
                <option value="">Select Caregiver</option>
                {caregivers.map((caregiver) => (
                  <option key={caregiver.id} value={caregiver.id}>
                    {caregiver.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block mb-1 dark:text-white">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block mb-1 dark:text-white">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block mb-1 dark:text-white">Reason (Optional)</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Vacation, Personal Day, etc."
                disabled={isLoading}
              />
            </div>
            
            <div className="mb-4">
              <label className="flex items-center dark:text-white">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="mr-2"
                  disabled={isLoading}
                />
                Repeats Weekly
              </label>
            </div>
            
            {isRecurring && (
              <div className="mb-4">
                <label className="block mb-1 dark:text-white">Repeat Until</label>
                <input
                  type="date"
                  value={recurringEndDate}
                  onChange={(e) => setRecurringEndDate(e.target.value)}
                  min={endDate}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  disabled={isLoading}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  If left blank, will repeat until end of year.
                </p>
              </div>
            )}
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded dark:border-gray-600 dark:text-white"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !startDate || !endDate || !selectedCaregiverId}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300 dark:disabled:bg-blue-800"
              >
                {isLoading ? 'Saving...' : editId ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UnavailabilityModal;
