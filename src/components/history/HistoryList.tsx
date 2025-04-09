import React from 'react';
import { HistoryRecord } from '../../types';
import HistoryItem from './HistoryItem';

interface HistoryListProps {
  records: HistoryRecord[];
}

/**
 * Renders a list of history records
 */
const HistoryList: React.FC<HistoryListProps> = ({ records }) => {
  // Group records by date (for UI organization)
  const groupByDate = (records: HistoryRecord[]): Record<string, HistoryRecord[]> => {
    return records.reduce((groups, record) => {
      // Extract date part only (ignoring time)
      const date = new Date(record.timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      if (!groups[date]) {
        groups[date] = [];
      }

      groups[date].push(record);
      return groups;
    }, {} as Record<string, HistoryRecord[]>);
  };

  const recordsByDate = groupByDate(records);
  const dates = Object.keys(recordsByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  // No records message
  if (records.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No history records found.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {dates.map(date => (
        <div key={date} className="py-4">
          <h3 className="px-4 mb-2 text-sm font-medium text-gray-500">{date}</h3>
          <ul className="space-y-1">
            {recordsByDate[date].map(record => (
              <HistoryItem key={record.id} record={record} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default HistoryList;