import { useState } from 'react';

type TabName = 'schedule' | 'notifications' | 'team';
type ModalType = '' | 'shiftOptions' | 'editTeamMember' | 'addTeamMember' | 'active' | 'history';

export const useUIState = () => {
  const [activeTab, setActiveTab] = useState<TabName>('schedule');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<ModalType>('');

  const openModal = (type: ModalType): void => {
    setModalType(type);
    setShowModal(true);
  };

  const closeModal = (): void => {
    setShowModal(false);
  };

  const switchTab = (tab: TabName): void => {
    setActiveTab(tab);
    
    // Set default modal type for notifications tab
    if (tab === 'notifications') {
      setModalType('active');
    }
  };

  return {
    activeTab,
    showModal,
    modalType,
    openModal,
    closeModal,
    switchTab
  };
};