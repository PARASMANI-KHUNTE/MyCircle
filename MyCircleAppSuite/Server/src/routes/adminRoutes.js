const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const adminController = require('../controllers/adminController');
const supportController = require('../controllers/supportController');
const { validate, schemas } = require('../middleware/validation');

router.use(auth, requireAdmin);

router.get('/overview', adminController.getOverview);
router.get('/users', adminController.listUsers);
router.patch('/users/:id/role', ...adminController.updateUserRole);
router.patch('/users/:id/status', ...adminController.updateUserStatus);
router.get('/posts', adminController.listPosts);
router.patch('/posts/:id/moderation', ...adminController.updatePostModeration);
router.get('/reports', adminController.listReports);
router.get('/submissions', supportController.listSubmissions);
router.patch('/submissions/:id', validate(schemas.updateSupportSubmission), supportController.updateSubmission);

module.exports = router;