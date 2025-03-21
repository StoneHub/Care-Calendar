const express = require('express');
const router = express.Router();

// Import individual route modules
const teamRoutes = require('./team');
const scheduleRoutes = require('./schedule');
const notificationRoutes = require('./notifications');
const payrollRoutes = require('./payroll');

// Mount the routes on the router
router.use('/team', teamRoutes);
router.use('/schedule', scheduleRoutes);
router.use('/notifications', notificationRoutes);
router.use('/payroll', payrollRoutes);

module.exports = router;