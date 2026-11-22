const mongoose = require('mongoose');

const REPORT_CATEGORIES = ['spam', 'harassment', 'scam', 'impersonation', 'hate_speech', 'nudity', 'violence', 'other'];
const SUBJECT_TYPES = ['post', 'comment', 'chat', 'profile', 'image', 'user', 'other'];

const SupportSubmissionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['report', 'help', 'feedback'],
        required: true,
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved', 'dismissed'],
        default: 'open',
    },
    // Always the authenticated submitter. Never serialized on public endpoints.
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    reportedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    subjectType: {
        type: String,
        enum: SUBJECT_TYPES,
        default: 'other',
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    category: {
        type: String,
        enum: REPORT_CATEGORIES,
        default: 'other',
    },
    message: {
        type: String,
        required: true,
        maxlength: 2000,
    },
    response: {
        type: String,
        default: '',
        maxlength: 2000,
    },
    respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    respondedAt: {
        type: Date,
    },
}, { timestamps: true });

SupportSubmissionSchema.index({ type: 1, status: 1, createdAt: -1 });
SupportSubmissionSchema.index({ reporter: 1, createdAt: -1 });

module.exports = mongoose.model('SupportSubmission', SupportSubmissionSchema);
