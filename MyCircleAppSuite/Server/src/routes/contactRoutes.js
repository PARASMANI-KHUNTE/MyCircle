const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const contactController = require('../controllers/contactController');
const { validate, schemas } = require('../middleware/validation');

router.post('/request', auth, contactController.createRequest);
router.post('/:postId', auth, contactController.createRequest);
router.get('/received', auth, contactController.getReceivedRequests);
router.get('/sent', auth, contactController.getSentRequests);
router.put('/:id/status', auth, contactController.updateRequestStatus);
router.post('/:id/rate', [auth, validate(schemas.rateRequest)], contactController.rateRequest);
router.delete('/:id', auth, contactController.deleteRequest);

module.exports = router;
