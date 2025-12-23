const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const sharp = require('sharp');
const path = require('path');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: 'mycircle_posts',
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
            // Cloudinary will handle the transformation
            transformation: [
                { width: 1200, height: 1200, crop: 'limit' }, // Max dimensions
                { quality: 'auto:good' }, // Auto quality optimization
                { fetch_format: 'auto' } // Auto format selection
            ]
        };
    },
});

// File filter to validate file types
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files (JPEG, PNG, WEBP) are allowed'));
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per file
        files: 5 // Maximum 5 files per request
    },
    fileFilter: fileFilter
});

module.exports = upload;

