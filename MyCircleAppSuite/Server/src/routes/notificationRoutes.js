const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getNotifications,
    getUnreadCount,
    markRead,
    markAllRead,
    deleteNotification,
    deleteAll,
    registerDeviceToken,
    unregisterDeviceToken,
} = require('../controllers/notificationController');

router.get('/', auth, getNotifications);
router.get('/unread-count', auth, getUnreadCount);
router.post('/device-token', auth, registerDeviceToken);
router.delete('/device-token', auth, unregisterDeviceToken);
router.put('/:id/read', auth, markRead);
router.put('/read-all', auth, markAllRead);
router.delete('/delete-all', auth, deleteAll); // Using a more explicit path to avoid conflict with /:id if not careful
router.delete('/:id', auth, deleteNotification);

module.exports = router;
