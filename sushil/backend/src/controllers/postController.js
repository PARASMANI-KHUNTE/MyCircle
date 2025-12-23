const Post = require('../models/Post');
const User = require('../models/User');
const Review = require('../models/Review');
const { checkContentSafety } = require('../config/gemini');

// @desc    Create a post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res) => {
    try {
        const { type, title, description, price, location, contactPhone, contactWhatsapp } = req.body;

        let images = [];
        if (req.files) {
            images = req.files.map(file => file.path); // Cloudinary URL is in 'path' with multer-storage-cloudinary
        }

        // AI Safety Check
        const safetyCheck = await checkContentSafety(`${title} ${description}`);
        if (!safetyCheck.safe) {
            return res.status(400).json({
                msg: 'Post rejected by AI moderation',
                reason: safetyCheck.reason || 'Content violation'
            });
        }

        const newPost = new Post({
            user: req.user.id,
            type,
            title,
            description,
            price,
            location,
            images,
            contactPhone,
            contactWhatsapp
        });

        const post = await newPost.save();
        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Public explore feed (Landing/Explore pages)
// @route   GET /api/posts/feed/public
// @access  Public
exports.getPublicFeed = async (req, res) => {
    try {
        const posts = await Post.find({ isActive: true })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('user', ['displayName', 'avatar', 'area']);

        res.json({
            posts,
            meta: {
                total: posts.length,
                scope: 'public'
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Personalized feed for authenticated users (/feed)
// @route   GET /api/posts/feed/personal
// @access  Private
exports.getPersonalizedFeed = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        const baseFilters = { isActive: true };
        const filters = { ...baseFilters };
        const area = user?.area?.trim();
        if (area) {
            filters.location = area;
        }

        let posts = await Post.find(filters)
            .sort({ createdAt: -1 })
            .limit(30)
            .populate('user', ['displayName', 'avatar', 'area']);

        // Fallback: if area-filtered feed is empty, show global active feed
        if (filters.location && posts.length === 0) {
            posts = await Post.find(baseFilters)
                .sort({ createdAt: -1 })
                .limit(30)
                .populate('user', ['displayName', 'avatar', 'area']);
        }

        res.json({
            posts,
            meta: {
                total: posts.length,
                scope: 'personal',
                appliedFilters: {
                    area: filters.location || null,
                },
                fallback: filters.location && posts.length === 0 ? 'global' : null,
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get all posts (optional filtering)
// @route   GET /api/posts
// @access  Public
exports.getPosts = async (req, res) => {
    try {
        const filters = { isActive: true };
        if (req.query.user) {
            filters.user = req.query.user;
        }

        const posts = await Post.find(filters)
            .sort({ createdAt: -1 })
            .populate('user', ['displayName', 'avatar', 'area', 'whatsappNumber', 'privacy', 'completedDeals', 'responseRate', 'createdAt']);
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get post by ID
// @route   GET /api/posts/:id
// @access  Public
exports.getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate('user', ['displayName', 'avatar', 'ratingAvg', 'ratingCount']);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        res.json(post);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server Error');
    }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Check user
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await post.remove();

        res.json({ msg: 'Post removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server Error');
    }
};

// @desc    Get current user's posts
// @route   GET /api/posts/my-posts
// @access  Private
exports.getMyPosts = async (req, res) => {
    try {
        const posts = await Post.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .populate('user', ['displayName', 'avatar']);
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Toggle post active status
// @route   PATCH /api/posts/:id/toggle-status
// @access  Private
exports.togglePostStatus = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Check user authorization
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Toggle the isActive status
        post.isActive = !post.isActive;
        await post.save();

        res.json(post);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server Error');
    }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
exports.updatePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Check user authorization
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const { type, title, description, price, location, contactPhone, contactWhatsapp } = req.body;

        // Update fields
        if (type) post.type = type;
        if (title) post.title = title;
        if (description) post.description = description;
        if (price !== undefined) post.price = price;
        if (location) post.location = location;
        if (contactPhone !== undefined) post.contactPhone = contactPhone;
        if (contactWhatsapp !== undefined) post.contactWhatsapp = contactWhatsapp;

        await post.save();
        res.json(post);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server Error');
    }
};

// @desc    Like/Unlike a post
// @route   POST /api/posts/:id/like
// @access  Private
exports.likePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Check if already liked
        const likeIndex = post.likes.indexOf(req.user.id);
        
        if (likeIndex > -1) {
            // Unlike
            post.likes.splice(likeIndex, 1);
        } else {
            // Like
            post.likes.push(req.user.id);
        }

        await post.save();
        res.json({ likes: post.likes.length, isLiked: likeIndex === -1 });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server Error');
    }
};

// @desc    Share a post (increment share count)
// @route   POST /api/posts/:id/share
// @access  Public
exports.sharePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        post.shares += 1;
        await post.save();

        res.json({ shares: post.shares });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server Error');
    }
};
