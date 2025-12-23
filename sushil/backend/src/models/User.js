const mongoose = require('mongoose');

const PrivacySettingsSchema = new mongoose.Schema({
    showEmail: { type: Boolean, default: false },
    showPhone: { type: Boolean, default: true },
    showLocation: { type: Boolean, default: true },
    showStats: { type: Boolean, default: true },
}, { _id: false });

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
    name: {
        type: String,
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
    avatar: String,
    coverImage: String,
    role: {
        type: String,
        enum: ['user', 'admin', 'moderator'],
        default: 'user',
    },
    bio: String,
    area: String,
    location: String,
    skills: [String],
    contactPhone: String,
    contactWhatsapp: String,
    whatsappNumber: String,
    rating: {
        type: Number,
        default: 0,
    },
    reviews: {
        type: Number,
        default: 0,
    },
    ratingCount: {
        type: Number,
        default: 0,
    },
    ratingAvg: {
        type: Number,
        default: 0,
    },
    completedDeals: {
        type: Number,
        default: 0,
    },
    responseRate: {
        type: Number,
        default: 0,
    },
    joinDate: {
        type: Date,
        default: Date.now,
    },
    stats: {
        totalPosts: { type: Number, default: 0 },
        activePosts: { type: Number, default: 0 },
        tasksCompleted: { type: Number, default: 0 },
    },
    privacy: {
        type: PrivacySettingsSchema,
        default: () => ({}),
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('User', UserSchema);
