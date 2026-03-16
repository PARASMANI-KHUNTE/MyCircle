const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    googleId: {
        type: String,
        required: true,
        unique: true,
    },
    displayName: {
        type: String,
        required: true,
    },
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    avatar: {
        type: String,
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'moderator'],
        default: 'user',
    },
    bio: String,
    location: String,
    skills: [String],
    skillEndorsements: [{
        skill: String,
        count: { type: Number, default: 0 },
        endorsedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }],
    contactPhone: String,
    contactWhatsapp: String,
    rating: {
        type: Number,
        default: 0,
    },
    reviews: {
        type: Number,
        default: 0,
    },
    preferences: {
        emailNotifications: { type: Boolean, default: true },
        profileVisibility: { type: String, enum: ['public', 'private'], default: 'public' }
    },
    blockedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    reports: [{
        reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: String,
        contentType: { type: String, enum: ['post', 'comment', 'chat', 'user'] },
        contentId: mongoose.Schema.Types.ObjectId,
        createdAt: { type: Date, default: Date.now }
    }],
    stats: {
        totalPosts: { type: Number, default: 0 },
        activePosts: { type: Number, default: 0 },
        tasksCompleted: { type: Number, default: 0 },
    },
    reputation: {
        trustScore: { type: Number, default: 50 },
        reviewsCount: { type: Number, default: 0 },
        isVerified: { type: Boolean, default: false }
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

UserSchema.index({ displayName: 'text' });
UserSchema.index({ skills: 1 });
UserSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', UserSchema);
