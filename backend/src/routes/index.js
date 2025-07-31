const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Import individual route modules
const teamRoutes = require('./team');
const scheduleRoutes = require('./schedule');
const notificationRoutes = require('./notifications');
const payrollRoutes = require('./payroll');
const historyRoutes = require('./historyRoutes');
const unavailabilityRoutes = require('./unavailability');

// Mount the routes on the router
router.use('/team', teamRoutes);
router.use('/schedule', scheduleRoutes);
router.use('/notifications', notificationRoutes);
router.use('/payroll', payrollRoutes);
router.use('/history', historyRoutes);
router.use('/unavailability', unavailabilityRoutes);

// Debug routes - only available in development
if (process.env.NODE_ENV !== 'production') {
  // Route to get debug logs
  router.get('/debug/logs', (req, res) => {
    try {
      const logFile = path.join(__dirname, '../../../logs/debug.log');
      
      if (!fs.existsSync(logFile)) {
        return res.status(404).json({ error: 'Debug log file not found' });
      }
      
      // Read the last 100 lines
      const maxLines = req.query.lines ? parseInt(req.query.lines) : 100;
      const content = fs.readFileSync(logFile, 'utf8').split('\n').slice(-maxLines).join('\n');
      
      res.status(200).json({ 
        logs: content,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error fetching debug logs', { error: error.message });
      res.status(500).json({ error: 'Failed to fetch debug logs' });
    }
  });
  
  // Route to get database status
  router.get('/debug/db', async (req, res) => {
    try {
      // Use LowDB directly instead of old db util
      const lowdbUtil = require('../utils/lowdbUtil');
      const tables = [
        'team_members',
        'weeks',
        'shifts',
        'notifications',
        'history',
        'unavailability',
        'payroll_records'
      ];
      const tableStatus = {};
      for (const table of tables) {
        const all = lowdbUtil.getAll(table);
        tableStatus[table] = {
          count: all.length,
          latest: all.length > 0 ? all[all.length - 1] : null
        };
      }
      res.status(200).json({
        status: 'connected',
        tables: tableStatus,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error fetching database status', { error: error.message });
      res.status(500).json({ 
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
}

module.exports = router;