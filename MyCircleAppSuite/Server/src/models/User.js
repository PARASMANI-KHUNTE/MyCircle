const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    googleId: {
        type: String,
        unique: true,
        sparse: true,
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
    passwordHash: {
        type: String,
    },
    passwordSalt: {
        type: String,
    },
    avatar: {
        type: String,
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'moderator'],
        default: 'user',
    },
    accountStatus: {
        type: String,
        enum: ['active', 'suspended', 'banned'],
        default: 'active',
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
        profileVisibility: { type: String, enum: ['public', 'private'], default: 'public' },
        notificationCategories: {
            contactRequests: { type: Boolean, default: true },
            messages: { type: Boolean, default: true },
            postExpiry: { type: Boolean, default: true },
        },
        quietHours: {
            enabled: { type: Boolean, default: false },
            start: { type: String, default: '22:00' },
            end: { type: String, default: '07:00' },
            timezone: { type: String, default: 'UTC' },
        },
        feedPresets: [{
            name: { type: String, required: true },
            type: { type: String, default: 'all' },
            radius: { type: Number, default: 50 },
            barterOnly: { type: Boolean, default: false },
            urgentOnly: { type: Boolean, default: false },
            location: { type: String, default: '' },
        }],
    },
    blockedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isOnline: {
        type: Boolean,
        default: false,
    },
    lastSeenAt: {
        type: Date,
    },
    pushTokens: [{
        token: {
            type: String,
            required: true,
        },
        platform: {
            type: String,
            enum: ['ios', 'android', 'web'],
            default: 'web',
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    }],
    reports: [{
        reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        category: {
            type: String,
            enum: ['spam', 'harassment', 'scam', 'impersonation', 'hate_speech', 'nudity', 'violence', 'other'],
            default: 'other'
        },
        reason: String,
        contentType: { type: String, enum: ['post', 'comment', 'chat', 'user', 'profile', 'image'] },
        contentId: mongoose.Schema.Types.ObjectId,
        createdAt: { type: Date, default: Date.now }
    }],
    stats: {
        totalPosts: { type: Number, default: 0 },
        activePosts: { type: Number, default: 0 },
        tasksCompleted: { type: Number, default: 0 },
        followingCount: { type: Number, default: 0 },
        followersCount: { type: Number, default: 0 },
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
UserSchema.index({ following: 1 });
UserSchema.index({ followers: 1 });
UserSchema.index({ isOnline: 1, lastSeenAt: -1 });
UserSchema.index({ 'pushTokens.token': 1 });

module.exports = mongoose.model('User', UserSchema);
