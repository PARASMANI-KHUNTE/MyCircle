const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// All payment routes require authentication
router.use(auth);

// Wallet endpoints
router.get('/wallet', asyncHandler(paymentController.getWallet));
router.post('/wallet/topup', asyncHandler(paymentController.topupWallet));
router.post('/wallet/topup/confirm', asyncHandler(paymentController.confirmTopup));

// Payout details (UPI & Bank Account for Sellers)
router.get('/payout-details', asyncHandler(paymentController.getPayoutDetails));
router.post('/payout-details', asyncHandler(paymentController.updatePayoutDetails));

// Razorpay Payment Gateway (UPI, NetBanking, Cards)
router.post('/razorpay/create-order', asyncHandler(paymentController.createRazorpayOrder));
router.post('/razorpay/verify', asyncHandler(paymentController.verifyRazorpayPayment));

// Stripe Connect for sellers (legacy / international fallback)
router.post('/stripe/connect', asyncHandler(paymentController.createStripeConnect));
router.get('/stripe/connect/status', asyncHandler(paymentController.getStripeConnectStatus));

// Escrow endpoints
router.post('/escrow/create', asyncHandler(paymentController.createEscrowIntent));
// Checkout alias used by the web client
router.post('/create-intent', asyncHandler(paymentController.createEscrowIntent));
router.post('/escrow/:escrowId/confirm', asyncHandler(paymentController.confirmEscrow));
router.post('/escrow/:escrowId/release', asyncHandler(paymentController.releaseEscrow));
router.post('/escrow/:escrowId/refund', asyncHandler(paymentController.refundEscrow));
router.get('/escrow/post/:postId', asyncHandler(paymentController.getActiveEscrowForPost));
router.get('/escrow/history', asyncHandler(paymentController.getEscrowHistory));
router.get('/escrow/:escrowId', asyncHandler(paymentController.getEscrow));

module.exports = router;
