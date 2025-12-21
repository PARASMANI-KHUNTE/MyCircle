const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const contactController = require('../controllers/contactController');

router.post('/request', auth, contactController.createRequest);
router.post('/:postId', auth, contactController.createRequest);
router.get('/received', auth, contactController.getReceivedRequests);
router.get('/sent', auth, contactController.getSentRequests);
router.put('/:id/status', auth, contactController.updateRequestStatus);

module.exports = router;
