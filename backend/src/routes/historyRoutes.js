/**
 * History Routes
 */
const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');

// Get all history records with filtering
router.get('/', historyController.getAllHistory);

// Get history for a specific entity
router.get('/entity/:entityType/:entityId', historyController.getEntityHistory);

// Get history for a specific week
router.get('/week/:weekId', historyController.getWeekHistory);

module.exports = router;