const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');

// GET all team members
router.get('/', teamController.getAllTeamMembers);

// GET a specific team member
router.get('/:id', teamController.getTeamMemberById);

// POST create a new team member
router.post('/', teamController.createTeamMember);

// PUT update a team member
router.put('/:id', teamController.updateTeamMember);

// DELETE a team member
router.delete('/:id', teamController.deleteTeamMember);

module.exports = router;