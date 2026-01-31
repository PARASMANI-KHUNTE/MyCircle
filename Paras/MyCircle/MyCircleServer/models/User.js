const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    displayName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    photoURL: String,
    googleId: String,
    bio: { type: String, default: '' },
    skills: [String],
    location: String,
    locationCoords: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
    },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    isProfessional: { type: Boolean, default: false },
    stats: {
        endorsements: { type: Number, default: 0 },
        rating: { type: Number, default: 0 },
        reviewsCount: { type: Number, default: 0 }
    },
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reportedBy: [{
        reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: String,
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

UserSchema.index({ locationCoords: '2dsphere' });

module.exports = mongoose.model('User', UserSchema);
