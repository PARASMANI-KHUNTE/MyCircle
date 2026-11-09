const mongoose = require('mongoose');

const EscrowTransactionSchema = new mongoose.Schema({
    // Reference to the post
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    // Buyer (user purchasing access)
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // Seller (post owner)
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // Amount in smallest currency unit (paise for INR)
    amount: {
        type: Number,
        required: true,
        min: 1,
    },
    currency: {
        type: String,
        default: 'INR',
    },
    // Status of the escrow
    status: {
        type: String,
        enum: ['pending', 'funded', 'held', 'released', 'refunded', 'disputed', 'cancelled'],
        default: 'pending',
    },
    // Stripe Payment Intent ID for tracking
    stripePaymentIntentId: {
        type: String,
    },
    // Stripe Transfer ID when released to seller
    stripeTransferId: {
        type: String,
    },
    // Timestamps for escrow lifecycle
    fundedAt: {
        type: Date,
    },
    releasedAt: {
        type: Date,
    },
    refundedAt: {
        type: Date,
    },
    disputedAt: {
        type: Date,
    },
    // Dispute info
    disputeReason: {
        type: String,
    },
    disputeResolvedAt: {
        type: Date,
    },
    disputeResolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    // Metadata
    metadata: {
        type: Map,
        of: String,
    },
}, { timestamps: true });

// Indexes for common queries
EscrowTransactionSchema.index({ buyer: 1, status: 1 });
EscrowTransactionSchema.index({ seller: 1, status: 1 });
EscrowTransactionSchema.index({ post: 1, status: 1 });
EscrowTransactionSchema.index({ status: 1 });
EscrowTransactionSchema.index({ createdAt: -1 });

// Static method to get active escrow for a post
EscrowTransactionSchema.statics.getActiveForPost = async function (postId, buyerId) {
    return this.findOne({
        post: postId,
        buyer: buyerId,
        status: { $in: ['pending', 'funded', 'held'] },
    }).sort({ createdAt: -1 });
};

// Static method to get escrow history for user
EscrowTransactionSchema.statics.getHistoryForUser = async function (userId, role = 'both') {
    const query = {};
    if (role === 'buyer') {
        query.buyer = userId;
    } else if (role === 'seller') {
        query.seller = userId;
    } else {
        query.$or = [{ buyer: userId }, { seller: userId }];
    }
    return this.find(query)
        .populate('post', 'title images price type')
        .populate('buyer', 'displayName avatar')
        .populate('seller', 'displayName avatar')
        .sort({ createdAt: -1 });
};

module.exports = mongoose.model('EscrowTransaction', EscrowTransactionSchema);