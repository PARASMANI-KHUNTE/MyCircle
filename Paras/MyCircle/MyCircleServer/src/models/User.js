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
    stats: {
        totalPosts: { type: Number, default: 0 },
        activePosts: { type: Number, default: 0 },
        tasksCompleted: { type: Number, default: 0 },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('User', UserSchema);
