const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['job', 'service', 'sell', 'rent', 'barter'],
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
    },
    location: {
        type: String,
        required: true,
    },
    locationCoords: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            index: '2dsphere'
        }
    },
    images: [{
        type: String, // URL from Cloudinary
    }],
    status: {
        type: String,
        enum: ['active', 'inactive', 'sold', 'completed', 'archived'],
        default: 'active',
    },
    contactPhone: {
        type: String,
    },
    contactWhatsapp: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    views: {
        type: Number,
        default: 0,
    },
    acceptsBarter: {
        type: Boolean,
        default: false,
    },
    expiresAt: {
        type: Date,
        index: true, // Index for efficient querying/expiration
    },
    duration: {
        type: Number, // duration in minutes
        default: 40320 // 28 days
    },
    barterPreferences: {
        type: String, // e.g., "Looking for: Laptop, Books, or similar services"
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    shares: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        text: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        replies: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            text: {
                type: String,
                required: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }]
    }],
    notified1d: {
        type: Boolean,
        default: false
    },
    notified5m: {
        type: Boolean,
        default: false
    },
    notifiedExpired: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Post', PostSchema);
