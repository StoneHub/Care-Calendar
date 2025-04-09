import React, { useState, useEffect } from 'react';
import { DayName, Shift } from '../types';
import { useScheduleContext } from '../context/ScheduleContext';
import EnhancedWeekSelector from '../components/schedule/EnhancedWeekSelector';
import EnhancedScheduleGrid from '../components/schedule/EnhancedScheduleGrid';
import EnhancedAddShiftModal from '../components/schedule/EnhancedAddShiftModal';
import TeamManagementPage from './TeamManagementPage';
import { HistoryView } from '../components/history';
import { logger } from '../utils/logger';

// Enum to track the active tab
enum TabType {
  Schedule = 'schedule',
  Team = 'team',
  History = 'history'
}

// Enum to track modal types
enum ModalType {
  None = 'none',
  AddShift = 'addShift',
  ShiftOptions = 'shiftOptions',
  CreateWeek = 'createWeek'
}

const EnhancedCareSchedulerPage: React.FC = () => {
  // Get data and operations from context
  const { 
    selectedDay, 
    selectedShift, 
    setSelectedDay, 
    setSelectedShift,
    isLoading,
    error,
    dropShift,
    deleteShift
  } = useScheduleContext();
  
  // Get active tab from local storage or default to Schedule
  const getInitialActiveTab = (): TabType => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('careCalendarActiveTab');
      if (savedTab && Object.values(TabType).includes(savedTab as TabType)) {
        return savedTab as TabType;
      }
    }
    return TabType.Schedule;
  };
  
  // Local state
  const [activeTab, setActiveTab] = useState<TabType>(getInitialActiveTab());
  const [activeModal, setActiveModal] = useState<ModalType>(ModalType.None);
  const [showLogs, setShowLogs] = useState<boolean>(false);
  
  // Save active tab to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('careCalendarActiveTab', activeTab);
  }, [activeTab]);
  
  // Open a modal
  const openModal = (type: ModalType, day?: DayName) => {
    setActiveModal(type);
    if (day) {
      setSelectedDay(day);
    }
  };
  
  // Close the active modal
  const closeModal = () => {
    setActiveModal(ModalType.None);
    setSelectedDay(null);
    setSelectedShift(null);
  };
  
  // Handle schedule grid day click
  const handleDayClick = (day: DayName) => {
    logger.info('Day clicked', { day });
    openModal(ModalType.AddShift, day);
  };
  
  // Handle schedule grid shift click
  const handleShiftClick = (day: DayName, shift: Shift) => {
    logger.info('Shift clicked', { day, shiftId: shift.id });
    setSelectedDay(day);
    setSelectedShift(shift);
    openModal(ModalType.ShiftOptions);
  };
  
  // Handle drop shift action
  const handleDropShift = async () => {
    if (!selectedShift) return;
    
    logger.info('Dropping shift', { shiftId: selectedShift.id });
    const success = await dropShift(selectedShift.id);
    
    if (success) {
      closeModal();
    }
  };
  
  // Handle delete shift action
  const handleDeleteShift = async () => {
    if (!selectedShift) return;
    
    logger.info('Deleting shift', { shiftId: selectedShift.id });
    const success = await deleteShift(selectedShift.id);
    
    if (success) {
      closeModal();
    }
  };
  
  // Render the ShiftOptionsModal
  const renderShiftOptionsModal = () => {
    if (!selectedShift) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Shift Options</h3>
            <button
              onClick={closeModal}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <div className="font-medium text-lg">{selectedShift.caregiver}</div>
            <div className="text-gray-600">
              {selectedDay ? (selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)) : ''}, {selectedShift.start} - {selectedShift.end}
            </div>
            <div className="mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                selectedShift.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                selectedShift.status === 'dropped' ? 'bg-red-100 text-red-800' :
                selectedShift.status === 'adjusted' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {selectedShift.status.replace('-', ' ')}
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={handleDropShift}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              Drop Shift
            </button>
            
            <button
              onClick={handleDeleteShift}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Shift
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">Care Calendar</h1>
            
            {/* Version information */}
            <div className="text-sm text-gray-500">
              v0.2.0
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Week selector */}
        <EnhancedWeekSelector />
        
        {/* Tab navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab(TabType.Schedule)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === TabType.Schedule
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Schedule
            </button>
            <button
              onClick={() => setActiveTab(TabType.Team)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === TabType.Team
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Team
            </button>
            <button
              onClick={() => setActiveTab(TabType.History)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === TabType.History
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              History
            </button>
          </nav>
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => openModal(ModalType.AddShift)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Shift
          </button>
        </div>
        
        {/* Global error message */}
        {error && (
          <div className="mb-4 p-4 rounded-md bg-red-50 border border-red-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Tab content */}
        {activeTab === TabType.Schedule && (
          <EnhancedScheduleGrid 
            onDayClick={handleDayClick}
            onShiftClick={handleShiftClick}
          />
        )}
        
        {activeTab === TabType.Team && (
          <TeamManagementPage />
        )}
        
        {activeTab === TabType.History && (
          <HistoryView />
        )}
      </main>
      
      {/* Debug button for logs - only in development */}
      {(typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') && (
        <button 
          onClick={() => setShowLogs(true)}
          className="fixed bottom-20 right-4 z-40 bg-gray-800 text-white px-3 py-1 rounded-full text-xs shadow-lg"
        >
          View Logs
        </button>
      )}
      
      {/* Modals */}
      {activeModal === ModalType.AddShift && (
        <EnhancedAddShiftModal 
          initialDay={selectedDay}
          onClose={closeModal}
        />
      )}
      
      {activeModal === ModalType.ShiftOptions && renderShiftOptionsModal()}
      
      {/* Log viewer modal */}
      {showLogs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl h-3/4 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">Log Viewer</h3>
              <button
                onClick={() => setShowLogs(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-grow p-4 overflow-auto bg-gray-800 text-gray-200 font-mono text-sm">
              <p>Log output would appear here in a real implementation.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedCareSchedulerPage;
