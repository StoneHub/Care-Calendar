const db = require('../utils/db');
const io = require('../utils/socket');
const logger = require('../utils/logger');

// GET all weeks
exports.getAllWeeks = async (req, res) => {
  try {
    const weeks = await db('weeks')
      .select('*')
      .orderBy('start_date', 'desc');
    
    res.status(200).json(weeks);
  } catch (error) {
    console.error('Error fetching weeks:', error);
    res.status(500).json({ error: 'Failed to fetch weeks' });
  }
};

// GET a specific week by ID
exports.getWeekById = async (req, res) => {
  try {
    const { id } = req.params;
    const week = await db('weeks')
      .where({ id })
      .first();
    
    if (!week) {
      return res.status(404).json({ error: 'Week not found' });
    }
    
    res.status(200).json(week);
  } catch (error) {
    console.error(`Error fetching week with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch week' });
  }
};

// GET current week
exports.getCurrentWeek = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    logger.debug('Looking for current week', { today });
    
    const currentWeek = await db('weeks')
      .where('start_date', '<=', today)
      .where('end_date', '>=', today)
      .first();
    
    if (!currentWeek) {
      logger.warn('No current week found', { today });
      
      // Try to get the most recent week as a fallback
      const mostRecentWeek = await db('weeks')
        .orderBy('start_date', 'desc')
        .first();
      
      if (mostRecentWeek) {
        logger.info('Returning most recent week as fallback', { 
          week_id: mostRecentWeek.id,
          start_date: mostRecentWeek.start_date
        });
        return res.status(200).json(mostRecentWeek);
      }
      
      return res.status(404).json({ error: 'No current week found' });
    }
    
    logger.info('Current week found', { 
      week_id: currentWeek.id,
      start_date: currentWeek.start_date,
      end_date: currentWeek.end_date 
    });
    
    res.status(200).json(currentWeek);
  } catch (error) {
    logger.error('Error fetching current week', { 
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Failed to fetch current week' });
  }
};

// POST create a new week
exports.createWeek = async (req, res) => {
  try {
    const { start_date, end_date, is_published, notes } = req.body;
    
    // Basic validation
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    
    const [id] = await db('weeks')
      .insert({
        start_date,
        end_date,
        is_published: is_published || false,
        notes: notes || ''
      })
      .returning('id');
    
    const newWeek = await db('weeks')
      .where({ id })
      .first();
    
    res.status(201).json(newWeek);
  } catch (error) {
    console.error('Error creating week:', error);
    res.status(500).json({ error: 'Failed to create week' });
  }
};

// PUT update a week
exports.updateWeek = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date, is_published, notes } = req.body;
    
    // Build update object with only provided fields
    const updateData = {};
    if (start_date) updateData.start_date = start_date;
    if (end_date) updateData.end_date = end_date;
    if (is_published !== undefined) updateData.is_published = is_published;
    if (notes !== undefined) updateData.notes = notes;
    
    const updated = await db('weeks')
      .where({ id })
      .update(updateData);
    
    if (updated === 0) {
      return res.status(404).json({ error: 'Week not found' });
    }
    
    const updatedWeek = await db('weeks')
      .where({ id })
      .first();
    
    res.status(200).json(updatedWeek);
  } catch (error) {
    console.error(`Error updating week with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update week' });
  }
};

// GET all shifts for a week
exports.getShiftsByWeek = async (req, res) => {
  try {
    const { weekId } = req.params;
    
    // Verify the week exists
    const week = await db('weeks')
      .where({ id: weekId })
      .first();
    
    if (!week) {
      return res.status(404).json({ error: 'Week not found' });
    }
    
    // Get all shifts for the week with caregiver info
    const shifts = await db('shifts')
      .join('team_members', 'shifts.caregiver_id', 'team_members.id')
      .select(
        'shifts.id',
        'shifts.day_of_week',
        'shifts.start_time',
        'shifts.end_time',
        'shifts.status',
        'shifts.week_id',
        'team_members.id as caregiver_id',
        'team_members.name as caregiver_name',
        'team_members.role as caregiver_role'
      )
      .where('shifts.week_id', weekId)
      .orderBy(['shifts.day_of_week', 'shifts.start_time']);
    
    // Group shifts by day
    const shiftsByDay = shifts.reduce((acc, shift) => {
      const day = shift.day_of_week;
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(shift);
      return acc;
    }, {});
    
    // Log what we're sending back to client
    logger.debug('Returning shifts for week', {
      weekId,
      totalShifts: shifts.length,
      format: 'grouped by day',
      data: shiftsByDay
    });
    
    // Return the shifts as a flat array instead of grouped by day
    res.status(200).json(shifts);
  } catch (error) {
    console.error(`Error fetching shifts for week ${req.params.weekId}:`, error);
    res.status(500).json({ error: 'Failed to fetch shifts' });
  }
};

// GET a specific shift
exports.getShiftById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const shift = await db('shifts')
      .join('team_members', 'shifts.caregiver_id', 'team_members.id')
      .select(
        'shifts.id',
        'shifts.day_of_week',
        'shifts.start_time',
        'shifts.end_time',
        'shifts.status',
        'shifts.week_id',
        'team_members.id as caregiver_id',
        'team_members.name as caregiver_name',
        'team_members.role as caregiver_role'
      )
      .where('shifts.id', id)
      .first();
    
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    
    res.status(200).json(shift);
  } catch (error) {
    console.error(`Error fetching shift with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch shift' });
  }
};

// POST create a new shift
exports.createShift = async (req, res) => {
  try {
    const { week_id, day_of_week, caregiver_id, start_time, end_time, status } = req.body;
    
    // Basic validation
    if (!week_id || !day_of_week || !caregiver_id || !start_time || !end_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const [id] = await db('shifts')
      .insert({
        week_id,
        day_of_week,
        caregiver_id,
        start_time,
        end_time,
        status: status || 'confirmed'
      })
      .returning('id');
    
    const newShift = await db('shifts')
      .join('team_members', 'shifts.caregiver_id', 'team_members.id')
      .select(
        'shifts.id',
        'shifts.day_of_week',
        'shifts.start_time',
        'shifts.end_time',
        'shifts.status',
        'shifts.week_id',
        'team_members.id as caregiver_id',
        'team_members.name as caregiver_name',
        'team_members.role as caregiver_role'
      )
      .where('shifts.id', id)
      .first();
    
    res.status(201).json(newShift);
  } catch (error) {
    console.error('Error creating shift:', error);
    res.status(500).json({ error: 'Failed to create shift' });
  }
};

// PUT update a shift
exports.updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { day_of_week, caregiver_id, start_time, end_time, status } = req.body;
    
    // Build update object with only provided fields
    const updateData = {};
    if (day_of_week) updateData.day_of_week = day_of_week;
    if (caregiver_id) updateData.caregiver_id = caregiver_id;
    if (start_time) updateData.start_time = start_time;
    if (end_time) updateData.end_time = end_time;
    if (status) updateData.status = status;
    
    const updated = await db('shifts')
      .where({ id })
      .update(updateData);
    
    if (updated === 0) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    
    const updatedShift = await db('shifts')
      .join('team_members', 'shifts.caregiver_id', 'team_members.id')
      .select(
        'shifts.id',
        'shifts.day_of_week',
        'shifts.start_time',
        'shifts.end_time',
        'shifts.status',
        'shifts.week_id',
        'team_members.id as caregiver_id',
        'team_members.name as caregiver_name',
        'team_members.role as caregiver_role'
      )
      .where('shifts.id', id)
      .first();
    
    res.status(200).json(updatedShift);
  } catch (error) {
    console.error(`Error updating shift with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update shift' });
  }
};

// DELETE a shift
exports.deleteShift = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if shift exists
    const shift = await db('shifts')
      .where({ id })
      .first();
    
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    
    // Delete the shift
    await db('shifts')
      .where({ id })
      .delete();
    
    res.status(200).json({ message: 'Shift deleted successfully' });
  } catch (error) {
    console.error(`Error deleting shift with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete shift' });
  }
};

// POST drop a shift
exports.dropShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    // Get the shift to drop
    const shift = await db('shifts')
      .join('team_members', 'shifts.caregiver_id', 'team_members.id')
      .select(
        'shifts.*',
        'team_members.name as caregiver_name'
      )
      .where('shifts.id', id)
      .first();
    
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    
    // Update shift status to dropped
    await db('shifts')
      .where({ id })
      .update({ 
        status: 'dropped'
      });
    
    // Create notification for dropped shift
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    await db('notifications').insert({
      type: 'drop',
      from_caregiver_id: shift.caregiver_id,
      affected_shift_id: shift.id,
      week_id: shift.week_id,
      message: `Dropped shift (${shift.start_time}-${shift.end_time})${reason ? `: ${reason}` : ', needs coverage'}`,
      date: dateStr,
      time: timeStr,
      status: 'pending'
    });
    
    // Get the updated shift
    const updatedShift = await db('shifts')
      .join('team_members', 'shifts.caregiver_id', 'team_members.id')
      .select(
        'shifts.id',
        'shifts.day_of_week',
        'shifts.start_time',
        'shifts.end_time',
        'shifts.status',
        'shifts.week_id',
        'team_members.id as caregiver_id',
        'team_members.name as caregiver_name',
        'team_members.role as caregiver_role'
      )
      .where('shifts.id', id)
      .first();
    
    res.status(200).json(updatedShift);
  } catch (error) {
    console.error(`Error dropping shift with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to drop shift' });
  }
};

// POST swap shifts
exports.swapShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { swap_with_id } = req.body;
    
    // Basic validation
    if (!swap_with_id) {
      return res.status(400).json({ error: 'Swap with ID is required' });
    }
    
    // Get the shift to swap
    const shift = await db('shifts')
      .join('team_members', 'shifts.caregiver_id', 'team_members.id')
      .select(
        'shifts.*',
        'team_members.name as caregiver_name'
      )
      .where('shifts.id', id)
      .first();
    
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    
    // Get the shift to swap with
    const swapWithShift = await db('shifts')
      .join('team_members', 'shifts.caregiver_id', 'team_members.id')
      .select(
        'shifts.*',
        'team_members.name as caregiver_name'
      )
      .where('shifts.id', swap_with_id)
      .first();
    
    if (!swapWithShift) {
      return res.status(404).json({ error: 'Swap with shift not found' });
    }
    
    // Update both shifts to swap-proposed
    await db('shifts')
      .where({ id })
      .update({ 
        status: 'swap-proposed'
      });
    
    await db('shifts')
      .where({ id: swap_with_id })
      .update({ 
        status: 'swap-proposed'
      });
    
    // Create notification for swap request
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    await db('notifications').insert({
      type: 'swap',
      from_caregiver_id: shift.caregiver_id,
      affected_shift_id: shift.id,
      week_id: shift.week_id,
      message: `Proposed shift swap with ${swapWithShift.caregiver_name}`,
      date: dateStr,
      time: timeStr,
      status: 'pending'
    });
    
    // Return both updated shifts
    const [updatedShift, updatedSwapWithShift] = await Promise.all([
      db('shifts')
        .join('team_members', 'shifts.caregiver_id', 'team_members.id')
        .select(
          'shifts.id',
          'shifts.day_of_week',
          'shifts.start_time',
          'shifts.end_time',
          'shifts.status',
          'shifts.week_id',
          'team_members.id as caregiver_id',
          'team_members.name as caregiver_name'
        )
        .where('shifts.id', id)
        .first(),
      db('shifts')
        .join('team_members', 'shifts.caregiver_id', 'team_members.id')
        .select(
          'shifts.id',
          'shifts.day_of_week',
          'shifts.start_time',
          'shifts.end_time',
          'shifts.status',
          'shifts.week_id',
          'team_members.id as caregiver_id',
          'team_members.name as caregiver_name'
        )
        .where('shifts.id', swap_with_id)
        .first()
    ]);
    
    res.status(200).json({
      original_shift: updatedShift,
      swap_with_shift: updatedSwapWithShift
    });
  } catch (error) {
    console.error(`Error swapping shift with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to swap shift' });
  }
};

// POST adjust shift hours
exports.adjustShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_start_time, new_end_time, reason } = req.body;
    
    // Basic validation
    if (!new_start_time && !new_end_time) {
      return res.status(400).json({ error: 'New start time or end time is required' });
    }
    
    // Get the shift to adjust
    const shift = await db('shifts')
      .join('team_members', 'shifts.caregiver_id', 'team_members.id')
      .select(
        'shifts.*',
        'team_members.name as caregiver_name'
      )
      .where('shifts.id', id)
      .first();
    
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    
    // Store original times for notification
    const originalStartTime = shift.start_time;
    const originalEndTime = shift.end_time;
    
    // Update shift with new times
    const updateData = {
      status: 'adjusted'
    };
    if (new_start_time) updateData.start_time = new_start_time;
    if (new_end_time) updateData.end_time = new_end_time;
    
    await db('shifts')
      .where({ id })
      .update(updateData);
    
    // Create notification for adjusted shift
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    await db('notifications').insert({
      type: 'adjust',
      from_caregiver_id: shift.caregiver_id,
      affected_shift_id: shift.id,
      week_id: shift.week_id,
      message: `Changed shift from ${originalStartTime}-${originalEndTime} to ${new_start_time || shift.start_time}-${new_end_time || shift.end_time}${reason ? `: ${reason}` : ''}`,
      date: dateStr,
      time: timeStr,
      status: 'completed'
    });
    
    // Get the updated shift
    const updatedShift = await db('shifts')
      .join('team_members', 'shifts.caregiver_id', 'team_members.id')
      .select(
        'shifts.id',
        'shifts.day_of_week',
        'shifts.start_time',
        'shifts.end_time',
        'shifts.status',
        'shifts.week_id',
        'team_members.id as caregiver_id',
        'team_members.name as caregiver_name'
      )
      .where('shifts.id', id)
      .first();
    
    res.status(200).json(updatedShift);
  } catch (error) {
    console.error(`Error adjusting shift with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to adjust shift' });
  }
};