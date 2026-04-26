const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Post = require('../src/models/Post');

async function check() {
    await connectDB();
    const latestPost = await Post.findOne({ type: 'job' }).sort({ createdAt: 1 }).lean();
    console.log("Latest post:", JSON.stringify(latestPost, null, 2));
    process.exit(0);
}
check();
