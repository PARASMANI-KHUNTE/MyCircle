const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Order, SellerAccount, PaymentAuditLog } = require('./models/Payment');
const { attachRequestContext, handleServiceError, requireAuth, parsePagination } = require('../../Common/security');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(attachRequestContext);

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

// Create Payment Intent & Escrow Order
app.post('/api/payments/create-intent', requireAuth, async (req, res) => {
    try {
        const { postId, sellerId, itemTitle, amount, currency = 'usd' } = req.body;

        if (!postId || !sellerId || !itemTitle || amount === undefined) {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_ERROR',
                message: 'Post ID, Seller ID, Item Title, and Amount are required',
                requestId: req.requestId,
            });
        }

        const numericAmount = parseFloat(amount);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_ERROR',
                message: 'Amount must be a positive number',
                requestId: req.requestId,
            });
        }

        if (String(sellerId) === String(req.user.id)) {
            return res.status(400).json({
                success: false,
                code: 'BAD_REQUEST',
                message: 'Cannot purchase your own marketplace post',
                requestId: req.requestId,
            });
        }

        const commissionRate = parseFloat(process.env.COMMISSION_RATE || '0.05');
        const platformFee = Math.round(numericAmount * commissionRate * 100) / 100;
        const sellerAmount = Math.round((numericAmount - platformFee) * 100) / 100;

        const mockIntentId = `pi_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const mockClientSecret = `${mockIntentId}_secret_${Math.random().toString(36).substring(2, 9)}`;

        const order = await Order.create({
            buyerId: req.user.id,
            sellerId: String(sellerId),
            postId: String(postId),
            itemTitle: String(itemTitle).trim(),
            amount: numericAmount,
            currency: String(currency).toLowerCase(),
            platformFee,
            sellerAmount,
            status: 'payment_pending',
            paymentIntentId: mockIntentId,
        });

        await PaymentAuditLog.create({
            orderId: order._id.toString(),
            action: 'ORDER_INITIATED',
            newStatus: 'payment_pending',
            metadata: { buyerId: req.user.id, amount: numericAmount, platformFee },
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
        return handleServiceError(res, err, req);
    }
});

// Confirm Buyer Receipt & Release Escrow
app.post('/api/payments/orders/:orderId/confirm-delivery', requireAuth, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.orderId,
            buyerId: req.user.id,
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                code: 'NOT_FOUND',
                message: 'Order not found for current buyer',
                requestId: req.requestId,
            });
        }

        if (order.status !== 'funds_in_escrow' && order.status !== 'payment_pending') {
            return res.status(400).json({
                success: false,
                code: 'INVALID_STATE',
                message: `Cannot release escrow for order in state '${order.status}'`,
                requestId: req.requestId,
            });
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
        return handleServiceError(res, err, req);
    }
});

// Get User Orders (Purchases & Sales)
app.get('/api/payments/orders', requireAuth, async (req, res) => {
    try {
        const { role = 'buyer' } = req.query;
        const { page, limit, skip } = parsePagination(req.query, 20, 100);

        const query = role === 'seller' ? { sellerId: req.user.id } : { buyerId: req.user.id };

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Order.countDocuments(query);

        res.json({
            success: true,
            count: orders.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: orders,
        });
    } catch (err) {
        return handleServiceError(res, err, req);
    }
});

module.exports = app;
