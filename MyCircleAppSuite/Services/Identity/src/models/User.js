const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    displayName: {
        type: String,
        required: [true, 'Display name is required'],
        trim: true,
        maxlength: [50, 'Display name cannot exceed 50 characters'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please fill a valid email address',
        ],
    },
    password: {
        type: String,
        minlength: [6, 'Password must be at least 6 characters'],
        select: false,
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },
    avatar: {
        type: String,
        default: '',
    },
    bio: {
        type: String,
        maxlength: [250, 'Bio cannot exceed 250 characters'],
        default: '',
    },
    skills: [{
        type: String,
        trim: true,
    }],
    phone: {
        type: String,
        trim: true,
        default: '',
    },
    rating: {
        type: Number,
        default: 5.0,
        min: 1,
        max: 5,
    },
    reputationScore: {
        type: Number,
        default: 100,
    },
    endorsements: [{
        skill: String,
        count: {
            type: Number,
            default: 1,
        },
        endorsedBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    blockedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    settings: {
        currency: {
            type: String,
            default: 'USD',
        },
        notifications: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: true },
        },
        privacy: {
            showPhone: { type: Boolean, default: false },
            showEmail: { type: Boolean, default: true },
        },
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastActive: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

userSchema.methods.toPublicProfile = function () {
    return {
        _id: this._id,
        displayName: this.displayName,
        email: this.settings?.privacy?.showEmail ? this.email : undefined,
        avatar: this.avatar,
        bio: this.bio,
        skills: this.skills,
        rating: this.rating,
        reputationScore: this.reputationScore,
        endorsements: this.endorsements,
        followersCount: this.followers?.length || 0,
        followingCount: this.following?.length || 0,
        createdAt: this.createdAt,
    };
};

module.exports = mongoose.model('User', userSchema);
