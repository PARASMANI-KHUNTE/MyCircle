const mongoose = require('mongoose');

const POST_TYPES = ['item', 'service', 'event', 'ride', 'housing', 'favor', 'other'];
const ITEM_CATEGORIES = [
    'Electronics',
    'Furniture',
    'Clothing & Accessories',
    'Home & Garden',
    'Books & Media',
    'Sports & Outdoors',
    'Toys & Games',
    'Vehicles & Auto',
    'Tools & DIY',
    'Other',
];

const postSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    authorSnapshot: {
        displayName: { type: String, default: 'Anonymous' },
        avatar: { type: String, default: '' },
        reputationScore: { type: Number, default: 100 },
    },
    type: {
        type: String,
        enum: POST_TYPES,
        required: true,
    },
    itemCategory: {
        type: String,
        enum: ['', ...ITEM_CATEGORIES],
        default: '',
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        default: 0,
    },
    location: {
        type: String,
        required: true,
    },
    locationCoords: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true,
        },
    },
    images: [{
        type: String,
    }],
    status: {
        type: String,
        enum: ['active', 'inactive', 'sold', 'completed', 'archived'],
        default: 'active',
        index: true,
    },
    viewsCount: {
        type: Number,
        default: 0,
    },
    likesCount: {
        type: Number,
        default: 0,
    },
    expiresAt: {
        type: Date,
        index: true,
    },
}, {
    timestamps: true,
});

postSchema.index({ locationCoords: '2dsphere' });
postSchema.index({ createdAt: -1 });

module.exports = {
    Post: mongoose.model('Post', postSchema),
    POST_TYPES,
    ITEM_CATEGORIES,
};
