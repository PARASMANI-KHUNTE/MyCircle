const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const adminController = require('../controllers/adminController');

router.use(auth, requireAdmin);

router.get('/users', adminController.listUsers);
router.patch('/users/:id/role', ...adminController.updateUserRole);
router.get('/reports', adminController.listReports);

module.exports = router;