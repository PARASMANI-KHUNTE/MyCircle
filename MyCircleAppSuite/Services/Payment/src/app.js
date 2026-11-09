const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const { Order, SellerAccount, PaymentAuditLog } = require('./models/Payment');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Tracing & Request Context
app.use((req, res, next) => {
    req.requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    res.setHeader('x-request-id', req.requestId);
    next();
});

// Operational Probes
app.get('/health/live', (req, res) => {
    res.json({
        service: 'payment',
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

app.get('/health/ready', (req, res) => {
    res.json({
        service: 'payment',
        status: 'ready',
        timestamp: new Date().toISOString(),
    });
});

// Auth Middleware (Verifies Identity Token)
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authorization required' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'identity_service_default_secret_key_12345';
        const decoded = jwt.verify(token, secret);
        req.user = {
            id: decoded.sub,
            email: decoded.email,
            displayName: decoded.displayName,
        };
        next();
    } catch {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

// Create Payment Intent & Escrow Order
app.post('/api/payments/create-intent', authenticate, async (req, res) => {
    try {
        const { postId, sellerId, itemTitle, amount, currency = 'usd' } = req.body;

        if (!postId || !sellerId || !itemTitle || !amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid order parameters' });
        }

        if (sellerId === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot buy your own product' });
        }

        const commissionRate = parseFloat(process.env.COMMISSION_RATE || '0.05');
        const platformFee = Math.round(amount * commissionRate * 100) / 100;
        const sellerAmount = Math.round((amount - platformFee) * 100) / 100;

        // In production, instantiate Stripe PaymentIntent here.
        // Simulated client secret for test & mock environments
        const mockIntentId = `pi_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const mockClientSecret = `${mockIntentId}_secret_${Math.random().toString(36).substring(2, 9)}`;

        const order = await Order.create({
            buyerId: req.user.id,
            sellerId,
            postId,
            itemTitle,
            amount,
            currency: currency.toLowerCase(),
            platformFee,
            sellerAmount,
            status: 'payment_pending',
            paymentIntentId: mockIntentId,
        });

        await PaymentAuditLog.create({
            orderId: order._id.toString(),
            action: 'ORDER_INITIATED',
            newStatus: 'payment_pending',
            metadata: { buyerId: req.user.id, amount, platformFee },
        });

        res.status(201).json({
            success: true,
            orderId: order._id,
            clientSecret: mockClientSecret,
            amount: order.amount,
            platformFee: order.platformFee,
            sellerAmount: order.sellerAmount,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Confirm Buyer Receipt & Release Escrow
app.post('/api/payments/orders/:orderId/confirm-delivery', authenticate, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.orderId,
            buyerId: req.user.id,
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.status !== 'funds_in_escrow' && order.status !== 'payment_pending') {
            return res.status(400).json({ success: false, message: `Cannot release escrow for order in state '${order.status}'` });
        }

        const prevStatus = order.status;
        order.status = 'seller_paid';
        order.escrowReleasedAt = new Date();
        order.payoutTransferId = `tr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        await order.save();

        await PaymentAuditLog.create({
            orderId: order._id.toString(),
            action: 'ESCROW_RELEASED',
            previousStatus: prevStatus,
            newStatus: 'seller_paid',
            metadata: { releasedBy: req.user.id, payoutTransferId: order.payoutTransferId },
        });

        res.json({
            success: true,
            message: 'Delivery confirmed and funds transferred to seller',
            order,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get User Orders (Purchases & Sales)
app.get('/api/payments/orders', authenticate, async (req, res) => {
    try {
        const { role = 'buyer' } = req.query;
        const query = role === 'seller' ? { sellerId: req.user.id } : { buyerId: req.user.id };

        const orders = await Order.find(query).sort({ createdAt: -1 });
        res.json({ success: true, count: orders.length, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = app;
