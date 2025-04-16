const lowdbUtil = require('../utils/lowdbUtil');

// Helper to merge notification with caregiver and shift info
function enrichNotification(notification) {
  const caregiver = lowdbUtil.findById('team_members', notification.from_caregiver_id);
  const shift = notification.affected_shift_id ? lowdbUtil.findById('shifts', notification.affected_shift_id) : null;
  return {
    ...notification,
    from_name: caregiver ? caregiver.name : undefined,
    day_of_week: shift ? shift.day_of_week : undefined,
    start_time: shift ? shift.start_time : undefined,
    end_time: shift ? shift.end_time : undefined
  };
}

// GET all notifications
exports.getAllNotifications = async (req, res) => {
  try {
    let notifications = lowdbUtil.getAll('notifications');
    notifications = notifications.map(enrichNotification);
    // Sort by created_at/date/time descending if available
    notifications = notifications.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// GET notifications by status
exports.getNotificationsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    if (!['pending', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be "pending" or "completed"' });
    }
    let notifications = lowdbUtil.find('notifications', { status });
    notifications = notifications.map(enrichNotification);
    notifications = notifications.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    res.status(200).json(notifications);
  } catch (error) {
    console.error(`Error fetching notifications with status ${req.params.status}:`, error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// GET a specific notification
exports.getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = lowdbUtil.findById('notifications', id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.status(200).json(enrichNotification(notification));
  } catch (error) {
    console.error(`Error fetching notification with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch notification' });
  }
};

// POST create a new notification
exports.createNotification = async (req, res) => {
  try {
    const { type, from_caregiver_id, affected_shift_id, week_id, message } = req.body;
    if (!type || !from_caregiver_id || !week_id || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const newNotification = lowdbUtil.insert('notifications', {
      type,
      from_caregiver_id,
      affected_shift_id,
      week_id,
      message,
      date: dateStr,
      time: timeStr,
      status: 'pending'
    });
    res.status(201).json(enrichNotification(newNotification));
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
};

// PUT update a notification
exports.updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, status } = req.body;
    const updateData = {};
    if (message) updateData.message = message;
    if (status && ['pending', 'completed'].includes(status)) updateData.status = status;
    const updatedNotification = lowdbUtil.update('notifications', id, updateData);
    if (!updatedNotification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.status(200).json(enrichNotification(updatedNotification));
  } catch (error) {
    console.error(`Error updating notification with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

// PUT approve a notification
exports.approveNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { action_by_caregiver_id } = req.body;
    const notification = lowdbUtil.findById('notifications', id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    if (notification.status === 'completed') {
      return res.status(400).json({ error: 'Notification is already completed' });
    }
    // Handle different notification types
    if (notification.type === 'drop' && notification.affected_shift_id) {
      lowdbUtil.update('shifts', notification.affected_shift_id, {
        caregiver_id: action_by_caregiver_id || 1,
        status: 'confirmed'
      });
    } else if (notification.type === 'swap' && notification.affected_shift_id) {
      const shift = lowdbUtil.findById('shifts', notification.affected_shift_id);
      if (shift && shift.status === 'swap-proposed') {
        // Find the other shift with swap-proposed status
        const allShifts = lowdbUtil.getAll('shifts');
        const otherShift = allShifts.find(s => s.week_id === shift.week_id && s.day_of_week === shift.day_of_week && s.status === 'swap-proposed' && s.id !== shift.id);
        if (otherShift) {
          const tempCaregiverId = shift.caregiver_id;
          lowdbUtil.update('shifts', shift.id, {
            caregiver_id: otherShift.caregiver_id,
            status: 'confirmed'
          });
          lowdbUtil.update('shifts', otherShift.id, {
            caregiver_id: tempCaregiverId,
            status: 'confirmed'
          });
        }
      }
    }
    // Mark the notification as completed
    lowdbUtil.update('notifications', id, { status: 'completed' });
    // Create a confirmation notification
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const message =
      notification.type === 'drop' ? `Confirmed coverage for ${notification.from_caregiver_id}'s shift` :
      notification.type === 'swap' ? 'Confirmed shift swap' :
      notification.type === 'suggestion' ? `Applied suggested solution: ${notification.message}` :
      'Request approved';
    const confirmationNotification = lowdbUtil.insert('notifications', {
      type: notification.type,
      from_caregiver_id: action_by_caregiver_id || 1,
      affected_shift_id: notification.affected_shift_id,
      week_id: notification.week_id,
      message,
      date: dateStr,
      time: timeStr,
      status: 'completed'
    });
    res.status(200).json({
      original: enrichNotification(lowdbUtil.findById('notifications', id)),
      confirmation: enrichNotification(confirmationNotification)
    });
  } catch (error) {
    console.error(`Error approving notification with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to approve notification' });
  }
};