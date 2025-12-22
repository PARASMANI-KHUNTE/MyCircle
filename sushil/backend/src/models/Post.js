const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['job', 'service', 'sell', 'rent'],
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
    images: [{
        type: String, // URL from Cloudinary
    }],
    status: {
        type: String,
        enum: ['open', 'closed'],
        default: 'open',
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
    ratingAvg: {
        type: Number,
        default: 0,
    },
    ratingCount: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Post', PostSchema);
