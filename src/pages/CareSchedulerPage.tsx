import React, { useState, useEffect } from 'react';
import { useSchedule, useTeam, useUIState, useWeeks } from '../hooks';
import { logger } from '../utils/logger';
import Header from '../components/layout/Header';
import BottomNav from '../components/layout/BottomNav';
import ScheduleGrid from '../components/schedule/ScheduleGrid';
import ShiftOptionsModal from '../components/schedule/ShiftOptionsModal';
import NotificationsView from '../components/notifications/NotificationsView';
import TeamView from '../components/team/TeamView';
import CaregiverModal from '../components/team/CaregiverModal';
import AddShiftModal from '../components/schedule/AddShiftModal';
import LogViewer from '../components/shared/LogViewer';
import { Caregiver, DayName } from '../types';

const CareSchedulerPage: React.FC = () => {
  // State for log viewer
  const [showLogs, setShowLogs] = useState(false);
  
  // Hook for week management
  const {
    weeks,
    currentWeek,
    selectedWeek,
    isLoading: weeksLoading,
    error: weeksError,
    fetchWeeks,
    createWeek,
    selectWeek
  } = useWeeks();

  // Hook for schedule management
  const { 
    schedule, 
    notifications, 
    selectedDay, 
    selectedShift, 
    isLoading: scheduleLoading,
    error: scheduleError,
    handleShiftClick, 
    handleDropShift, 
    handleSwapShift, 
    handleAdjustShift, 
    approveRequest, 
    getShiftStatusColor,
    setSelectedDay,
    setSelectedShift,
    addShift,
    deleteShift
  } = useSchedule({ selectedWeek });

  // Hook for team management
  const {
    caregivers,
    selectedCaregiver,
    isLoading: teamsLoading,
    error: teamsError,
    addCaregiver,
    updateCaregiver,
    selectCaregiver,
    setSelectedCaregiver
  } = useTeam();

  // Hook for UI state
  const {
    activeTab,
    showModal,
    modalType,
    openModal,
    closeModal,
    switchTab
  } = useUIState();

  // Handlers
  const handleShiftSelection = (day: DayName, shift) => {
    handleShiftClick(day, shift);
    openModal('shiftOptions');
  };

  const handleCloseModal = () => {
    closeModal();
    setSelectedDay(null);
    setSelectedShift(null);
    setSelectedCaregiver(null);
  };

  const handleEditMember = (caregiver: Caregiver) => {
    selectCaregiver(caregiver.id);
    openModal('editTeamMember');
  };

  const handleAddMember = () => {
    openModal('addTeamMember');
  };

  const handleSaveCaregiver = async (caregiver: Caregiver | Omit<Caregiver, 'id'>) => {
    if ('id' in caregiver) {
      await updateCaregiver(caregiver);
    } else {
      await addCaregiver(caregiver);
    }
  };

  const handleWeekNavigation = (direction: 'prev' | 'next' | 'today') => {
    if (!weeks.length) {
      logger.warn('Cannot navigate weeks - no weeks available');
      return;
    }
    
    if (direction === 'today' && currentWeek) {
      logger.info('Navigating to current week', { week_id: currentWeek.id });
      selectWeek(currentWeek.id);
      return;
    }
    
    // Weeks should already be sorted by start date in the useWeeks hook
    // But let's ensure it here to be safe
    const sortedWeeks = [...weeks].sort((a, b) => 
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );
    
    // Find current index
    const currentIndex = selectedWeek 
      ? sortedWeeks.findIndex(w => w.id === selectedWeek.id)
      : -1;
    
    if (currentIndex === -1) {
      logger.warn('Cannot navigate weeks - current week not found in sorted list', {
        selectedWeekId: selectedWeek?.id,
        sortedWeekIds: sortedWeeks.map(w => w.id)
      });
      return;
    }
    
    // Log for debugging
    logger.info('Week navigation request', {
      direction,
      currentIndex,
      selectedWeekId: selectedWeek?.id,
      selectedWeekDates: selectedWeek ? `${selectedWeek.start_date} to ${selectedWeek.end_date}` : 'none',
      totalWeeks: sortedWeeks.length,
      prevWeekId: currentIndex > 0 ? sortedWeeks[currentIndex - 1].id : null,
      nextWeekId: currentIndex < sortedWeeks.length - 1 ? sortedWeeks[currentIndex + 1].id : null
    });
    
    if (direction === 'prev' && currentIndex > 0) {
      // Go to previous week
      const prevWeek = sortedWeeks[currentIndex - 1];
      logger.info('Navigating to previous week', { 
        from_id: selectedWeek?.id,
        to_id: prevWeek.id,
        to_dates: `${prevWeek.start_date} to ${prevWeek.end_date}`
      });
      selectWeek(prevWeek.id);
    } else if (direction === 'next' && currentIndex < sortedWeeks.length - 1) {
      // Go to next week
      const nextWeek = sortedWeeks[currentIndex + 1];
      logger.info('Navigating to next week', { 
        from_id: selectedWeek?.id,
        to_id: nextWeek.id,
        to_dates: `${nextWeek.start_date} to ${nextWeek.end_date}`
      });
      selectWeek(nextWeek.id);
    } else {
      logger.warn('Cannot navigate further in that direction', {
        direction,
        currentIndex,
        totalWeeks: sortedWeeks.length
      });
    }
  };
  
  // Handlers for shift management
  const handleOpenAddShift = (day: DayName | null = null) => {
    setSelectedDay(day);
    openModal('addShift');
  };
  
  const handleAddShift = async (day: DayName, shiftData) => {
    return await addShift(day, shiftData);
  };
  
  const handleDeleteShift = async (shiftId: number) => {
    return await deleteShift(shiftId);
  };

  // Count pending notifications for badge
  const pendingNotificationsCount = notifications.filter(n => n.status === 'pending').length;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* App Header */}
      <Header 
        onPreviousWeek={() => handleWeekNavigation('prev')}
        onNextWeek={() => handleWeekNavigation('next')}
        onToday={() => handleWeekNavigation('today')}
        onPayroll={() => console.log('Payroll')}
        selectedWeek={selectedWeek}
        isCurrentWeek={currentWeek && selectedWeek && currentWeek.id === selectedWeek.id}
      />
      
      {/* Debug button for logs - only in development */}
      {process.env.NODE_ENV !== 'production' && (
        <button 
          onClick={() => setShowLogs(true)}
          className="fixed bottom-20 right-4 z-50 bg-gray-800 text-white px-3 py-1 rounded-full text-xs shadow-lg"
        >
          View Logs
        </button>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4">
        {/* Loading States */}
        {(weeksLoading || scheduleLoading || teamsLoading) && (
          <div className="text-center py-4">
            <p className="text-gray-500">Loading...</p>
          </div>
        )}
        
        {/* Error States */}
        {(weeksError || scheduleError || teamsError) && (
          <div className="bg-red-100 text-red-800 p-3 rounded mb-4">
            {weeksError || scheduleError || teamsError}
          </div>
        )}
        
        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <>
            {/* Add Shift and Week Info Header */}
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm font-medium">
                {selectedWeek && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded">
                    {new Date(selectedWeek.start_date).toLocaleDateString()} - {new Date(selectedWeek.end_date).toLocaleDateString()}
                    {currentWeek && selectedWeek.id === currentWeek.id && (
                      <span className="ml-2 bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">Current</span>
                    )}
                  </span>
                )}
              </div>
              
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center text-sm font-medium"
                onClick={() => handleOpenAddShift(null)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Shift
              </button>
            </div>
            
            {/* Schedule Grid */}
            <ScheduleGrid 
              schedule={schedule}
              selectedWeek={selectedWeek}
              onShiftClick={handleShiftSelection}
              getShiftStatusColor={getShiftStatusColor}
            />
          </>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <NotificationsView 
            notifications={notifications}
            onApprove={approveRequest}
          />
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <TeamView 
            caregivers={caregivers}
            onAddMember={handleAddMember}
            onEditMember={handleEditMember}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav 
        activeTab={activeTab}
        onTabChange={switchTab}
        pendingNotificationsCount={pendingNotificationsCount}
      />

      {/* Modals */}
      {showModal && modalType === 'shiftOptions' && (
        <ShiftOptionsModal 
          selectedDay={selectedDay}
          selectedShift={selectedShift}
          onClose={handleCloseModal}
          onDropShift={async () => {
            const success = await handleDropShift();
            if (success) handleCloseModal();
          }}
          onSwapShift={async () => {
            const success = await handleSwapShift();
            if (success) handleCloseModal();
          }}
          onAdjustShift={async () => {
            const success = await handleAdjustShift();
            if (success) handleCloseModal();
          }}
          onDeleteShift={handleDeleteShift}
        />
      )}

      {showModal && (modalType === 'addTeamMember' || modalType === 'editTeamMember') && (
        <CaregiverModal 
          mode={modalType === 'addTeamMember' ? 'add' : 'edit'}
          caregiver={selectedCaregiver || undefined}
          onClose={handleCloseModal}
          onSave={handleSaveCaregiver}
        />
      )}
      
      {showModal && modalType === 'addShift' && (
        <AddShiftModal 
          selectedDay={selectedDay}
          caregivers={caregivers}
          selectedWeek={selectedWeek}
          weeks={weeks}
          onClose={handleCloseModal}
          onAddShift={handleAddShift}
          onSelectWeek={selectWeek}
        />
      )}
      
      
      {/* Log Viewer */}
      {showLogs && (
        <LogViewer onClose={() => setShowLogs(false)} />
      )}
    </div>
  );
};

export default CareSchedulerPage;