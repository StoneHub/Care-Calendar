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

// Mount the routes on the router
router.use('/team', teamRoutes);
router.use('/schedule', scheduleRoutes);
router.use('/notifications', notificationRoutes);
router.use('/payroll', payrollRoutes);
router.use('/history', historyRoutes);

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
      const db = require('../utils/db');
      
      // Get table counts
      const [teamCount, weekCount, shiftCount, notificationCount, historyCount] = await Promise.all([
        db('team_members').count('id as count').first(),
        db('weeks').count('id as count').first(),
        db('shifts').count('id as count').first(),
        db('notifications').count('id as count').first(),
        db('history_records').count('id as count').catch(() => ({ count: 0 })).then(r => r || { count: 0 })
      ]);
      
      // Get most recent records
      const [latestTeamMember, latestWeek, latestShift, latestNotification, latestHistory] = await Promise.all([
        db('team_members').orderBy('id', 'desc').first(),
        db('weeks').orderBy('id', 'desc').first(),
        db('shifts').orderBy('id', 'desc').first(),
        db('notifications').orderBy('id', 'desc').first(),
        db('history_records').orderBy('id', 'desc').first().catch(() => null)
      ]);
      
      res.status(200).json({
        status: 'connected',
        tables: {
          team_members: { count: teamCount?.count || 0, latest: latestTeamMember || null },
          weeks: { count: weekCount?.count || 0, latest: latestWeek || null },
          shifts: { count: shiftCount?.count || 0, latest: latestShift || null },
          notifications: { count: notificationCount?.count || 0, latest: latestNotification || null },
          history_records: { count: historyCount?.count || 0, latest: latestHistory || null }
        },
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