import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Notification } from '../../types';

interface NotificationListProps {
  notifications: Notification[];
  showCompleted: boolean;
  onApprove: (id: number) => void;
}

const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  showCompleted,
  onApprove
}) => {
  const filteredNotifications = notifications.filter(n => 
    showCompleted ? n.status === 'completed' : n.status === 'pending'
  ).sort((a, b) => {
    // Sort by date first (newest first)
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    // Then by time if available (newest first)
    if (a.time && b.time) return a.time < b.time ? 1 : -1;
    // Fall back to id (newest first)
    return b.id - a.id;
  });

  if (filteredNotifications.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        {showCompleted ? 'No history available' : 'No active notifications'}
      </div>
    );
  }

  return (
    <div className="divide-y">
      {filteredNotifications.map((notification) => (
        <div key={notification.id} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium flex items-center">
                {notification.type === 'suggestion' ? 'Smart Suggestion' : `${notification.from}'s ${notification.type === 'adjust' ? 'Adjustment' : notification.type === 'swap' ? 'Swap' : 'Drop'}`}
                {notification.status === 'completed' && (
                  <CheckCircle size={16} className="ml-2 text-green-600" />
                )}
              </div>
              <div className="text-sm text-gray-600 flex items-center">
                {notification.date} {notification.time && `at ${notification.time}`}
              </div>
              <div className="mt-1">{notification.message}</div>
            </div>
            {notification.status === 'pending' && notification.type !== 'suggestion' && (
              <div className="flex space-x-2">
                <button 
                  onClick={() => onApprove(notification.id)}
                  className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                >
                  Confirm
                </button>
              </div>
            )}
            {notification.status === 'pending' && notification.type === 'suggestion' && (
              <div className="flex space-x-2">
                <button 
                  onClick={() => onApprove(notification.id)}
                  className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationList;