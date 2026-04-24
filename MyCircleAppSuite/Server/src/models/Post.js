const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['job', 'sell', 'rent', 'barter', 'service', 'request'],
        required: true,
    },
    jobType: {
        type: String,
        enum: ['', 'full-time', 'part-time', 'contractual', 'gig-based', 'freelance', 'internship'],
        default: '',
    },
    itemCategory: {
        type: String,
        enum: ['', 'electronics', 'other'],
        default: '',
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
    budgetMin: {
        type: Number,
    },
    budgetMax: {
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
    isUrgent: {
        type: Boolean,
        default: false,
    },
    exchangePreference: {
        type: String,
        enum: ['money', 'barter', 'flexible'],
        default: 'money',
    },
    expiresAt: {
        type: Date,
        index: true, // Index for efficient querying/expiration
    },
    duration: {
        type: Number, // duration in minutes
        default: 40320 // 28 days
    },
    availability: {
        type: String,
        trim: true,
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
}, { timestamps: true });

// Middleware to sync isActive with status before saving
PostSchema.pre('save', async function () {
    const activeStatuses = ['active'];
    this.isActive = activeStatuses.includes(this.status);
});

// Indexes for performance
PostSchema.index({ user: 1 });
PostSchema.index({ title: 'text', description: 'text' });
PostSchema.index({ type: 1, status: 1, isActive: 1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ price: 1 });
PostSchema.index({ expiresAt: 1, status: 1, isActive: 1 });

module.exports = mongoose.model('Post', PostSchema);
