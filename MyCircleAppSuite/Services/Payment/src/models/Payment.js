const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    buyerId: {
        type: String,
        required: true,
        index: true,
    },
    sellerId: {
        type: String,
        required: true,
        index: true,
    },
    postId: {
        type: String,
        required: true,
        index: true,
    },
    itemTitle: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        default: 'usd',
    },
    platformFee: {
        type: Number,
        required: true,
    },
    sellerAmount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['initiated', 'payment_pending', 'funds_in_escrow', 'buyer_confirmed', 'seller_paid', 'disputed', 'refunded'],
        default: 'initiated',
        index: true,
    },
    paymentIntentId: {
        type: String,
        sparse: true,
        index: true,
    },
    payoutTransferId: {
        type: String,
        default: null,
    },
    disputeReason: {
        type: String,
        default: null,
    },
    escrowReleasedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ sellerId: 1, createdAt: -1 });

const sellerAccountSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    stripeAccountId: {
        type: String,
        required: true,
        unique: true,
    },
    payoutsEnabled: {
        type: Boolean,
        default: false,
    },
    detailsSubmitted: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

const auditLogSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        index: true,
    },
    action: {
        type: String,
        required: true,
    },
    previousStatus: String,
    newStatus: String,
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
});

module.exports = {
    Order: mongoose.model('Order', orderSchema),
    SellerAccount: mongoose.model('SellerAccount', sellerAccountSchema),
    PaymentAuditLog: mongoose.model('PaymentAuditLog', auditLogSchema),
};
