const db = require('../utils/db');

// GET all notifications
exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await db('notifications')
      .join('team_members', 'notifications.from_caregiver_id', 'team_members.id')
      .leftJoin('shifts', 'notifications.affected_shift_id', 'shifts.id')
      .select(
        'notifications.*',
        'team_members.name as from_name',
        'shifts.day_of_week',
        'shifts.start_time',
        'shifts.end_time'
      )
      .orderBy('notifications.created_at', 'desc');
    
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
    
    const notifications = await db('notifications')
      .join('team_members', 'notifications.from_caregiver_id', 'team_members.id')
      .leftJoin('shifts', 'notifications.affected_shift_id', 'shifts.id')
      .select(
        'notifications.*',
        'team_members.name as from_name',
        'shifts.day_of_week',
        'shifts.start_time',
        'shifts.end_time'
      )
      .where('notifications.status', status)
      .orderBy('notifications.created_at', 'desc');
    
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
    
    const notification = await db('notifications')
      .join('team_members', 'notifications.from_caregiver_id', 'team_members.id')
      .leftJoin('shifts', 'notifications.affected_shift_id', 'shifts.id')
      .select(
        'notifications.*',
        'team_members.name as from_name',
        'shifts.day_of_week',
        'shifts.start_time',
        'shifts.end_time'
      )
      .where('notifications.id', id)
      .first();
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.status(200).json(notification);
  } catch (error) {
    console.error(`Error fetching notification with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch notification' });
  }
};

// POST create a new notification
exports.createNotification = async (req, res) => {
  try {
    const { type, from_caregiver_id, affected_shift_id, week_id, message } = req.body;
    
    // Basic validation
    if (!type || !from_caregiver_id || !week_id || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create date and time strings
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    const [id] = await db('notifications')
      .insert({
        type,
        from_caregiver_id,
        affected_shift_id,
        week_id,
        message,
        date: dateStr,
        time: timeStr,
        status: 'pending'
      })
      .returning('id');
    
    const newNotification = await db('notifications')
      .join('team_members', 'notifications.from_caregiver_id', 'team_members.id')
      .leftJoin('shifts', 'notifications.affected_shift_id', 'shifts.id')
      .select(
        'notifications.*',
        'team_members.name as from_name',
        'shifts.day_of_week',
        'shifts.start_time',
        'shifts.end_time'
      )
      .where('notifications.id', id)
      .first();
    
    res.status(201).json(newNotification);
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
    
    // Build update object with only provided fields
    const updateData = {};
    if (message) updateData.message = message;
    if (status && ['pending', 'completed'].includes(status)) updateData.status = status;
    
    const updated = await db('notifications')
      .where({ id })
      .update(updateData);
    
    if (updated === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    const updatedNotification = await db('notifications')
      .join('team_members', 'notifications.from_caregiver_id', 'team_members.id')
      .leftJoin('shifts', 'notifications.affected_shift_id', 'shifts.id')
      .select(
        'notifications.*',
        'team_members.name as from_name',
        'shifts.day_of_week',
        'shifts.start_time',
        'shifts.end_time'
      )
      .where('notifications.id', id)
      .first();
    
    res.status(200).json(updatedNotification);
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
    
    // Get the notification to approve
    const notification = await db('notifications')
      .where({ id })
      .first();
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    if (notification.status === 'completed') {
      return res.status(400).json({ error: 'Notification is already completed' });
    }
    
    // Handle different notification types
    switch (notification.type) {
      case 'drop':
        // For a drop notification, we'll handle the coverage
        if (notification.affected_shift_id) {
          await db('shifts')
            .where({ id: notification.affected_shift_id })
            .update({
              caregiver_id: action_by_caregiver_id || 1, // Default to ID 1 if none provided
              status: 'confirmed'
            });
        }
        break;
        
      case 'swap':
        // For a swap notification, we'll swap the caregivers
        if (notification.affected_shift_id) {
          const shift = await db('shifts')
            .where({ id: notification.affected_shift_id })
            .first();
          
          if (shift && shift.status === 'swap-proposed') {
            // Find the other shift with swap-proposed status
            const otherShift = await db('shifts')
              .where({
                week_id: shift.week_id,
                day_of_week: shift.day_of_week,
                status: 'swap-proposed'
              })
              .whereNot({ id: shift.id })
              .first();
            
            if (otherShift) {
              // Swap the caregivers
              const tempCaregiverId = shift.caregiver_id;
              
              await db('shifts')
                .where({ id: shift.id })
                .update({
                  caregiver_id: otherShift.caregiver_id,
                  status: 'confirmed'
                });
                
              await db('shifts')
                .where({ id: otherShift.id })
                .update({
                  caregiver_id: tempCaregiverId,
                  status: 'confirmed'
                });
            }
          }
        }
        break;
        
      // Other types like adjust don't need special handling
    }
    
    // Mark the notification as completed
    await db('notifications')
      .where({ id })
      .update({ status: 'completed' });
    
    // Create a confirmation notification
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    const message = 
      notification.type === 'drop' ? `Confirmed coverage for ${notification.from_caregiver_id}'s shift` :
      notification.type === 'swap' ? 'Confirmed shift swap' :
      notification.type === 'suggestion' ? `Applied suggested solution: ${notification.message}` :
      'Request approved';
    
    const [confirmationId] = await db('notifications')
      .insert({
        type: notification.type,
        from_caregiver_id: action_by_caregiver_id || 1, // Default to ID 1 if none provided
        affected_shift_id: notification.affected_shift_id,
        week_id: notification.week_id,
        message,
        date: dateStr,
        time: timeStr,
        status: 'completed'
      })
      .returning('id');
    
    const updatedNotification = await db('notifications')
      .join('team_members', 'notifications.from_caregiver_id', 'team_members.id')
      .leftJoin('shifts', 'notifications.affected_shift_id', 'shifts.id')
      .select(
        'notifications.*',
        'team_members.name as from_name',
        'shifts.day_of_week',
        'shifts.start_time',
        'shifts.end_time'
      )
      .where('notifications.id', id)
      .first();
    
    const confirmationNotification = await db('notifications')
      .join('team_members', 'notifications.from_caregiver_id', 'team_members.id')
      .leftJoin('shifts', 'notifications.affected_shift_id', 'shifts.id')
      .select(
        'notifications.*',
        'team_members.name as from_name',
        'shifts.day_of_week',
        'shifts.start_time',
        'shifts.end_time'
      )
      .where('notifications.id', confirmationId)
      .first();
    
    res.status(200).json({
      original: updatedNotification,
      confirmation: confirmationNotification
    });
  } catch (error) {
    console.error(`Error approving notification with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to approve notification' });
  }
};