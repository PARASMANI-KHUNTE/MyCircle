const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validateProfileContent } = require('../middleware/validateContent');
const userController = require('../controllers/userController');

router.get('/profile', auth, userController.getUserProfile);
router.put('/profile', [auth, upload.single('avatar'), validateProfileContent], userController.updateUserProfile);
router.get('/stats', auth, userController.getUserStats);
router.put('/settings', auth, userController.updateUserSettings);
router.post('/block/:userId', auth, userController.blockUser);
router.post('/unblock/:userId', auth, userController.unblockUser);
router.post('/report', auth, userController.reportUser);
router.get('/connections', auth, userController.getConnections);

module.exports = router;
