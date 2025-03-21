const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');

// GET all payroll records
router.get('/', payrollController.getAllPayrollRecords);

// GET payroll records by week
router.get('/week/:weekId', payrollController.getPayrollRecordsByWeek);

// GET payroll records by caregiver
router.get('/caregiver/:caregiverId', payrollController.getPayrollRecordsByCaregiver);

// POST calculate payroll for a week
router.post('/calculate/:weekId', payrollController.calculatePayrollForWeek);

// GET a specific payroll record
router.get('/:id', payrollController.getPayrollRecordById);

module.exports = router;