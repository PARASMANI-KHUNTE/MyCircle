const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const chatController = require('../controllers/chatController');

router.get('/conversations', auth, chatController.getConversations);
router.get('/conversation/:userId', auth, chatController.getOrCreateConversation);
router.get('/messages/:conversationId', auth, chatController.getMessages);
router.post('/message', auth, chatController.sendMessage);
router.post('/init/:userId', auth, chatController.initChat);
router.delete('/conversation/:conversationId', auth, chatController.deleteConversation);
router.put('/read/:conversationId', auth, chatController.markRead);
router.get('/unread/count', auth, chatController.getTotalUnreadCount);

module.exports = router;
