const mongoose = require('mongoose');

const ContactRequestSchema = new mongoose.Schema({
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'approved', 'rejected', 'expired', 'completed', 'canceled'],
        default: 'pending',
    },
    message: {
        type: String,
        maxlength: 200,
    },
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        default: null,
    },
    expiresAt: {
        type: Date,
        index: true, // For efficient cron queries
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    acceptedAt: {
        type: Date,
    },
    completedAt: {
        type: Date,
    },
    completionMarkedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    ratings: [{
        fromUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        toUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['requester', 'recipient'],
            required: true
        },
        score: {
            type: Number,
            min: 1,
            max: 5,
            required: true
        },
        review: {
            type: String,
            trim: true,
            maxlength: 300
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
});

// One *pending* request per (post, requester). Terminal statuses fall out of the
// partial index so users can re-request after rejection/expiry/cancellation
// (subject to the 24h cooldown enforced in contactController.createRequest).
// NOTE: databases created before this change hold a plain unique index with the
// same name; run `db.contactrequests.dropIndex("post_1_requester_1")` once
// before deploying so the partial index can build.
ContactRequestSchema.index(
    { post: 1, requester: 1 },
    { unique: true, partialFilterExpression: { status: 'pending' } }
);
ContactRequestSchema.index({ post: 1, status: 1, createdAt: -1 });
ContactRequestSchema.index({ requester: 1, recipient: 1, status: 1 });
ContactRequestSchema.index({ recipient: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('ContactRequest', ContactRequestSchema);
