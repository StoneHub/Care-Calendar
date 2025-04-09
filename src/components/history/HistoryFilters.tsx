import React from 'react';
import { useScheduleContext } from '../../context/ScheduleContext';
import { ActionType, EntityType } from '../../types';

interface HistoryFiltersProps {
  filters: {
    actionType: string;
    entityType: string;
    weekId: number;
    limit?: number;
  };
  onFilterChange: (filters: Partial<{
    actionType: string;
    entityType: string;
    weekId: number;
    limit: number;
  }>) => void;
}

/**
 * Filter controls for the history view
 */
const HistoryFilters: React.FC<HistoryFiltersProps> = ({
  filters,
  onFilterChange
}) => {
  const { weeks } = useScheduleContext();
  
  // Action type options
  const actionTypes: { value: ActionType | ''; label: string }[] = [
    { value: '', label: 'All Actions' },
    { value: 'create', label: 'Created' },
    { value: 'update', label: 'Updated' },
    { value: 'delete', label: 'Deleted' },
    { value: 'drop', label: 'Dropped' },
    { value: 'adjust', label: 'Adjusted' },
    { value: 'swap', label: 'Swapped' }
  ];

  // Entity type options
  const entityTypes: { value: EntityType | ''; label: string }[] = [
    { value: '', label: 'All Entities' },
    { value: 'shift', label: 'Shifts' },
    { value: 'week', label: 'Weeks' },
    { value: 'caregiver', label: 'Caregivers' },
    { value: 'notification', label: 'Notifications' }
  ];

  // Week options
  const weekOptions = [
    { value: 0, label: 'All Weeks' },
    ...weeks.map(week => ({
      value: week.id,
      label: `${week.start_date} to ${week.end_date}`
    }))
  ];

  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Action Type
        </label>
        <select
          value={filters.actionType}
          onChange={(e) => onFilterChange({ actionType: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          {actionTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Entity Type
        </label>
        <select
          value={filters.entityType}
          onChange={(e) => onFilterChange({ entityType: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          {entityTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Week
        </label>
        <select
          value={filters.weekId}
          onChange={(e) => onFilterChange({ weekId: parseInt(e.target.value, 10) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          {weekOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default HistoryFilters;