const lowdbUtil = require('../utils/lowdbUtil');
const io = require('../utils/socket');
const logger = require('../utils/logger');
const { recordHistory } = require('../utils/history');

// GET all weeks
exports.getAllWeeks = async (req, res) => {
  try {
    let weeks = lowdbUtil.getAll('weeks');
    // Sort by start_date descending
    weeks = weeks.sort((a, b) => b.start_date.localeCompare(a.start_date));
    res.status(200).json(weeks);
  } catch (error) {
    logger.error('Error fetching weeks:', error);
    res.status(500).json({ error: 'Failed to fetch weeks' });
  }
};

// GET a specific week by ID
exports.getWeekById = async (req, res) => {
  try {
    const { id } = req.params;
    const week = lowdbUtil.findById('weeks', id);
    if (!week) {
      return res.status(404).json({ error: 'Week not found' });
    }
    res.status(200).json(week);
  } catch (error) {
    logger.error(`Error fetching week with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch week' });
  }
};

// GET current week
exports.getCurrentWeek = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let weeks = lowdbUtil.getAll('weeks');
    const currentWeek = weeks.find(w => w.start_date <= today && w.end_date >= today);
    if (!currentWeek) {
      // Fallback: most recent week
      weeks = weeks.sort((a, b) => b.start_date.localeCompare(a.start_date));
      const mostRecentWeek = weeks[0];
      if (mostRecentWeek) {
        return res.status(200).json(mostRecentWeek);
      }
      return res.status(404).json({ error: 'No current week found' });
    }
    res.status(200).json(currentWeek);
  } catch (error) {
    logger.error('Error fetching current week', error);
    res.status(500).json({ error: 'Failed to fetch current week' });
  }
};

// POST create a new week
exports.createWeek = async (req, res) => {
  try {
    const { start_date, end_date, is_published, notes } = req.body;
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    const newWeek = lowdbUtil.insert('weeks', {
      start_date,
      end_date,
      is_published: is_published || false,
      notes: notes || ''
    });
    res.status(201).json(newWeek);
  } catch (error) {
    logger.error('Error creating week:', error);
    res.status(500).json({ error: 'Failed to create week' });
  }
};

// PUT update a week
exports.updateWeek = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date, is_published, notes } = req.body;
    const updateData = {};
    if (start_date) updateData.start_date = start_date;
    if (end_date) updateData.end_date = end_date;
    if (is_published !== undefined) updateData.is_published = is_published;
    if (notes !== undefined) updateData.notes = notes;
    const updatedWeek = lowdbUtil.update('weeks', id, updateData);
    if (!updatedWeek) {
      return res.status(404).json({ error: 'Week not found' });
    }
    res.status(200).json(updatedWeek);
  } catch (error) {
    logger.error(`Error updating week with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update week' });
  }
};

// GET all shifts for a week
exports.getShiftsByWeek = async (req, res) => {
  try {
    const { weekId } = req.params;
    const week = lowdbUtil.findById('weeks', weekId);
    if (!week) {
      return res.status(404).json({ error: 'Week not found' });
    }
    // Get all shifts for the week
    let shifts = lowdbUtil.find('shifts', { week_id: weekId });
    // Attach caregiver info manually
    const caregivers = lowdbUtil.getAll('team_members');
    shifts = shifts.map(shift => {
      const caregiver = caregivers.find(c => c.id === shift.caregiver_id);
      return {
        ...shift,
        caregiver_id: caregiver ? caregiver.id : null,
        caregiver_name: caregiver ? caregiver.name : '',
        caregiver_role: caregiver ? caregiver.role : '',
        caregiver_is_active: caregiver ? caregiver.is_active : false
      };
    });
    res.status(200).json(shifts);
  } catch (error) {
    logger.error(`Error fetching shifts for week ${req.params.weekId}:`, error);
    res.status(500).json({ error: 'Failed to fetch shifts' });
  }
};

// GET a specific shift
exports.getShiftById = async (req, res) => {
  try {
    const { id } = req.params;
    const shift = lowdbUtil.findById('shifts', id);
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    const caregiver = lowdbUtil.findById('team_members', shift.caregiver_id);
    res.status(200).json({
      ...shift,
      caregiver_id: caregiver ? caregiver.id : null,
      caregiver_name: caregiver ? caregiver.name : '',
      caregiver_role: caregiver ? caregiver.role : '',
      caregiver_is_active: caregiver ? caregiver.is_active : false
    });
  } catch (error) {
    logger.error(`Error fetching shift with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch shift' });
  }
};

// POST create a new shift (basic, no recurring logic yet)
exports.createShift = async (req, res) => {
  try {
    const { week_id, day_of_week, caregiver_id, start_time, end_time, status, is_recurring, recurring_end_date, parent_shift_id } = req.body;
    if (!week_id || !day_of_week || !caregiver_id || !start_time || !end_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (is_recurring && (!recurring_end_date || new Date(recurring_end_date) <= new Date())) {
      return res.status(400).json({ error: 'A valid recurring_end_date is required for recurring shifts' });
    }
    const caregiver = lowdbUtil.findById('team_members', caregiver_id);
    if (!caregiver) {
      return res.status(400).json({ error: 'Invalid caregiver ID' });
    }
    if (!caregiver.is_active) {
      return res.status(400).json({ error: 'Cannot assign shifts to inactive team members' });
    }
    // Insert the shift
    const newShift = lowdbUtil.insert('shifts', {
      week_id,
      day_of_week,
      caregiver_id,
      start_time,
      end_time,
      status: status || 'confirmed',
      is_recurring: !!is_recurring,
      recurring_end_date: is_recurring ? recurring_end_date : null,
      parent_shift_id: parent_shift_id || null
    });
    // TODO: Add recurring logic here (future enhancement)
    await recordHistory('create', 'shift', newShift.id, `Created shift for ${caregiver.name} on ${day_of_week} (${start_time}-${end_time})`, {
      details: { day_of_week, start_time, end_time, status: status || 'confirmed', is_recurring: !!is_recurring, recurring_end_date }
    });
    res.status(201).json({
      ...newShift,
      caregiver_id: caregiver.id,
      caregiver_name: caregiver.name,
      caregiver_role: caregiver.role,
      caregiver_is_active: caregiver.is_active
    });
  } catch (error) {
    logger.error('Error creating shift:', error);
    res.status(500).json({ error: 'Failed to create shift' });
  }
};

// PUT update a shift
exports.updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { day_of_week, caregiver_id, start_time, end_time, status } = req.body;
    const updateData = {};
    if (day_of_week) updateData.day_of_week = day_of_week;
    if (start_time) updateData.start_time = start_time;
    if (end_time) updateData.end_time = end_time;
    if (status) updateData.status = status;
    if (caregiver_id) {
      const newCaregiver = lowdbUtil.findById('team_members', caregiver_id);
      if (!newCaregiver) {
        return res.status(400).json({ error: 'Invalid caregiver ID' });
      }
      if (!newCaregiver.is_active) {
        return res.status(400).json({ error: 'Cannot assign shifts to inactive team members' });
      }
      updateData.caregiver_id = caregiver_id;
    }
    const updatedShift = lowdbUtil.update('shifts', id, updateData);
    if (!updatedShift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    const caregiver = lowdbUtil.findById('team_members', updatedShift.caregiver_id);
    res.status(200).json({
      ...updatedShift,
      caregiver_id: caregiver ? caregiver.id : null,
      caregiver_name: caregiver ? caregiver.name : '',
      caregiver_role: caregiver ? caregiver.role : '',
      caregiver_is_active: caregiver ? caregiver.is_active : false
    });
  } catch (error) {
    logger.error(`Error updating shift with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update shift' });
  }
};

// DELETE a shift (basic, no recurring logic yet)
exports.deleteShift = async (req, res) => {
  try {
    const { id } = req.params;
    const shift = lowdbUtil.findById('shifts', id);
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    lowdbUtil.remove('shifts', id);
    // Remove related notifications
    lowdbUtil.removeWhere('notifications', { affected_shift_id: id });
    await recordHistory('delete', 'shift', id, `Deleted shift for caregiver_id ${shift.caregiver_id} on ${shift.day_of_week}`);
    res.status(200).json({ message: 'Shift deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting shift with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete shift' });
  }
};

// POST drop a shift
exports.dropShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const shift = lowdbUtil.findById('shifts', id);
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    lowdbUtil.update('shifts', id, { status: 'dropped' });
    // Create notification
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    lowdbUtil.insert('notifications', {
      type: 'drop',
      from_caregiver_id: shift.caregiver_id,
      affected_shift_id: shift.id,
      week_id: shift.week_id,
      message: `Dropped shift (${shift.start_time}-${shift.end_time})${reason ? `: ${reason}` : ', needs coverage'}`,
      date: dateStr,
      time: timeStr,
      status: 'pending'
    });
    const updatedShift = lowdbUtil.findById('shifts', id);
    const caregiver = lowdbUtil.findById('team_members', updatedShift.caregiver_id);
    res.status(200).json({
      ...updatedShift,
      caregiver_id: caregiver ? caregiver.id : null,
      caregiver_name: caregiver ? caregiver.name : '',
      caregiver_role: caregiver ? caregiver.role : '',
      caregiver_is_active: caregiver ? caregiver.is_active : false
    });
  } catch (error) {
    logger.error(`Error dropping shift with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to drop shift' });
  }
};

// POST swap shifts
exports.swapShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { swap_with_id } = req.body;
    if (!swap_with_id) {
      return res.status(400).json({ error: 'swap_with_id is required' });
    }
    const shiftA = lowdbUtil.findById('shifts', id);
    const shiftB = lowdbUtil.findById('shifts', swap_with_id);
    if (!shiftA || !shiftB) {
      return res.status(404).json({ error: 'One or both shifts not found' });
    }
    // Swap caregivers
    const tempCaregiverId = shiftA.caregiver_id;
    lowdbUtil.update('shifts', shiftA.id, {
      caregiver_id: shiftB.caregiver_id,
      status: 'confirmed'
    });
    lowdbUtil.update('shifts', shiftB.id, {
      caregiver_id: tempCaregiverId,
      status: 'confirmed'
    });
    // Create notifications for both shifts
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    lowdbUtil.insert('notifications', {
      type: 'swap',
      from_caregiver_id: shiftA.caregiver_id,
      affected_shift_id: shiftA.id,
      week_id: shiftA.week_id,
      message: `Swapped shift with caregiver ${shiftB.caregiver_id}`,
      date: dateStr,
      time: timeStr,
      status: 'completed'
    });
    lowdbUtil.insert('notifications', {
      type: 'swap',
      from_caregiver_id: shiftB.caregiver_id,
      affected_shift_id: shiftB.id,
      week_id: shiftB.week_id,
      message: `Swapped shift with caregiver ${shiftA.caregiver_id}`,
      date: dateStr,
      time: timeStr,
      status: 'completed'
    });
    await recordHistory('swap', 'shift', id, `Swapped shift ${id} with shift ${swap_with_id}`);
    // Return updated shifts
    const updatedA = lowdbUtil.findById('shifts', id);
    const updatedB = lowdbUtil.findById('shifts', swap_with_id);
    res.status(200).json({ original_shift: updatedA, swap_with_shift: updatedB });
  } catch (error) {
    logger.error(`Error swapping shifts:`, error);
    res.status(500).json({ error: 'Failed to swap shifts' });
  }
};

// POST adjust shift hours
exports.adjustShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_start_time, new_end_time, reason } = req.body;
    if (!new_start_time && !new_end_time) {
      return res.status(400).json({ error: 'At least one of new_start_time or new_end_time is required' });
    }
    const shift = lowdbUtil.findById('shifts', id);
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    const updateData = { status: 'adjusted' };
    if (new_start_time) updateData.start_time = new_start_time;
    if (new_end_time) updateData.end_time = new_end_time;
    const updatedShift = lowdbUtil.update('shifts', id, updateData);
    // Create notification
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    lowdbUtil.insert('notifications', {
      type: 'adjust',
      from_caregiver_id: shift.caregiver_id,
      affected_shift_id: shift.id,
      week_id: shift.week_id,
      message: `Adjusted shift to ${updateData.start_time || shift.start_time}-${updateData.end_time || shift.end_time}${reason ? ': ' + reason : ''}`,
      date: dateStr,
      time: timeStr,
      status: 'completed'
    });
    await recordHistory('adjust', 'shift', id, `Adjusted shift ${id}`);
    const caregiver = lowdbUtil.findById('team_members', updatedShift.caregiver_id);
    res.status(200).json({
      ...updatedShift,
      caregiver_id: caregiver ? caregiver.id : null,
      caregiver_name: caregiver ? caregiver.name : '',
      caregiver_role: caregiver ? caregiver.role : '',
      caregiver_is_active: caregiver ? caregiver.is_active : false
    });
  } catch (error) {
    logger.error(`Error adjusting shift with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to adjust shift' });
  }
};
