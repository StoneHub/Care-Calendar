const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// GET all notifications
router.get('/', notificationController.getAllNotifications);

// GET notifications by status
router.get('/status/:status', notificationController.getNotificationsByStatus);

// GET a specific notification
router.get('/:id', notificationController.getNotificationById);

// POST create a new notification
router.post('/', notificationController.createNotification);

// PUT update a notification
router.put('/:id', notificationController.updateNotification);

// PUT approve a notification
router.put('/:id/approve', notificationController.approveNotification);

module.exports = router;