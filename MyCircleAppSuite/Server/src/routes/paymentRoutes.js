const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const mongoose = require('mongoose');

// All payment routes require authentication
router.use(auth);

// Wallet endpoints
router.get('/wallet', asyncHandler(paymentController.getWallet));
router.post('/wallet/topup', asyncHandler(paymentController.topupWallet));
router.post('/wallet/topup/confirm', asyncHandler(paymentController.confirmTopup));

// Stripe Connect for sellers
router.post('/stripe/connect', asyncHandler(paymentController.createStripeConnect));
router.get('/stripe/connect/status', asyncHandler(paymentController.getStripeConnectStatus));

// Escrow endpoints
router.post('/escrow/create', asyncHandler(paymentController.createEscrowIntent));
router.post('/escrow/:escrowId/confirm', asyncHandler(paymentController.confirmEscrow));
router.post('/escrow/:escrowId/release', asyncHandler(paymentController.releaseEscrow));
router.post('/escrow/:escrowId/refund', asyncHandler(paymentController.refundEscrow));
router.get('/escrow/history', asyncHandler(paymentController.getEscrowHistory));
router.get('/escrow/:escrowId', asyncHandler(paymentController.getEscrow));

// Webhook endpoint for Stripe (no auth required, verified by Stripe signature)
// router.post('/webhook', express.raw({ type: 'application/json' }), asyncHandler(paymentController.handleWebhook));

module.exports = router;