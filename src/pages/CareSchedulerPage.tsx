import React from 'react';
import { useSchedule, useTeam, useUIState } from '../hooks';
import Header from '../components/layout/Header';
import BottomNav from '../components/layout/BottomNav';
import ScheduleGrid from '../components/schedule/ScheduleGrid';
import ShiftOptionsModal from '../components/schedule/ShiftOptionsModal';
import NotificationsView from '../components/notifications/NotificationsView';
import TeamView from '../components/team/TeamView';
import CaregiverModal from '../components/team/CaregiverModal';
import { Caregiver } from '../types';

const CareSchedulerPage: React.FC = () => {
  // Hook for schedule management
  const { 
    schedule, 
    notifications, 
    selectedDay, 
    selectedShift, 
    handleShiftClick, 
    handleDropShift, 
    handleSwapShift, 
    handleAdjustShift, 
    approveRequest, 
    getShiftStatusColor,
    setSelectedDay,
    setSelectedShift
  } = useSchedule();

  // Hook for team management
  const {
    caregivers,
    selectedCaregiver,
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
  const handleShiftSelection = (day, shift) => {
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

  const handleSaveCaregiver = (caregiver: Caregiver | Omit<Caregiver, 'id'>) => {
    if ('id' in caregiver) {
      updateCaregiver(caregiver);
    } else {
      addCaregiver(caregiver);
    }
  };

  const handleWeekNavigation = (direction: 'prev' | 'next' | 'today') => {
    // This would be implemented with actual date handling in a real app
    console.log(`Navigate to ${direction} week`);
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
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4">
        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <ScheduleGrid 
            schedule={schedule}
            onShiftClick={handleShiftSelection}
            getShiftStatusColor={getShiftStatusColor}
          />
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
          onDropShift={() => {
            handleDropShift();
            handleCloseModal();
          }}
          onSwapShift={() => {
            handleSwapShift();
            handleCloseModal();
          }}
          onAdjustShift={() => {
            handleAdjustShift();
            handleCloseModal();
          }}
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
    </div>
  );
};

export default CareSchedulerPage;