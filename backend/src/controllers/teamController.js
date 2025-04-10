const db = require('../utils/db');
const { recordHistory } = require('../utils/history');
const logger = require('../utils/logger');

// GET all team members
exports.getAllTeamMembers = async (req, res) => {
  try {
    const teamMembers = await db('team_members').select('*');
    res.status(200).json(teamMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
};

// GET a specific team member by ID
exports.getTeamMemberById = async (req, res) => {
  try {
    const { id } = req.params;
    const teamMember = await db('team_members')
      .where({ id })
      .first();
    
    if (!teamMember) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    
    res.status(200).json(teamMember);
  } catch (error) {
    console.error(`Error fetching team member with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch team member' });
  }
};

// POST create a new team member
exports.createTeamMember = async (req, res) => {
  try {
    const { name, role, availability, hours_per_week } = req.body;
    
    // Basic validation
    if (!name || !role || !availability || !hours_per_week) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const [id] = await db('team_members')
      .insert({
        name,
        role,
        availability,
        hours_per_week
      })
      .returning('id');
    
    const newTeamMember = await db('team_members')
      .where({ id })
      .first();
    
    res.status(201).json(newTeamMember);
  } catch (error) {
    console.error('Error creating team member:', error);
    res.status(500).json({ error: 'Failed to create team member' });
  }
};

// PUT update a team member
exports.updateTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, availability, hours_per_week } = req.body;
    
    // Basic validation
    if (!name && !role && !availability && !hours_per_week) {
      return res.status(400).json({ error: 'No update fields provided' });
    }
    
    // Build update object with only provided fields
    const updateData = {};
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (availability) updateData.availability = availability;
    if (hours_per_week) updateData.hours_per_week = hours_per_week;
    
    const updated = await db('team_members')
      .where({ id })
      .update(updateData);
    
    if (updated === 0) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    
    const updatedTeamMember = await db('team_members')
      .where({ id })
      .first();
    
    res.status(200).json(updatedTeamMember);
  } catch (error) {
    console.error(`Error updating team member with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update team member' });
  }
};

// DELETE a team member
exports.deleteTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const forceDelete = req.query.force === 'true';
    
    // Check if team member exists
    const teamMember = await db('team_members')
      .where({ id })
      .first();
    
    if (!teamMember) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    
    // Check for related shifts before starting transaction
    if (!forceDelete) {
      const shiftsCount = await db('shifts')
        .where({ caregiver_id: id })
        .count('id as count')
        .first();
      
      const hasShifts = shiftsCount && parseInt(shiftsCount.count) > 0;
      
      if (hasShifts) {
        return res.status(409).json({ 
          error: `Cannot delete team member with ${shiftsCount.count} assigned shifts. Use force delete or reassign shifts first.` 
        });
      }
    }
    
    // Handle deletion with all potential foreign key constraints
    try {
      // Store the team member data for history records before deletion
      const name = teamMember.name;
      const role = teamMember.role;
      
      // Force delete handles all relations
      if (forceDelete) {
        // Check for shifts
        const shiftsCount = await db('shifts')
          .where({ caregiver_id: id })
          .count('id as count')
          .first();
        
        const hasShifts = shiftsCount && parseInt(shiftsCount.count) > 0;
        
        if (hasShifts) {
          logger.info(`Force deleting ${shiftsCount.count} shifts for caregiver ${id} (${name})`);
          
          // Delete shifts
          await db('shifts')
            .where({ caregiver_id: id })
            .delete();
        }
        
        // Check and delete unavailability records
        const unavailabilityCount = await db('unavailability')
          .where({ caregiver_id: id })
          .count('id as count')
          .first();
          
        if (unavailabilityCount && parseInt(unavailabilityCount.count) > 0) {
          logger.info(`Force deleting ${unavailabilityCount.count} unavailability records for caregiver ${id}`);
          
          await db('unavailability')
            .where({ caregiver_id: id })
            .delete();
        }
        
        // Check and delete notifications related to this caregiver
        const notificationsCount = await db('notifications')
          .where({ from_caregiver_id: id })
          .orWhere({ to_caregiver_id: id })
          .count('id as count')
          .first();
          
        if (notificationsCount && parseInt(notificationsCount.count) > 0) {
          logger.info(`Force deleting ${notificationsCount.count} notifications related to caregiver ${id}`);
          
          await db('notifications')
            .where({ from_caregiver_id: id })
            .orWhere({ to_caregiver_id: id })
            .delete();
        }
      }
      
      // Now delete the team member - this is done outside any transaction
      // to avoid complex transaction handling with potential cascades
      await db('team_members')
        .where({ id })
        .delete();
      
      // Record history after successful deletion
      await recordHistory(
        'delete',
        'team_member',
        id,
        `Deleted team member: ${name}`,
        { 
          details: { 
            name,
            role,
            forceDelete
          }
        }
      );
      
      // Return success
      res.status(200).json({ message: 'Team member deleted successfully' });
    } catch (error) {
      logger.error(`Error in delete operation for team member ${id}:`, error);
      
      if (error.code === 'SQLITE_CONSTRAINT') {
        return res.status(409).json({ 
          error: 'Cannot delete team member due to database constraints. This may be due to history records or other dependencies.' 
        });
      }
      
      throw error; // Re-throw for outer catch block
    }
  } catch (error) {
    logger.error(`Error deleting team member with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete team member' });
  }
};