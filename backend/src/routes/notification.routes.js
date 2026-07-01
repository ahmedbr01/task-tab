const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth.middleware');
const notificationController = require('../controllers/notification.controller');

router.get('/', auth, notificationController.getNotifications);
router.get('/unread/count', auth, notificationController.getUnreadCount);
router.put('/:id/read', auth, notificationController.markAsRead);
router.put('/read-all', auth, notificationController.markAllAsRead);
router.post('/subscribe', auth, notificationController.saveSubscription);
router.delete('/subscribe', auth, notificationController.deleteSubscription);

module.exports = router;