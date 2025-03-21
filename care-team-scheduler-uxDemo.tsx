import React, { useState } from 'react';
import { Calendar, AlertTriangle, CheckCircle, Clock, User, MessageSquare, Settings } from 'lucide-react';

const CareScheduler = () => {
  // Mock state - would connect to Firebase in real implementation
  const [activeTab, setActiveTab] = useState('schedule');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'adjust', from: 'Robin', date: 'Wed, Mar 26', time: '14:35', message: 'Changed shift from 9AM-4PM to 10AM-5PM', status: 'completed' },
    { id: 2, type: 'swap', from: 'Kelly', date: 'Sat, Mar 29', time: '09:15', message: 'Swapped shift with Joanne', status: 'pending' },
    { id: 3, type: 'drop', from: 'Scarlet', date: 'Wed, Mar 26', time: '17:22', message: 'Dropped shift, needs coverage', status: 'pending' }
  ]);

  // Mock schedule data - would be stored in Firestore
  const [schedule, setSchedule] = useState({
    monday: [
      { id: 1, caregiver: 'Robin', start: '9:00 AM', end: '4:00 PM', status: 'confirmed' },
      { id: 2, caregiver: 'Scarlet', start: '4:00 PM', end: '9:00 PM', status: 'confirmed' }
    ],
    tuesday: [
      { id: 3, caregiver: 'Robin', start: '9:00 AM', end: '4:00 PM', status: 'confirmed' },
      { id: 4, caregiver: 'Scarlet', start: '4:00 PM', end: '9:00 PM', status: 'confirmed' }
    ],
    wednesday: [
      { id: 5, caregiver: 'Robin', start: '9:00 AM', end: '4:00 PM', status: 'requested-off', requestBy: 'Robin' },
      { id: 6, caregiver: 'Scarlet', start: '4:00 PM', end: '9:00 PM', status: 'confirmed' }
    ],
    thursday: [
      { id: 7, caregiver: 'Robin', start: '9:00 AM', end: '4:00 PM', status: 'confirmed' },
      { id: 8, caregiver: 'Scarlet', start: '4:00 PM', end: '9:00 PM', status: 'confirmed' }
    ],
    friday: [
      { id: 9, caregiver: 'Robin', start: '9:00 AM', end: '4:00 PM', status: 'confirmed' },
      { id: 10, caregiver: 'Scarlet', start: '4:00 PM', end: '9:00 PM', status: 'confirmed' }
    ],
    saturday: [
      { id: 11, caregiver: 'Kelly', start: '9:00 AM', end: '3:00 PM', status: 'swap-proposed', swapWith: 'Joanne' },
      { id: 12, caregiver: 'Joanne', start: '3:00 PM', end: '9:00 PM', status: 'swap-proposed', swapWith: 'Kelly' }
    ],
    sunday: [
      { id: 13, caregiver: 'Kelly', start: '9:00 AM', end: '3:00 PM', status: 'confirmed' },
      { id: 14, caregiver: 'Joanne', start: '3:00 PM', end: '9:00 PM', status: 'confirmed' }
    ]
  });
  
  // Mock team members data
  const caregivers = [
    { id: 1, name: 'Robin', hours: 35, availability: 'Weekdays', role: 'Day Shift' },
    { id: 2, name: 'Scarlet', hours: 25, availability: 'Weekdays', role: 'Evening Shift' },
    { id: 3, name: 'Kelly', hours: 12, availability: 'Weekends', role: 'Day Shift' },
    { id: 4, name: 'Joanne', hours: 12, availability: 'Weekends', role: 'Evening Shift' },
  ];

  // Helper to format day titles
  const formatDayTitle = (day) => {
    const today = new Date().getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = dayNames.indexOf(day);
    const isToday = today === dayIndex;
    
    // Calculate date for display
    const currentDate = new Date();
    const diff = dayIndex - currentDate.getDay();
    currentDate.setDate(currentDate.getDate() + diff);
    const dateStr = currentDate.getDate();
    
    return (
      <div className={`text-center ${isToday ? 'font-bold bg-blue-100 rounded-t-lg' : ''}`}>
        <div className="text-sm uppercase">{day.slice(0, 3)}</div>
        <div className="text-lg">{dateStr}</div>
      </div>
    );
  };

  const handleShiftClick = (day, shift) => {
    setSelectedDay(day);
    setSelectedShift(shift);
    setModalType('shiftOptions');
    setShowModal(true);
  };

  const handleDropShift = () => {
    // Mock implementation - would trigger Firebase updates
    if (selectedDay && selectedShift) {
      const updatedSchedule = {...schedule};
      const shift = updatedSchedule[selectedDay].find(s => s.id === selectedShift.id);
      if (shift) {
        shift.status = 'dropped';
        shift.droppedBy = shift.caregiver;
        setSchedule(updatedSchedule);
        
        // Create a timestamp for the notification
        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        // Add notification for dropped shift
        setNotifications([
          ...notifications,
          { 
            id: notifications.length + 1, 
            type: 'drop', 
            from: shift.caregiver, 
            date: selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1), 
            time: timeString,
            message: `Dropped shift (${shift.start}-${shift.end}), needs coverage`, 
            status: 'pending' 
          },
          { 
            id: notifications.length + 2, 
            type: 'suggestion', 
            from: 'System', 
            date: selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1), 
            time: timeString,
            message: `Suggested: ${shift.caregiver === 'Robin' || shift.caregiver === 'Scarlet' ? 'Joanne' : 'Scarlet'} is available to cover this shift`, 
            status: 'pending' 
          }
        ]);
      }
    }
    setShowModal(false);
  };

  const handleSwapShift = () => {
    // Mock implementation - would trigger Firebase updates
    if (selectedDay && selectedShift) {
      const updatedSchedule = {...schedule};
      const shift = updatedSchedule[selectedDay].find(s => s.id === selectedShift.id);
      if (shift) {
        // Find who to swap with based on time of day
        const swapWith = shift.caregiver === 'Robin' ? 'Scarlet' : 
                         shift.caregiver === 'Scarlet' ? 'Robin' :
                         shift.caregiver === 'Kelly' ? 'Joanne' : 'Kelly';
                         
        shift.status = 'swap-proposed';
        shift.swapWith = swapWith;
        setSchedule(updatedSchedule);
        
        // Create a timestamp for the notification
        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        // Add notification for swap request - everyone gets notified
        setNotifications([
          ...notifications,
          { 
            id: notifications.length + 1, 
            type: 'swap', 
            from: shift.caregiver, 
            date: selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1), 
            time: timeString,
            message: `Proposed shift swap with ${swapWith}`, 
            status: 'pending' 
          }
        ]);
      }
    }
    setShowModal(false);
  };
  
  const handleAdjustShift = () => {
    // Mock implementation for adjusting shift hours
    if (selectedDay && selectedShift) {
      const updatedSchedule = {...schedule};
      const shift = updatedSchedule[selectedDay].find(s => s.id === selectedShift.id);
      if (shift) {
        // For demonstration, adjust the shift by 1 hour later
        const originalStart = shift.start;
        const originalEnd = shift.end;
        
        // Simple time adjustment logic (would be replaced with a time picker in real app)
        const adjustTime = (timeStr, hoursToAdd) => {
          const isPM = timeStr.includes('PM');
          const timeParts = timeStr.replace(/ [AP]M/, '').split(':');
          let hours = parseInt(timeParts[0]);
          const minutes = timeParts[1];
          
          hours = (hours + hoursToAdd) % 12;
          if (hours === 0) hours = 12;
          
          return `${hours}:${minutes} ${isPM ? 'PM' : 'AM'}`;
        };
        
        shift.start = adjustTime(shift.start, 1);
        shift.end = adjustTime(shift.end, 1);
        shift.status = 'adjusted';
        setSchedule(updatedSchedule);
        
        // Create a timestamp for the notification
        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        // Add notification for adjusted shift
        setNotifications([
          ...notifications,
          { 
            id: notifications.length + 1, 
            type: 'adjust', 
            from: shift.caregiver, 
            date: selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1), 
            time: timeString,
            message: `Changed shift from ${originalStart}-${originalEnd} to ${shift.start}-${shift.end}`, 
            status: 'completed' 
          }
        ]);
      }
    }
    setShowModal(false);
  };

  const approveRequest = (notificationId) => {
    // Would update Firebase in real implementation
    const updatedNotifications = notifications.map(notification => 
      notification.id === notificationId ? {...notification, status: 'completed'} : notification
    );
    setNotifications(updatedNotifications);
    
    // Update the schedule based on notification type
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      const now = new Date();
      const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      if (notification.type === 'drop') {
        // Handle dropped shift confirmation
        Object.keys(schedule).forEach(day => {
          schedule[day].forEach(shift => {
            if (shift.status === 'dropped' && shift.caregiver === notification.from) {
              shift.status = 'confirmed'; // Reset to confirmed but now with new caregiver
              shift.caregiver = 'You'; // For demo, assume you're covering
              
              // Add confirmation to notifications
              const newNotification = {
                id: notifications.length + 1,
                type: 'coverage',
                from: 'You',
                date: notification.date,
                time: timeString,
                message: `Confirmed coverage for ${notification.from}'s shift`,
                status: 'completed'
              };
              updatedNotifications.push(newNotification);
            }
          });
        });
      } else if (notification.type === 'swap') {
        // Handle swap confirmation
        Object.keys(schedule).forEach(day => {
          schedule[day].forEach(shift => {
            if (shift.status === 'swap-proposed' && shift.caregiver === notification.from) {
              // Find the other person's shift to swap with
              const otherShift = schedule[day].find(s => 
                s.caregiver === shift.swapWith
              );
              
              if (otherShift) {
                // Swap the caregivers
                const tempCaregiver = shift.caregiver;
                shift.caregiver = otherShift.caregiver;
                otherShift.caregiver = tempCaregiver;
                
                // Reset statuses
                shift.status = 'confirmed';
                otherShift.status = 'confirmed';
                delete shift.swapWith;
                
                // Add confirmation to notifications
                const newNotification = {
                  id: notifications.length + 1,
                  type: 'swap',
                  from: 'System',
                  date: notification.date,
                  time: timeString,
                  message: `Confirmed shift swap between ${tempCaregiver} and ${shift.caregiver}`,
                  status: 'completed'
                };
                updatedNotifications.push(newNotification);
              }
            }
          });
        });
      } else if (notification.type === 'suggestion') {
        // Handle suggestion application
        // This would have more complex logic in a real app
        const newNotification = {
          id: notifications.length + 1,
          type: 'suggestion',
          from: 'System',
          date: notification.date,
          time: timeString,
          message: `Applied suggested solution: ${notification.message}`,
          status: 'completed'
        };
        updatedNotifications.push(newNotification);
      }
      
      setSchedule({...schedule});
      setNotifications(updatedNotifications);
    }
  };

  // Function to get the appropriate background color based on shift status
  const getShiftStatusColor = (status) => {
    switch(status) {
      case 'confirmed': return 'bg-green-100';
      case 'dropped': return 'bg-red-100';
      case 'adjusted': return 'bg-blue-100';
      case 'swap-proposed': return 'bg-purple-100';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* App Header */}
      <div className="bg-blue-700 text-white p-4 shadow-md">
        <h1 className="text-xl font-semibold">Care Team Scheduler</h1>
        <div className="flex justify-between items-center">
          <button className="text-sm bg-blue-600 px-3 py-1 rounded-full">
            &larr; Previous Week
          </button>
          <div className="text-center">
            <p className="text-sm opacity-80">Week of March 24-30, 2025</p>
            <div className="flex justify-center mt-1 text-xs space-x-2">
              <button className="bg-blue-600 px-2 py-1 rounded">Today</button>
              <button className="bg-blue-600 px-2 py-1 rounded">Payroll</button>
            </div>
          </div>
          <button className="text-sm bg-blue-600 px-3 py-1 rounded-full">
            Next Week &rarr;
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'schedule' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Schedule Header */}
            <div className="grid grid-cols-7 border-b">
              {Object.keys(schedule).map((day) => (
                <div key={day} className="p-2 border-r last:border-r-0">
                  {formatDayTitle(day)}
                </div>
              ))}
            </div>
            
            {/* Schedule Grid */}
            <div className="grid grid-cols-7 text-sm">
              {Object.entries(schedule).map(([day, shifts]) => (
                <div key={day} className="border-r last:border-r-0 min-h-64">
                  {shifts.map((shift) => (
                    <div 
                      key={shift.id}
                      className={`p-3 border-b cursor-pointer ${getShiftStatusColor(shift.status)}`}
                      onClick={() => handleShiftClick(day, shift)}
                    >
                      <div className="font-medium">{shift.caregiver}</div>
                      <div className="text-xs text-gray-600">{shift.start} - {shift.end}</div>
                      {shift.status === 'requested-off' && (
                        <div className="mt-1 text-xs flex items-center text-amber-700">
                          <AlertTriangle size={12} className="mr-1" />
                          Time off requested
                        </div>
                      )}
                      {shift.status === 'swap-proposed' && (
                        <div className="mt-1 text-xs flex items-center text-purple-700">
                          <Clock size={12} className="mr-1" />
                          Swap with {shift.swapWith}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white rounded-lg shadow">
            <div className="flex border-b">
              <button 
                onClick={() => setModalType('active')}
                className={`py-3 px-4 font-medium ${modalType !== 'history' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              >
                Active Notifications
              </button>
              <button 
                onClick={() => setModalType('history')}
                className={`py-3 px-4 font-medium ${modalType === 'history' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              >
                History
              </button>
            </div>
            <div className="divide-y">
              {notifications
                .filter(n => modalType === 'history' ? n.status === 'completed' : n.status === 'pending')
                .sort((a, b) => {
                  // Sort by date first (newest first)
                  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
                  // Then by time if available (newest first)
                  if (a.time && b.time) return a.time < b.time ? 1 : -1;
                  // Fall back to id (newest first)
                  return b.id - a.id;
                })
                .map((notification) => (
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
                          onClick={() => approveRequest(notification.id)}
                          className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                        >
                          Confirm
                        </button>
                      </div>
                    )}
                    {notification.status === 'pending' && notification.type === 'suggestion' && (
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => approveRequest(notification.id)}
                          className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                        >
                          Apply
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {notifications.filter(n => modalType === 'history' ? n.status === 'completed' : n.status === 'pending').length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  {modalType === 'history' ? 'No history available' : 'No active notifications'}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="bg-white rounded-lg shadow">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-medium">Care Team</h2>
              <button 
                onClick={() => setShowModal(true) && setModalType('addTeamMember')}
                className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm"
              >
                Add Member
              </button>
            </div>
            <div className="divide-y">
              {caregivers.map((caregiver) => (
                <div key={caregiver.id} className="p-4 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{caregiver.name}</div>
                    <div className="text-sm text-gray-600">{caregiver.role} • {caregiver.availability}</div>
                  </div>
                  <div className="flex items-center">
                    <div className="text-right mr-4">
                      <div className="font-medium">{caregiver.hours} hrs/week</div>
                      <div className="text-sm text-gray-600">
                        {caregiver.hours > 30 ? 'Full Time' : 'Part Time'}
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setShowModal(true);
                        setModalType('editTeamMember');
                        // In a real app, we'd set the selected team member here
                      }}
                      className="text-blue-600 px-2 py-2 rounded"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t flex justify-around p-2">
        <button 
          onClick={() => setActiveTab('schedule')} 
          className={`flex flex-col items-center p-2 ${activeTab === 'schedule' ? 'text-blue-600' : 'text-gray-600'}`}
        >
          <Calendar size={24} />
          <span className="text-xs mt-1">Schedule</span>
        </button>
        <button 
          onClick={() => {
            setActiveTab('notifications');
            setModalType('active'); // Default to active notifications
          }} 
          className={`flex flex-col items-center p-2 relative ${activeTab === 'notifications' ? 'text-blue-600' : 'text-gray-600'}`}
        >
          <MessageSquare size={24} />
          {notifications.filter(n => n.status === 'pending').length > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {notifications.filter(n => n.status === 'pending').length}
            </span>
          )}
          <span className="text-xs mt-1">Updates</span>
        </button>
        <button 
          onClick={() => setActiveTab('team')} 
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

      {/* Modal for Shift Options */}
      {showModal && modalType === 'shiftOptions' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-4">
            <h3 className="text-lg font-medium mb-4">Shift Options</h3>
            <div className="mb-4">
              <div className="font-medium">{selectedShift?.caregiver}'s Shift</div>
              <div className="text-sm text-gray-600">
                {selectedDay?.charAt(0).toUpperCase() + selectedDay?.slice(1)}, {selectedShift?.start} - {selectedShift?.end}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleDropShift}
                className="bg-red-100 border border-red-300 rounded-lg p-3 text-center"
              >
                <div className="font-medium text-red-800">Drop Shift</div>
                <div className="text-xs text-red-700 mt-1">Need coverage</div>
              </button>
              <button 
                onClick={handleSwapShift}
                className="bg-purple-100 border border-purple-300 rounded-lg p-3 text-center"
              >
                <div className="font-medium text-purple-800">Swap Shift</div>
                <div className="text-xs text-purple-700 mt-1">With team member</div>
              </button>
              <button 
                onClick={handleAdjustShift}
                className="bg-blue-100 border border-blue-300 rounded-lg p-3 text-center col-span-2"
              >
                <div className="font-medium text-blue-800">Adjust Shift Hours</div>
                <div className="text-xs text-blue-700 mt-1">Change start/end times</div>
              </button>
            </div>
            <div className="mt-4 text-right">
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-600 px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal for Team Member Edit */}
      {showModal && modalType === 'editTeamMember' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-4">
            <h3 className="text-lg font-medium mb-4">Edit Team Member</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" className="w-full p-2 border rounded" defaultValue="Robin" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select className="w-full p-2 border rounded">
                  <option>Day Shift</option>
                  <option>Evening Shift</option>
                  <option>Weekend Shift</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                <select className="w-full p-2 border rounded">
                  <option>Weekdays</option>
                  <option>Weekends</option>
                  <option>All days</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hours per week</label>
                <input type="number" className="w-full p-2 border rounded" defaultValue={35} />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-600 px-4 py-2"
              >
                Cancel
              </button>
              <button 
                onClick={() => setShowModal(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal for Add Team Member */}
      {showModal && modalType === 'addTeamMember' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-4">
            <h3 className="text-lg font-medium mb-4">Add New Team Member</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" className="w-full p-2 border rounded" placeholder="Enter name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select className="w-full p-2 border rounded">
                  <option>Day Shift</option>
                  <option>Evening Shift</option>
                  <option>Weekend Shift</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                <select className="w-full p-2 border rounded">
                  <option>Weekdays</option>
                  <option>Weekends</option>
                  <option>All days</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hours per week</label>
                <input type="number" className="w-full p-2 border rounded" placeholder="Enter hours" />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-600 px-4 py-2"
              >
                Cancel
              </button>
              <button 
                onClick={() => setShowModal(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareScheduler;