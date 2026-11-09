const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    // Reporter (user who filed the report)
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // Reported user (user being reported)
    reportedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // Category of the report
    category: {
        type: String,
        enum: ['spam', 'harassment', 'scam', 'impersonation', 'hate_speech', 'nudity', 'violence', 'other'],
        required: true,
    },
    // Type of content being reported
    contentType: {
        type: String,
        enum: ['post', 'comment', 'chat', 'user', 'profile', 'image'],
        required: true,
    },
    // ID of the reported content
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    // Optional content snapshot for context
    content: {
        type: mongoose.Schema.Types.Mixed,
    },
    // Detailed reason from reporter
    reason: {
        type: String,
        required: true,
        maxlength: 2000,
    },
    // Status of the report
    status: {
        type: String,
        enum: ['pending', 'under_review', 'resolved', 'dismissed', 'escalated'],
        default: 'pending',
    },
    // Admin who reviewed
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    reviewedAt: Date,
    resolvedAt: Date,
    dismissedAt: Date,
    escalatedAt: Date,
    // Resolution notes
    resolutionNotes: String,
    // Priority
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
    },
}, { timestamps: true });

// Indexes
ReportSchema.index({ reporter: 1, createdAt: -1 });
ReportSchema.index({ reportedUser: 1, createdAt: -1 });
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ category: 1 });
ReportSchema.index({ contentType: 1, contentId: 1 });

module.exports = mongoose.model('Report', ReportSchema);