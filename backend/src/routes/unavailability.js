const express = require('express');
const router = express.Router();
const unavailabilityController = require('../controllers/unavailabilityController');

// Get all unavailability records
router.get('/', unavailabilityController.getAllUnavailability);

// Get unavailability for a specific caregiver
router.get('/caregiver/:id', unavailabilityController.getCaregiverUnavailability);

// Create a new unavailability record
router.post('/', unavailabilityController.createUnavailability);

// Update an existing unavailability record
router.put('/:id', unavailabilityController.updateUnavailability);

// Delete an unavailability record
router.delete('/:id', unavailabilityController.deleteUnavailability);

module.exports = router;
