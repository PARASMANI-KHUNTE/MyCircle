try {
    require('dotenv').config();
    require('express');
    require('mongoose');
    require('cors');
    require('passport');
    require('passport-google-oauth20');
    require('cloudinary');
    require('multer');
    require('multer-storage-cloudinary');
    require('@google/generative-ai');
    console.log('All major dependencies loaded successfully');
} catch (err) {
    console.error('Dependency missing:', err.message);
    process.exit(1);
}
