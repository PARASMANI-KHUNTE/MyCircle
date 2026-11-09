const Wallet = require('../models/Wallet');
const EscrowTransaction = require('../models/EscrowTransaction');
const Post = require('../models/Post');
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const mongoose = require('mongoose');
const razorpayConfig = require('../config/razorpay');

// For now, we'll simulate Stripe integration
// In production, replace with actual Stripe SDK calls
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
let stripe = null;
if (STRIPE_SECRET_KEY) {
    // eslint-disable-next-line global-require
    stripe = require('stripe')(STRIPE_SECRET_KEY);
}

// @desc    Get user wallet balance
// @route   GET /api/payments/wallet
// @access  Private
exports.getWallet = asyncHandler(async (req, res) => {
    const wallet = await Wallet.getOrCreate(req.user.id);
    res.json({
        balance: wallet.balance,
        pendingBalance: wallet.pendingBalance,
        currency: wallet.currency,
        stripeAccountId: wallet.stripeAccountId,
    });
});

// @desc    Create payment intent for escrow (buyer initiates purchase)
// @route   POST /api/payments/escrow/create
// @access  Private
exports.createEscrowIntent = asyncHandler(async (req, res) => {
    const { postId } = req.body;

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
        throw new ApiError(400, 'Valid postId is required');
    }

    const post = await Post.findById(postId).populate('user', '_id displayName');
    if (!post) {
        throw new ApiError(404, 'Post not found');
    }

    if (!post.isActive) {
        throw new ApiError(400, 'Post is not active');
    }

    if (post.acceptInAppPayment === false) {
        throw new ApiError(400, 'This listing does not accept in-app payments');
    }

    if (post.user._id.toString() === req.user.id) {
        throw new ApiError(400, 'Cannot purchase your own post');
    }

    const amount = post.price || 0;
    if (amount <= 0) {
        throw new ApiError(400, 'Post has no price set');
    }

    // Check for existing active escrow
    const existingEscrow = await EscrowTransaction.getActiveForPost(postId, req.user.id);
    if (existingEscrow) {
        throw new ApiError(409, 'You already have an active escrow for this post');
    }

    // Check buyer's wallet balance
    const buyerWallet = await Wallet.getOrCreate(req.user.id);
    if (buyerWallet.balance < amount) {
        return res.status(400).json({
            code: 'INSUFFICIENT_FUNDS',
            message: `Insufficient wallet balance. You need ₹${amount - buyerWallet.balance} more.`,
            balance: buyerWallet.balance,
            required: amount,
            shortfall: amount - buyerWallet.balance,
        });
    }

    // Create escrow transaction in pending state
    const escrow = await EscrowTransaction.create({
        post: postId,
        buyer: req.user.id,
        seller: post.user._id,
        amount,
        currency: 'INR',
        status: 'pending',
        metadata: new Map([
            ['postTitle', post.title],
            ['postType', post.type],
        ]),
    });

    // Reserve funds in buyer's wallet
    await buyerWallet.reserveFunds(amount);

    // If Stripe is configured, create a Payment Intent
    let clientSecret = null;
    if (stripe) {
        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount * 100, // Stripe expects paise/cents
                currency: 'inr',
                metadata: {
                    escrowId: escrow._id.toString(),
                    postId: postId,
                    buyerId: req.user.id,
                    sellerId: post.user._id.toString(),
                },
                automatic_payment_methods: { enabled: true },
            });
            clientSecret = paymentIntent.client_secret;
            escrow.stripePaymentIntentId = paymentIntent.id;
            escrow.status = 'funded';
            escrow.fundedAt = new Date();
            await escrow.save();
        } catch (stripeErr) {
            console.error('Stripe error:', stripeErr);
            // Refund the reserved funds on Stripe failure
            await buyerWallet.refundEscrow(amount);
            await escrow.deleteOne();
            throw new ApiError(500, 'Payment processing failed. Please try again.');
        }
    } else {
        // Development mode - auto-fund without Stripe
        escrow.status = 'funded';
        escrow.fundedAt = new Date();
        await escrow.save();
    }

    // Notify seller
    const io = req.app.get('io');
    await createNotification(io, {
        recipient: post.user._id,
        sender: req.user.id,
        type: 'escrow_created',
        title: 'New Purchase Request',
        message: `Someone wants to purchase access to "${post.title}"`,
        link: `/post/${postId}`,
        relatedId: postId,
    });

    res.json({
        orderId: escrow._id,
        escrowId: escrow._id,
        clientSecret,
        amount,
        currency: 'INR',
        post: {
            id: post._id,
            title: post.title,
            price: post.price,
        },
        seller: {
            id: post.user._id,
            displayName: post.user.displayName,
        },
        devMode: !stripe,
    });
});

// @desc    Confirm escrow payment (webhook or manual confirm)
// @route   POST /api/payments/escrow/:escrowId/confirm
// @access  Private (buyer) or Webhook
exports.confirmEscrow = asyncHandler(async (req, res) => {
    const { escrowId } = req.params;
    const { paymentIntentId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(escrowId)) {
        throw new ApiError(400, 'Invalid escrowId');
    }

    const escrow = await EscrowTransaction.findById(escrowId)
        .populate('post', 'title price')
        .populate('seller', 'displayName');

    if (!escrow) {
        throw new ApiError(404, 'Escrow not found');
    }

    if (escrow.buyer.toString() !== req.user.id) {
        throw new ApiError(403, 'Not authorized');
    }

    if (escrow.status !== 'pending' && escrow.status !== 'funded') {
        throw new ApiError(400, `Escrow cannot be confirmed in ${escrow.status} state`);
    }

    // If Stripe is configured, verify payment
    if (stripe && paymentIntentId) {
        try {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            if (paymentIntent.status !== 'succeeded') {
                throw new ApiError(400, 'Payment not completed');
            }
            if (paymentIntent.metadata.escrowId !== escrowId) {
                throw new ApiError(400, 'Payment intent mismatch');
            }
        } catch (stripeErr) {
            console.error('Stripe verification error:', stripeErr);
            throw new ApiError(400, 'Payment verification failed');
        }
    }

    // Update escrow status
    escrow.status = 'held';
    await escrow.save();

    // Notify seller
    const io = req.app.get('io');
    await createNotification(io, {
        recipient: escrow.seller._id,
        sender: req.user.id,
        type: 'escrow_funded',
        title: 'Payment Received',
        message: `Escrow funded for "${escrow.post.title}" - contact access granted`,
        link: `/post/${escrow.post._id}`,
        relatedId: escrow.post._id,
        conversationId: null, // Will be created when chat starts
    });

    // Notify buyer
    await createNotification(io, {
        recipient: req.user.id,
        sender: escrow.seller._id,
        type: 'escrow_funded',
        title: 'Purchase Confirmed',
        message: `You can now contact the seller for "${escrow.post.title}"`,
        link: `/post/${escrow.post._id}`,
        relatedId: escrow.post._id,
    });

    res.json({
        escrowId: escrow._id,
        status: escrow.status,
        message: 'Payment confirmed. Contact access granted.',
    });
});

// @desc    Release escrow to seller (seller confirms delivery)
// @route   POST /api/payments/escrow/:escrowId/release
// @access  Private (seller)
exports.releaseEscrow = asyncHandler(async (req, res) => {
    const { escrowId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(escrowId)) {
        throw new ApiError(400, 'Invalid escrowId');
    }

    const escrow = await EscrowTransaction.findById(escrowId)
        .populate('post', 'title')
        .populate('buyer', 'displayName')
        .populate('seller', 'displayName');

    if (!escrow) {
        throw new ApiError(404, 'Escrow not found');
    }

    const isBuyer = escrow.buyer._id.toString() === req.user.id;
    const isSeller = escrow.seller._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isSeller && !isAdmin) {
        throw new ApiError(403, 'Not authorized to release escrow');
    }

    if (escrow.status !== 'held' && escrow.status !== 'funded') {
        throw new ApiError(400, `Escrow cannot be released in ${escrow.status} state`);
    }

    // Transfer funds: deduct pending from buyer and credit seller balance
    const buyerWallet = await Wallet.getOrCreate(escrow.buyer._id);
    const sellerWallet = await Wallet.getOrCreate(escrow.seller._id);

    if (buyerWallet.pendingBalance >= escrow.amount) {
        buyerWallet.pendingBalance -= escrow.amount;
        await buyerWallet.save();
    }
    sellerWallet.balance += escrow.amount;
    await sellerWallet.save();

    // Update escrow
    escrow.status = 'released';
    escrow.releasedAt = new Date();
    await escrow.save();

    // If Stripe, create transfer to seller's Stripe Connect account
    if (stripe && escrow.seller.stripeAccountId) {
        try {
            await stripe.transfers.create({
                amount: escrow.amount * 100,
                currency: 'inr',
                destination: escrow.seller.stripeAccountId,
                metadata: {
                    escrowId: escrowId,
                    postId: escrow.post._id.toString(),
                },
            });
        } catch (stripeErr) {
            console.error('Stripe transfer error:', stripeErr);
            // Log but don't fail - wallet already updated
        }
    }

    // Notify buyer
    const io = req.app.get('io');
    await createNotification(io, {
        recipient: escrow.buyer._id,
        sender: req.user.id,
        type: 'escrow_released',
        title: 'Purchase Completed',
        message: `Seller has completed the transaction for "${escrow.post.title}"`,
        link: `/post/${escrow.post._id}`,
        relatedId: escrow.post._id,
    });

    res.json({
        escrowId: escrow._id,
        status: escrow.status,
        message: 'Funds released to seller',
    });
});

// @desc    Refund escrow to buyer (buyer cancels or dispute resolved)
// @route   POST /api/payments/escrow/:escrowId/refund
// @access  Private (buyer or admin)
exports.refundEscrow = asyncHandler(async (req, res) => {
    const { escrowId } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(escrowId)) {
        throw new ApiError(400, 'Invalid escrowId');
    }

    const escrow = await EscrowTransaction.findById(escrowId)
        .populate('post', 'title')
        .populate('seller', 'displayName');

    if (!escrow) {
        throw new ApiError(404, 'Escrow not found');
    }

    // Allow buyer to refund if still pending/funded, or admin for any state
    const isBuyer = escrow.buyer.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isAdmin) {
        throw new ApiError(403, 'Not authorized to refund');
    }

    if (isBuyer && escrow.status !== 'pending' && escrow.status !== 'funded') {
        throw new ApiError(400, `Cannot refund escrow in ${escrow.status} state`);
    }

    // Refund to buyer's wallet
    const buyerWallet = await Wallet.getOrCreate(escrow.buyer);
    await buyerWallet.refundEscrow(escrow.amount);

    // Update escrow
    escrow.status = 'refunded';
    escrow.refundedAt = new Date();
    if (reason) escrow.disputeReason = reason;
    await escrow.save();

    // Notify seller
    const io = req.app.get('io');
    await createNotification(io, {
        recipient: escrow.seller._id,
        sender: req.user.id,
        type: 'escrow_refunded',
        title: 'Payment Refunded',
        message: `Escrow refunded for "${escrow.post.title}"${reason ? `: ${reason}` : ''}`,
        link: `/post/${escrow.post._id}`,
        relatedId: escrow.post._id,
    });

    res.json({
        escrowId: escrow._id,
        status: escrow.status,
        message: 'Funds refunded to buyer',
    });
});

// @desc    Get active escrow for a specific post (for the logged-in buyer)
// @route   GET /api/payments/escrow/post/:postId
// @access  Private
exports.getActiveEscrowForPost = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
        throw new ApiError(400, 'Invalid postId');
    }

    const escrow = await EscrowTransaction.getActiveForPost(postId, req.user.id);
    if (!escrow) {
        return res.json({ hasActiveEscrow: false, escrow: null });
    }

    return res.json({
        hasActiveEscrow: true,
        escrow: {
            id: escrow._id,
            status: escrow.status,
            amount: escrow.amount,
            currency: escrow.currency,
            createdAt: escrow.createdAt,
            fundedAt: escrow.fundedAt,
        },
    });
});

// @desc    Get escrow history for user
// @route   GET /api/payments/escrow/history
// @access  Private
exports.getEscrowHistory = asyncHandler(async (req, res) => {
    const { role } = req.query; // 'buyer', 'seller', or 'both'
    const escrows = await EscrowTransaction.getHistoryForUser(req.user.id, role || 'both');
    res.json(escrows);
});

// @desc    Get single escrow details
// @route   GET /api/payments/escrow/:escrowId
// @access  Private
exports.getEscrow = asyncHandler(async (req, res) => {
    const { escrowId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(escrowId)) {
        throw new ApiError(400, 'Invalid escrowId');
    }

    const escrow = await EscrowTransaction.findById(escrowId)
        .populate('post', 'title images price type location')
        .populate('buyer', 'displayName avatar')
        .populate('seller', 'displayName avatar');

    if (!escrow) {
        throw new ApiError(404, 'Escrow not found');
    }

    // Authorization: only buyer, seller, or admin
    const isBuyer = escrow.buyer._id.toString() === req.user.id;
    const isSeller = escrow.seller._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isSeller && !isAdmin) {
        throw new ApiError(403, 'Not authorized');
    }

    res.json(escrow);
});

// @desc    Top up wallet (create payment intent for adding funds)
// @route   POST /api/payments/wallet/topup
// @access  Private
exports.topupWallet = asyncHandler(async (req, res) => {
    const { amount } = req.body;

    if (!amount || amount < 10) {
        throw new ApiError(400, 'Minimum top-up amount is ₹10');
    }

    if (amount > 50000) {
        throw new ApiError(400, 'Maximum top-up amount is ₹50,000');
    }

    let clientSecret = null;
    if (stripe) {
        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount * 100,
                currency: 'inr',
                metadata: {
                    userId: req.user.id,
                    type: 'wallet_topup',
                },
                automatic_payment_methods: { enabled: true },
            });
            clientSecret = paymentIntent.client_secret;
        } catch (stripeErr) {
            console.error('Stripe topup error:', stripeErr);
            throw new ApiError(500, 'Failed to create top-up intent');
        }
    }

    res.json({
        clientSecret,
        amount,
        currency: 'INR',
        devMode: !stripe,
    });
});

// @desc    Confirm wallet top-up
// @route   POST /api/payments/wallet/topup/confirm
// @access  Private
exports.confirmTopup = asyncHandler(async (req, res) => {
    const { paymentIntentId, amount } = req.body;

    if (!amount || amount < 10) {
        throw new ApiError(400, 'Invalid amount');
    }

    // If Stripe, verify payment
    if (stripe && paymentIntentId) {
        try {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            if (paymentIntent.status !== 'succeeded') {
                throw new ApiError(400, 'Payment not completed');
            }
            if (paymentIntent.metadata.userId !== req.user.id) {
                throw new ApiError(400, 'Payment intent mismatch');
            }
            if (paymentIntent.metadata.type !== 'wallet_topup') {
                throw new ApiError(400, 'Invalid payment type');
            }
        } catch (stripeErr) {
            console.error('Stripe topup verification error:', stripeErr);
            throw new ApiError(400, 'Payment verification failed');
        }
    }

    // Add funds to wallet
    const wallet = await Wallet.getOrCreate(req.user.id);
    await wallet.addFunds(amount);

    // Notify user
    const io = req.app.get('io');
    await createNotification(io, {
        recipient: req.user.id,
        sender: req.user.id,
        type: 'wallet_topup',
        title: 'Wallet Topped Up',
        message: `₹${amount} added to your wallet`,
        link: '/wallet',
        relatedId: wallet._id.toString(),
    });

    res.json({
        balance: wallet.balance,
        pendingBalance: wallet.pendingBalance,
        message: 'Wallet topped up successfully',
    });
});

// @desc    Connect Stripe account (for sellers)
// @route   POST /api/payments/stripe/connect
// @access  Private
exports.createStripeConnect = asyncHandler(async (req, res) => {
    if (!stripe) {
        throw new ApiError(501, 'Stripe not configured');
    }

    const user = await User.findById(req.user.id);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    let wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
        wallet = await Wallet.getOrCreate(req.user.id);
    }

    let accountId = wallet.stripeAccountId;
    if (!accountId) {
        // Create Stripe Connect Express account
        const account = await stripe.accounts.create({
            type: 'express',
            country: 'IN',
            email: user.email,
            capabilities: {
                transfers: { requested: true },
            },
            business_type: 'individual',
        });
        accountId = account.id;
        wallet.stripeAccountId = accountId;
        await wallet.save();
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${process.env.CLIENT_URL_DEV}/wallet?stripe=refresh`,
        return_url: `${process.env.CLIENT_URL_DEV}/wallet?stripe=success`,
        type: 'account_onboarding',
    });

    res.json({
        accountId,
        onboardingUrl: accountLink.url,
    });
});

// @desc    Get Stripe Connect account status
// @route   GET /api/payments/stripe/connect/status
// @access  Private
exports.getStripeConnectStatus = asyncHandler(async (req, res) => {
    const wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet || !wallet.stripeAccountId) {
        return res.json({ connected: false });
    }

    if (!stripe) {
        return res.json({ connected: true, details: null, devMode: true });
    }

    try {
        const account = await stripe.accounts.retrieve(wallet.stripeAccountId);
        res.json({
            connected: true,
            details: {
                chargesEnabled: account.charges_enabled,
                payoutsEnabled: account.payouts_enabled,
                detailsSubmitted: account.details_submitted,
                requirements: account.requirements,
            },
        });
    } catch (stripeErr) {
        console.error('Stripe account retrieve error:', stripeErr);
        res.json({ connected: true, details: null, error: 'Failed to fetch status' });
    }
});

// @desc    Create Razorpay Order for listing or direct payment
// @route   POST /api/payments/razorpay/create-order
// @access  Private
exports.createRazorpayOrder = asyncHandler(async (req, res) => {
    const { postId, amount: requestedAmount, paymentTiming, recipientId } = req.body;

    let targetAmount = requestedAmount;
    let post = null;
    let sellerId = recipientId;

    if (postId) {
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            throw new ApiError(400, 'Invalid postId');
        }
        post = await Post.findById(postId).populate('user', '_id displayName');
        if (!post) {
            throw new ApiError(404, 'Post not found');
        }
        if (post.acceptInAppPayment === false) {
            throw new ApiError(400, 'This listing does not accept in-app payments');
        }
        if (post.user._id.toString() === req.user.id) {
            throw new ApiError(400, 'Cannot purchase your own post');
        }
        if (!targetAmount) {
            targetAmount = post.price;
        }
        sellerId = post.user._id.toString();
    }

    const numericAmount = parseFloat(targetAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
        throw new ApiError(400, 'Valid amount is required');
    }

    const amountInPaise = Math.round(numericAmount * 100);
    const receipt = `rcpt_${Date.now()}_${req.user.id.substring(Math.max(0, req.user.id.length - 6))}`;

    const order = await razorpayConfig.createOrder({
        amountInPaise,
        currency: 'INR',
        receipt,
        notes: {
            postId: postId || '',
            buyerId: req.user.id,
            sellerId: sellerId || '',
            paymentTiming: paymentTiming || (post ? post.paymentTiming : 'flexible') || 'escrow',
        },
    });

    res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: razorpayConfig.getPublicKey(),
        isMock: Boolean(order.isMock),
        receipt,
    });
});

// @desc    Verify Razorpay payment and create Escrow / release funds
// @route   POST /api/payments/razorpay/verify
// @access  Private
exports.verifyRazorpayPayment = asyncHandler(async (req, res) => {
    const { orderId, paymentId, signature, postId, amount: requestedAmount, paymentTiming, recipientId } = req.body;

    if (!orderId || !paymentId) {
        throw new ApiError(400, 'orderId and paymentId are required');
    }

    const isValid = razorpayConfig.verifyPaymentSignature({
        orderId,
        paymentId,
        signature: signature || '',
    });

    if (!isValid) {
        throw new ApiError(400, 'Invalid payment signature');
    }

    let post = null;
    let sellerId = recipientId;
    let amount = parseFloat(requestedAmount);

    if (postId && mongoose.Types.ObjectId.isValid(postId)) {
        post = await Post.findById(postId).populate('user', '_id displayName');
        if (post) {
            sellerId = post.user._id.toString();
            if (!amount) amount = post.price;
        }
    }

    if (!sellerId) {
        throw new ApiError(400, 'Seller / recipient could not be resolved');
    }

    if (!amount || isNaN(amount) || amount <= 0) {
        throw new ApiError(400, 'Valid amount is required');
    }

    const timing = paymentTiming || (post ? post.paymentTiming : 'flexible') || 'escrow';
    const isAdvance = timing === 'advance';

    // Create escrow transaction record
    const escrow = await EscrowTransaction.create({
        post: post ? post._id : undefined,
        buyer: req.user.id,
        seller: sellerId,
        amount,
        currency: 'INR',
        gateway: 'razorpay',
        paymentTiming: isAdvance ? 'advance' : 'escrow',
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature || 'mock_sig',
        status: isAdvance ? 'released' : 'funded',
        fundedAt: new Date(),
        releasedAt: isAdvance ? new Date() : undefined,
        metadata: new Map([
            ['postTitle', post ? post.title : 'Direct Payment'],
            ['paymentMethod', 'razorpay_upi_netbanking'],
        ]),
    });

    // If advance payment timing, instantly credit seller's wallet
    if (isAdvance) {
        const sellerWallet = await Wallet.getOrCreate(sellerId);
        sellerWallet.balance += amount;
        await sellerWallet.save();
    }

    // Send notifications
    const io = req.app.get('io');
    const itemTitle = post ? `"${post.title}"` : 'item/service';

    if (isAdvance) {
        await createNotification(io, {
            recipient: sellerId,
            sender: req.user.id,
            type: 'payment_received',
            title: 'Advance Payment Received!',
            message: `You received an advance payment of ₹${amount} for ${itemTitle} via UPI / Razorpay.`,
            link: post ? `/post/${post._id}` : '/wallet',
            relatedId: post ? post._id : undefined,
        });
    } else {
        await createNotification(io, {
            recipient: sellerId,
            sender: req.user.id,
            type: 'escrow_funded',
            title: 'Payment Held in Escrow',
            message: `₹${amount} paid via UPI / Razorpay and held safely in Escrow for ${itemTitle}. Deliver or complete exchange to receive payout.`,
            link: post ? `/post/${post._id}` : '/wallet',
            relatedId: post ? post._id : undefined,
        });
    }

    res.json({
        success: true,
        escrowId: escrow._id,
        status: escrow.status,
        paymentTiming: escrow.paymentTiming,
        message: isAdvance
            ? 'Advance payment transferred directly to seller.'
            : 'Payment safely held in Escrow until product is received.',
    });
});

// @desc    Get user payout details (UPI / Bank Account)
// @route   GET /api/payments/payout-details
// @access  Private
exports.getPayoutDetails = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('payoutDetails displayName email');
    if (!user) {
        throw new ApiError(404, 'User not found');
    }
    res.json({
        success: true,
        payoutDetails: user.payoutDetails || {
            upiId: '',
            accountHolderName: '',
            accountNumber: '',
            ifscCode: '',
            isVerified: false,
        },
    });
});

// @desc    Update user payout details (UPI / Bank Account)
// @route   POST /api/payments/payout-details
// @access  Private
exports.updatePayoutDetails = asyncHandler(async (req, res) => {
    const { upiId, accountHolderName, accountNumber, ifscCode } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    if (upiId && !/^[\w.-]+@[\w.-]+$/.test(upiId.trim())) {
        throw new ApiError(400, 'Invalid UPI ID format (e.g., username@bank)');
    }

    if (ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.trim().toUpperCase())) {
        throw new ApiError(400, 'Invalid IFSC code format (e.g., HDFC0001234)');
    }

    user.payoutDetails = {
        upiId: (upiId || '').trim(),
        accountHolderName: (accountHolderName || user.displayName || '').trim(),
        accountNumber: (accountNumber || '').trim(),
        ifscCode: (ifscCode || '').trim().toUpperCase(),
        isVerified: Boolean(upiId || (accountNumber && ifscCode)),
        updatedAt: new Date(),
    };

    await user.save();

    res.json({
        success: true,
        message: 'Payout details saved successfully',
        payoutDetails: user.payoutDetails,
    });
});
