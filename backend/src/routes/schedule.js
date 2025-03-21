const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

// GET all weeks
router.get('/weeks', scheduleController.getAllWeeks);

// GET a specific week
router.get('/weeks/:id', scheduleController.getWeekById);

// GET current week
router.get('/weeks/current', scheduleController.getCurrentWeek);

// POST create a new week
router.post('/weeks', scheduleController.createWeek);

// PUT update a week
router.put('/weeks/:id', scheduleController.updateWeek);

// GET all shifts for a week
router.get('/weeks/:weekId/shifts', scheduleController.getShiftsByWeek);

// GET a specific shift
router.get('/shifts/:id', scheduleController.getShiftById);

// POST create a new shift
router.post('/shifts', scheduleController.createShift);

// PUT update a shift
router.put('/shifts/:id', scheduleController.updateShift);

// DELETE a shift
router.delete('/shifts/:id', scheduleController.deleteShift);

// POST drop a shift
router.post('/shifts/:id/drop', scheduleController.dropShift);

// POST swap shifts
router.post('/shifts/:id/swap', scheduleController.swapShift);

// POST adjust shift hours
router.post('/shifts/:id/adjust', scheduleController.adjustShift);

module.exports = router;