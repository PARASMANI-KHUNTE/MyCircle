const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const postController = require('../controllers/postController');

// @route   POST /api/posts
// @access  Private
router.post('/', [auth, upload.array('images', 5)], postController.createPost);

// Get user's own posts
router.get('/my-posts', auth, postController.getMyPosts);

router.get('/', postController.getPosts);
router.get('/:id', postController.getPostById);
router.put('/:id', auth, postController.updatePost);
router.delete('/:id', auth, postController.deletePost);
router.patch('/:id/toggle-status', auth, postController.togglePostStatus);
router.post('/:id/like', auth, postController.likePost);
router.post('/:id/share', postController.sharePost);

module.exports = router;
