import React from 'react';
import { Calendar, MessageSquare, User, Settings } from 'lucide-react';
import { Notification } from '../../types';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: 'schedule' | 'notifications' | 'team') => void;
  pendingNotificationsCount: number;
}

const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  pendingNotificationsCount
}) => {
  return (
    <div className="bg-white border-t flex justify-around p-2">
      <button 
        onClick={() => onTabChange('schedule')} 
        className={`flex flex-col items-center p-2 ${activeTab === 'schedule' ? 'text-blue-600' : 'text-gray-600'}`}
      >
        <Calendar size={24} />
        <span className="text-xs mt-1">Schedule</span>
      </button>
      <button 
        onClick={() => onTabChange('notifications')} 
        className={`flex flex-col items-center p-2 relative ${activeTab === 'notifications' ? 'text-blue-600' : 'text-gray-600'}`}
      >
        <MessageSquare size={24} />
        {pendingNotificationsCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {pendingNotificationsCount}
          </span>
        )}
        <span className="text-xs mt-1">Updates</span>
      </button>
      <button 
        onClick={() => onTabChange('team')} 
        className={`flex flex-col items-center p-2 ${activeTab === 'team' ? 'text-blue-600' : 'text-gray-600'}`}
      >
        <User size={24} />
        <span className="text-xs mt-1">Team</span>
      </button>
      <button 
        className="flex flex-col items-center p-2 text-gray-600"
      >
        <Settings size={24} />
        <span className="text-xs mt-1">Settings</span>
      </button>
    </div>
  );
};

export default BottomNav;