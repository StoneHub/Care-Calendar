import React from 'react';
import { HistoryRecord } from '../../types';

interface HistoryItemProps {
  record: HistoryRecord;
}

/**
 * Single history record item
 */
const HistoryItem: React.FC<HistoryItemProps> = ({ record }) => {
  // Get the appropriate icon based on action type
  const getActionIcon = (actionType: string): React.ReactNode => {
    switch (actionType) {
      case 'create':
        return (
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-500 dark:text-green-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
        );
      case 'update':
        return (
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 dark:text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
          </div>
        );
      case 'delete':
        return (
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500 dark:text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </div>
        );
      case 'drop':
        return (
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-500 dark:text-yellow-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </div>
        );
      case 'adjust':
        return (
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-500 dark:text-purple-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20v-6M6 20V10M18 20V4" />
            </svg>
          </div>
        );
      case 'swap':
        return (
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 3l-4 4-4-4M4 14l4-4 4 4M21 14h-3.5a2.5 2.5 0 0 0 0 5H21M3 10h3.5a2.5 2.5 0 0 0 0-5H3" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </div>
        );
    }
  };

  // Format the timestamp
  const formattedTime = new Date(record.timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });

  return (
    <li className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">
      <div className="flex items-start">
        {getActionIcon(record.action_type)}
        
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{record.description}</p>
            <span className="text-sm text-gray-500 dark:text-gray-400">{formattedTime}</span>
          </div>
          
          <div className="mt-1 flex flex-wrap gap-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
              {record.action_type}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
              {record.entity_type}
            </span>
            {record.caregiver_name && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                {record.caregiver_name}
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
};

export default HistoryItem;