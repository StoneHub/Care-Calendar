import React, { useState } from 'react';
import { Notification } from '../../types';
import NotificationList from './NotificationList';

interface NotificationsViewProps {
  notifications: Notification[];
  onApprove: (id: number) => void;
}

const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onApprove
}) => {
  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex border-b">
        <button 
          onClick={() => setViewMode('active')}
          className={`py-3 px-4 font-medium ${viewMode !== 'history' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
        >
          Active Notifications
        </button>
        <button 
          onClick={() => setViewMode('history')}
          className={`py-3 px-4 font-medium ${viewMode === 'history' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
        >
          History
        </button>
      </div>
      
      <NotificationList 
        notifications={notifications}
        showCompleted={viewMode === 'history'}
        onApprove={onApprove}
      />
    </div>
  );
};

export default NotificationsView;