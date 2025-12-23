const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const postController = require('../controllers/postController');
const reviewController = require('../controllers/reviewController');

// @route   POST /api/posts
// @access  Private
router.post('/', [auth, upload.array('images', 5)], postController.createPost);

// Feed/endpoints backing frontend routes
router.get('/feed/public', postController.getPublicFeed);
router.get('/feed/personal', auth, postController.getPersonalizedFeed);

// Get user's own posts
router.get('/my-posts', auth, postController.getMyPosts);

router.get('/', postController.getPosts);
router.get('/:id', postController.getPostById);
router.put('/:id', auth, postController.updatePost);
router.delete('/:id', auth, postController.deletePost);
router.patch('/:id/toggle-status', auth, postController.togglePostStatus);
router.post('/:id/like', auth, postController.likePost);
router.post('/:id/share', postController.sharePost);

// Reviews
router.get('/:id/reviews', reviewController.getPostReviews);
router.post('/:id/reviews', auth, reviewController.upsertReview);

module.exports = router;
