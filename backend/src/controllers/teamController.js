const lowdbUtil = require('../utils/lowdbUtil');
const { recordHistory } = require('../utils/history');
const logger = require('../utils/logger');

// GET all team members with option to filter by active status
exports.getAllTeamMembers = async (req, res) => {
  try {
    const showInactive = req.query.showInactive === 'true';
    let teamMembers = lowdbUtil.getAll('team_members');
    if (!showInactive) {
      teamMembers = teamMembers.filter(m => m.is_active !== false);
    }
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
    const teamMember = lowdbUtil.findById('team_members', id);
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
    if (!name || !role || !availability) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const newTeamMember = lowdbUtil.insert('team_members', {
      name,
      role,
      availability,
      is_active: true
    });
    await recordHistory(
      'create',
      'team_member',
      newTeamMember.id,
      `Created new team member: ${name}`,
      { details: { name, role, availability } }
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
    if (!name && !role && !availability && is_active === undefined) {
      return res.status(400).json({ error: 'No update fields provided' });
    }
    const teamMemberBefore = lowdbUtil.findById('team_members', id);
    if (!teamMemberBefore) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    const updateData = {};
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (availability) updateData.availability = availability;
    if (is_active !== undefined) updateData.is_active = is_active;
    const updatedTeamMember = lowdbUtil.update('team_members', id, updateData);
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
      { details: { before: teamMemberBefore, after: updateData } }
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
    const teamMember = lowdbUtil.findById('team_members', id);
    if (!teamMember) {
      return res.status(404).json({ error: 'Team member not found' });
    }
    if (forceDelete) {
      // Hard delete: remove related records manually
      lowdbUtil.removeWhere('shifts', { caregiver_id: id });
      lowdbUtil.removeWhere('unavailability', { caregiver_id: id });
      lowdbUtil.removeWhere('notifications', { from_caregiver_id: id });
      lowdbUtil.remove('team_members', id);
      await recordHistory(
        'delete',
        'team_member',
        id,
        `Permanently deleted team member: ${teamMember.name}`,
        { details: { name: teamMember.name, role: teamMember.role, forceDelete: true } }
      );
    } else {
      // Soft delete: set is_active to false
      lowdbUtil.update('team_members', id, { is_active: false });
      await recordHistory(
        'deactivate',
        'team_member',
        id,
        `Deactivated team member: ${teamMember.name}`,
        { details: { name: teamMember.name, role: teamMember.role, forceDelete: false } }
      );
    }
    const action = forceDelete ? 'deleted' : 'deactivated';
    res.status(200).json({ message: `Team member ${action} successfully` });
  } catch (error) {
    logger.error(`Error in delete operation for team member ${req.params.id}:`, error);
    res.status(500).json({ error: `Failed to delete team member: ${error.message}` });
  }
};
