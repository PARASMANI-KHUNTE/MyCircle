const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const reviewController = require('../controllers/reviewController');
const auth = require('../middleware/auth');

// Authenticated profile management
router.get('/profile', auth, userController.getUserProfile);
router.put('/profile', auth, userController.updateUserProfile);
router.get('/stats', auth, userController.getUserStats);

// Public profile (for ProfilePage by ID)
router.get('/:id/reviews', reviewController.getUserReviews);
router.get('/:id', userController.getPublicProfile);

module.exports = router;
