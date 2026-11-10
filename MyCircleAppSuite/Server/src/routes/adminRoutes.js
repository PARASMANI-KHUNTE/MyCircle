const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// All admin routes require authentication and admin role
router.use(auth, adminController.requireAdmin);

// Dashboard stats
router.get('/stats', asyncHandler(adminController.getStats));

// Activity feed
router.get('/activity', asyncHandler(adminController.getActivity));

// Users management
router.get('/users', asyncHandler(adminController.getUsers));
router.get('/users/:id', asyncHandler(adminController.getUser));
router.post('/users/:id/role', asyncHandler(adminController.updateUserRole));
router.post('/users/:id/ban', asyncHandler(adminController.banUser));
router.post('/users/:id/unban', asyncHandler(adminController.unbanUser));

// Payments/Transactions
router.get('/payments', asyncHandler(adminController.getPayments));
router.get('/payments/:id', asyncHandler(adminController.getPayment));

// Reports/Moderation
router.get('/reports', asyncHandler(adminController.getReports));
router.get('/reports/:id', asyncHandler(adminController.getReport));
router.post('/reports/:id/resolve', asyncHandler(adminController.resolveReport));
router.post('/reports/:id/dismiss', asyncHandler(adminController.dismissReport));
router.post('/reports/:id/escalate', asyncHandler(adminController.escalateReport));

// Service health metrics
router.get('/health/:service/metrics', asyncHandler(adminController.getServiceMetrics));

// Analytics
router.get('/analytics', asyncHandler(adminController.getAnalytics));

module.exports = router;