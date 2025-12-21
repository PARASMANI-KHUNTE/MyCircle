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

module.exports = router;
