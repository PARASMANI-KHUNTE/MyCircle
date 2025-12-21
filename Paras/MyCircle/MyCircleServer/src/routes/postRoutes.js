const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validatePostContent } = require('../middleware/validateContent');
const postController = require('../controllers/postController');

// @route   POST /api/posts
// @access  Private
router.post('/', [auth, upload.array('images', 5), validatePostContent], postController.createPost);

// Get user's own posts
router.get('/my-posts', auth, postController.getMyPosts);

router.get('/', postController.getPosts);
router.get('/:id', postController.getPostById);
router.put('/:id', auth, postController.updatePost);
router.delete('/:id', auth, postController.deletePost);
router.patch('/:id/toggle-status', auth, postController.togglePostStatus);
router.post('/:id/like', auth, postController.likePost);
router.post('/:id/share', postController.sharePost);
router.get('/related/:id', postController.getRelatedPosts);
router.patch('/:id/status', auth, postController.updatePostStatus);
router.get('/:id/analytics', auth, postController.getPostAnalytics);

module.exports = router;
