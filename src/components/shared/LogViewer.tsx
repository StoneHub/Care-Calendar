import React, { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';

interface LogViewerProps {
  onClose: () => void;
}

const LogViewer: React.FC<LogViewerProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  useEffect(() => {
    // Get logs from the logger service
    const logHistory = logger.getLogHistory();
    setLogs(logHistory);
  }, []);
  
  // Filter logs based on level and search term
  const filteredLogs = logs.filter(log => {
    const matchesLevel = filter === 'all' || log.level.toLowerCase() === filter.toLowerCase();
    const matchesSearch = !searchTerm || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.data && JSON.stringify(log.data).toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesLevel && matchesSearch;
  });
  
  const getLogLevelStyle = (level: string) => {
    switch (level.toLowerCase()) {
      case 'debug': return 'bg-gray-200 text-gray-800';
      case 'info': return 'bg-blue-200 text-blue-800';
      case 'warn': return 'bg-yellow-200 text-yellow-800';
      case 'error': return 'bg-red-200 text-red-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };
  
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    } catch (err) {
      return timestamp;
    }
  };
  
  const handleClearLogs = () => {
    logger.clearLogHistory();
    setLogs([]);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-bold">Application Logs</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 border-b flex flex-wrap gap-2 items-center">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Level:</label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="all">All</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2 flex-1">
            <label className="text-sm font-medium">Search:</label>
            <input 
              type="text" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter logs..." 
              className="border rounded px-2 py-1 text-sm flex-1"
            />
          </div>
          
          <button 
            onClick={handleClearLogs}
            className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200"
          >
            Clear Logs
          </button>
        </div>
        
        <div className="flex-1 overflow-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No logs to display
            </div>
          ) : (
            <div className="divide-y">
              {filteredLogs.map((log, index) => (
                <div key={index} className="p-3 hover:bg-gray-50">
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {formatTimestamp(log.timestamp)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getLogLevelStyle(log.level)}`}>
                      {log.level}
                    </span>
                    <span className="font-medium flex-1">
                      {log.message}
                    </span>
                  </div>
                  {log.data && (
                    <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                      {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogViewer;