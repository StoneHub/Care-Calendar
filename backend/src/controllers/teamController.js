const db = require('../utils/db');

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
    
    // Begin transaction for potentially multiple operations
    await db.transaction(async trx => {
      // If force delete is true, delete all shifts for this caregiver first
      if (forceDelete) {
        // Check if member has shifts
        const shiftsCount = await trx('shifts')
          .where({ caregiver_id: id })
          .count('id as count')
          .first();
        
        const hasShifts = shiftsCount && shiftsCount.count > 0;
        
        if (hasShifts) {
          console.log(`Force deleting ${shiftsCount.count} shifts for caregiver ${id}`);
          // Delete all shifts for this caregiver
          await trx('shifts')
            .where({ caregiver_id: id })
            .delete();
        }
      }
      
      // Now delete the team member
      await trx('team_members')
        .where({ id })
        .delete();
    });
    
    res.status(200).json({ message: 'Team member deleted successfully' });
  } catch (error) {
    console.error(`Error deleting team member with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete team member' });
  }
};