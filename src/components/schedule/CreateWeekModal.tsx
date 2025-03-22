import React, { useState } from 'react';
import { Week } from '../../types';

interface CreateWeekModalProps {
  onClose: () => void;
  onCreateWeek: (week: Omit<Week, 'id'>) => Promise<Week | null>;
}

const CreateWeekModal: React.FC<CreateWeekModalProps> = ({
  onClose,
  onCreateWeek
}) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to get next Monday's date
  const getNextMonday = (): string => {
    const date = new Date();
    const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // If today is not Monday, move to next Monday
    if (day !== 1) {
      date.setDate(date.getDate() + (8 - day) % 7);
    } else {
      // If today is Monday, move to next Monday
      date.setDate(date.getDate() + 7);
    }
    
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };

  // Helper to get end date (Sunday) from a given Monday
  const getSundayFromMonday = (mondayDate: string): string => {
    const date = new Date(mondayDate);
    date.setDate(date.getDate() + 6); // Add 6 days to get to Sunday
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };

  // Set initial dates if not yet set
  if (!startDate) {
    const nextMonday = getNextMonday();
    setStartDate(nextMonday);
    setEndDate(getSundayFromMonday(nextMonday));
  }

  // Update end date when start date changes
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    setEndDate(getSundayFromMonday(newStartDate));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    // Validate input
    if (!startDate || !endDate) {
      setError('Please set both start and end dates');
      setIsSubmitting(false);
      return;
    }
    
    // Validate that end date is after start date
    if (new Date(endDate) <= new Date(startDate)) {
      setError('End date must be after start date');
      setIsSubmitting(false);
      return;
    }
    
    // Create the week
    try {
      const newWeek = await onCreateWeek({
        start_date: startDate,
        end_date: endDate,
        is_published: isPublished,
        notes: notes
      });
      
      if (newWeek) {
        onClose();
      } else {
        setError('Failed to create week. Please try again.');
      }
    } catch (err) {
      console.error('Error creating week:', err);
      setError('An error occurred while creating the week.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h3 className="text-lg font-medium mb-4">Create New Week</h3>
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 border border-red-300 text-red-800 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date (Monday)
              </label>
              <input 
                type="date"
                className="w-full p-2 border border-gray-300 rounded"
                value={startDate}
                onChange={handleStartDateChange}
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date (Sunday)
              </label>
              <input 
                type="date"
                className="w-full p-2 border border-gray-300 rounded"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={true} // Auto-calculated, so disabled
              />
              <p className="text-xs text-gray-500 mt-1">
                End date is automatically set to Sunday
              </p>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea 
              className="w-full p-2 border border-gray-300 rounded"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this week"
              rows={3}
              disabled={isSubmitting}
            />
          </div>
          
          <div className="mb-6">
            <label className="flex items-center">
              <input 
                type="checkbox"
                className="mr-2"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                disabled={isSubmitting}
              />
              <span className="text-sm text-gray-700">Publish this week immediately</span>
            </label>
          </div>
          
          <div className="flex justify-end gap-2">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Week'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWeekModal;