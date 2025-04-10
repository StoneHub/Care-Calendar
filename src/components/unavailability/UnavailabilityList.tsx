import React, { useState, useEffect } from 'react';
import { useScheduleContext } from '../../context/ScheduleContext';
import { Unavailability } from '../../types';
import UnavailabilityModal from './UnavailabilityModal';

interface UnavailabilityListProps {
  caregiverId?: number;
}

const UnavailabilityList: React.FC<UnavailabilityListProps> = ({ caregiverId }) => {
  const { unavailability, deleteUnavailability } = useScheduleContext();
  const [filteredUnavailability, setFilteredUnavailability] = useState<Unavailability[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filter unavailability records when props or data changes
  useEffect(() => {
    if (caregiverId) {
      setFilteredUnavailability(
        unavailability.filter(item => item.caregiverId === caregiverId)
      );
    } else {
      setFilteredUnavailability(unavailability);
    }
  }, [unavailability, caregiverId]);

  const handleAdd = () => {
    setEditingId(undefined);
    setShowModal(true);
  };

  const handleEdit = (id: number) => {
    setEditingId(id);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this unavailability record?')) {
      setIsDeleting(true);
      setError(null);
      
      try {
        const success = await deleteUnavailability(id);
        if (!success) {
          setError('Failed to delete the record. Please try again.');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while deleting.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const formatDateRange = (startDate: string, endDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const formatOptions: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric',
      year: start.getFullYear() !== end.getFullYear() ? 'numeric' : undefined
    };
    
    let formattedRange = start.toLocaleDateString('en-US', formatOptions);
    
    if (startDate !== endDate) {
      formattedRange += ' - ' + end.toLocaleDateString('en-US', formatOptions);
    }
    
    return formattedRange;
  };

  return (
    <div className="unavailability-list">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold dark:text-white">
          {caregiverId ? 'Time Off' : 'Team Unavailability'}
        </h2>
        <button
          onClick={handleAdd}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={isDeleting}
        >
          Add Time Off
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
          {error}
        </div>
      )}
      
      {filteredUnavailability.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 italic">
          No unavailability records found.
        </p>
      ) : (
        <div className="space-y-2">
          {filteredUnavailability.map(item => (
            <div 
              key={item.id}
              className="p-3 bg-gray-100 dark:bg-gray-700 rounded flex justify-between items-center"
            >
              <div>
                {!caregiverId && (
                  <div className="font-medium dark:text-white">{item.caregiverName}</div>
                )}
                <div className="text-sm dark:text-gray-300">
                  {formatDateRange(item.startDate, item.endDate)}
                  {item.isRecurring && (
                    <span className="ml-2 text-blue-600 dark:text-blue-400">(Weekly)</span>
                  )}
                </div>
                {item.reason && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">{item.reason}</div>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(item.id)}
                  className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  disabled={isDeleting}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                  disabled={isDeleting}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showModal && (
        <UnavailabilityModal
          onClose={() => setShowModal(false)}
          caregiverId={caregiverId}
          editId={editingId}
        />
      )}
    </div>
  );
};

export default UnavailabilityList;
