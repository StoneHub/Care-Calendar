const db = require('../utils/db');
const { recordHistory } = require('../utils/history');
const logger = require('../utils/logger');
const { withTransaction } = require('../utils/transaction');

// GET all team members with option to filter by active status
exports.getAllTeamMembers = async (req, res) => {
  try {
    const showInactive = req.query.showInactive === 'true';
    
    // Only show active team members by default
    let query = db('team_members').select('*');
    
    // Filter by active status unless specifically requested to show all
    if (!showInactive) {
      query = query.where({ is_active: true });
    }
    
    const teamMembers = await query;
    res.status(200).json(teamMembers);
  } catch (error) {
    logger.error('Error fetching team members:', error);
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
    logger.error(`Error fetching team member with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch team member' });
  }
};

// POST create a new team member
exports.createTeamMember = async (req, res) => {
  try {
    const { name, role, availability } = req.body;
    
    // Basic validation
    if (!name || !role || !availability) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const [id] = await db('team_members')
      .insert({
        name,
        role,
        availability,
        is_active: true
      })
      .returning('id');
    
    const newTeamMember = await db('team_members')
      .where({ id })
      .first();
    
    // Record history
    await recordHistory(
      'create',
      'team_member',
      id,
      `Created new team member: ${name}`,
      { 
        details: { 
          name,
          role,
          availability
        }
      }
    );
    
    res.status(201).json(newTeamMember);
  } catch (error) {
    logger.error('Error creating team member:', error);
    res.status(500).json({ error: 'Failed to create team member' });
  }
};

// PUT update a team member
exports.updateTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, availability, is_active } = req.body;
    
    // Basic validation
    if (!name && !role && !availability && is_active === undefined) {
      return res.status(400).json({ error: 'No update fields provided' });
    }
    
    // Build update object with only provided fields
    const updateData = {};
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (availability) updateData.availability = availability;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    // Get team member before update for history
    const teamMemberBefore = await db('team_members')
      .where({ id })
      .first();
      
    if (!teamMemberBefore) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    
    const updated = await db('team_members')
      .where({ id })
      .update(updateData);
    
    if (updated === 0) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    
    const updatedTeamMember = await db('team_members')
      .where({ id })
      .first();
    
    // Record history for the update
    let actionType = 'update';
    let description = `Updated team member: ${teamMemberBefore.name}`;
    
    if (is_active !== undefined) {
      if (is_active) {
        actionType = 'reactivate';
        description = `Reactivated team member: ${teamMemberBefore.name}`;
      } else {
        actionType = 'deactivate';
        description = `Deactivated team member: ${teamMemberBefore.name}`;
      }
    }
    
    await recordHistory(
      actionType,
      'team_member',
      id,
      description,
      { 
        details: { 
          before: {
            name: teamMemberBefore.name,
            role: teamMemberBefore.role,
            availability: teamMemberBefore.availability,
            is_active: teamMemberBefore.is_active
          },
          after: updateData
        }
      }
    );
    
    res.status(200).json(updatedTeamMember);
  } catch (error) {
    logger.error(`Error updating team member with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update team member' });
  }
};

// DELETE a team member (soft delete by default, hard delete if forceDelete=true)
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
    
    // Proper soft delete using transactions
    await withTransaction(async (trx) => {
      if (forceDelete) {
        // Hard delete - remove related records first within the transaction
        
        // Check for shifts
        const shiftsCount = await trx('shifts')
          .where({ caregiver_id: id })
          .count('id as count')
          .first();
        
        const hasShifts = shiftsCount && parseInt(shiftsCount.count) > 0;
        
        if (hasShifts) {
          logger.info(`Force deleting ${shiftsCount.count} shifts for caregiver ${id} (${teamMember.name})`);
          await trx('shifts')
            .where({ caregiver_id: id })
            .delete();
        }
        
        // Check and delete unavailability records
        const unavailabilityCount = await trx('unavailability')
          .where({ caregiver_id: id })
          .count('id as count')
          .first();
          
        if (unavailabilityCount && parseInt(unavailabilityCount.count) > 0) {
          logger.info(`Force deleting ${unavailabilityCount.count} unavailability records for caregiver ${id}`);
          await trx('unavailability')
            .where({ caregiver_id: id })
            .delete();
        }
        
        // Check and delete notifications related to this caregiver
        const notificationsCount = await trx('notifications')
          .where({ from_caregiver_id: id })
          .count('id as count')
          .first();
          
        if (notificationsCount && parseInt(notificationsCount.count) > 0) {
          logger.info(`Force deleting ${notificationsCount.count} notifications related to caregiver ${id}`);
          await trx('notifications')
            .where({ from_caregiver_id: id })
            .delete();
        }
        
        // Finally, delete the team member
        await trx('team_members')
          .where({ id })
          .delete();
          
        // Record history for hard delete
        await recordHistory(
          'delete',
          'team_member',
          id,
          `Permanently deleted team member: ${teamMember.name}`,
          { 
            details: { 
              name: teamMember.name,
              role: teamMember.role,
              forceDelete: true
            }
          },
          trx // Pass the transaction object here
        );
      } else {
        // Soft delete - just update is_active flag to false
        await trx('team_members')
          .where({ id })
          .update({ is_active: false });
          
        // Record history for soft delete
        await recordHistory(
          'deactivate',
          'team_member',
          id,
          `Deactivated team member: ${teamMember.name}`,
          { 
            details: { 
              name: teamMember.name,
              role: teamMember.role,
              forceDelete: false
            }
          },
          trx // Pass the transaction object here
        );
      }
    });
    
    // Return success
    const action = forceDelete ? "deleted" : "deactivated";
    res.status(200).json({ message: `Team member ${action} successfully` });
  } catch (error) {
    logger.error(`Error in delete operation for team member ${req.params.id}:`, error);
    
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({ 
        error: 'Cannot delete team member due to database constraints. This may be due to history records or other dependencies.' 
      });
    }
    
    res.status(500).json({ error: `Failed to delete team member: ${error.message}` });
  }
};
