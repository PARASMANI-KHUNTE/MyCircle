const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const chatController = require('../controllers/chatController');
const { validate, schemas } = require('../middleware/validation');

// Web compatibility mount: the ChatWindow payment-complete flow posts to
// /api/chats/:conversationId/messages, while the primary endpoint is
// POST /api/chat/message. This router is mounted at /api/chats.
router.post('/:conversationId/messages', [auth, validate(schemas.sendMessageToConversation)], chatController.sendMessageInConversation);

module.exports = router;
