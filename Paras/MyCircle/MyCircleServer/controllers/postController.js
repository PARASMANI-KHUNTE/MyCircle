const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { analyzeContent } = require('../services/aiService');
const asyncHandler = require('../src/utils/asyncHandler');
const ApiError = require('../src/utils/ApiError');

exports.createPost = asyncHandler(async (req, res) => {
    const { title, description, type, price, location, latitude, longitude, duration, isUrgent, exchangePreference } = req.body;

    // Validation
    if (!title || !description || !type) {
        throw new ApiError(400, 'Please provide title, description and type');
    }

    // Moderate content with Google Gemini
    const moderation = await analyzeContent(`${title} ${description}`);
    if (!moderation.isSafe) {
        throw new ApiError(400, `Post content flagged: ${moderation.reason}`);
    }

    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    const newPost = new Post({
        author: req.user.id,
        title,
        description,
        type,
        price: price || 0,
        location,
        locationCoords: latitude && longitude ? {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
        } : undefined,
        images,
        duration: parseInt(duration) || 40320,
        isUrgent: isUrgent === 'true',
        exchangePreference: exchangePreference || 'money',
        status: 'active',
        aiExplanations: moderation.explanation
    });

    const post = await newPost.save();

    // Broadcast to all users via Socket.IO
    const populatedPost = await Post.findById(post._id).populate('author', 'displayName photoURL');
    req.app.get('io').emit('new_post', populatedPost);

    res.json(post);
});

exports.getPosts = asyncHandler(async (req, res) => {
    const posts = await Post.find({ status: 'active' })
        .populate('author', 'displayName photoURL')
        .sort({ createdAt: -1 });
    res.json(posts);
});

exports.getPostById = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id)
        .populate('author', 'displayName photoURL bio stats');

    if (!post) {
        throw new ApiError(404, 'Post not found');
    }

    res.json(post);
});

exports.updatePostStatus = asyncHandler(async (req, res) => {
    const { status } = req.body; // 'active', 'sold', 'completed', 'archived'
    const post = await Post.findById(req.params.id);

    if (!post) throw new ApiError(404, 'Post not found');

    // Check ownership
    if (post.author.toString() !== req.user.id) {
        throw new ApiError(401, 'User not authorized to update this post');
    }

    post.status = status;
    await post.save();

    // If post is sold or completed, we might want to notify participants or close chats
    if (status === 'sold' || status === 'completed') {
        const conversations = await Conversation.find({ postId: post._id });
        for (const convo of conversations) {
            // Notify via socket
            req.app.get('io').to(convo._id.toString()).emit('conversation_deleted', {
                conversationId: convo._id,
                reason: `Post marked as ${status}`
            });
        }
    }

    res.json(post);
});

exports.deletePost = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post) throw new ApiError(404, 'Post not found');

    // Check ownership
    if (post.author.toString() !== req.user.id) {
        throw new ApiError(401, 'User not authorized to delete this post');
    }

    // Instead of hard delete, mark as archived or deleted status
    post.status = 'archived';
    await post.save();

    // Notify and clean up conversations
    const conversations = await Conversation.find({ postId: post._id });
    for (const convo of conversations) {
        req.app.get('io').to(convo._id.toString()).emit('conversation_deleted', {
            conversationId: convo._id,
            reason: 'Post deleted by author'
        });
    }

    res.json({ msg: 'Post archived/removed' });
});
