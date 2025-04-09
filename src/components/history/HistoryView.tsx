import React, { useState, useEffect } from 'react';
import { HistoryRecord } from '../../types';
import { apiService } from '../../services/core/APIService';
import HistoryFilters from './HistoryFilters';
import HistoryList from './HistoryList';
import { logger } from '../../utils/logger';

/**
 * History View Component
 * Displays a list of history records with filtering options
 */
const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    actionType: '',
    entityType: '',
    weekId: 0,
    limit: 50
  });

  // Fetch history records when filters change
  useEffect(() => {
    fetchHistory();
  }, [filters]);

  // Fetch history from API
  const fetchHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const records = await apiService.getHistoryRecords(filters);
      setHistory(records);
    } catch (err: any) {
      logger.error('Failed to fetch history', {
        error: err.message,
        filters
      });
      setError('Failed to load history: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">Activity History</h2>
        <p className="text-sm text-gray-500 mt-1">
          View all changes made to the schedule
        </p>
        
        <HistoryFilters 
          filters={filters} 
          onFilterChange={(newFilters) => setFilters({...filters, ...newFilters})} 
        />
      </div>
      
      {error && (
        <div className="p-4 my-2 bg-red-50 text-red-700 border-l-4 border-red-500">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="p-8 text-center text-gray-500">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full mr-2"></div>
          Loading history...
        </div>
      ) : (
        <HistoryList records={history} />
      )}
    </div>
  );
};

export default HistoryView;