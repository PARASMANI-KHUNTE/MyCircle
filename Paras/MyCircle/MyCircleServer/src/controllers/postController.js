const Post = require('../models/Post');
const { checkContentSafety } = require('../config/gemini');
const { createNotification } = require('./notificationController');
const { containsProfanity } = require('../utils/profanityFilter');

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
        const populatedPost = await Post.findById(post._id).populate('user', ['displayName', 'avatar']);

        // Emit real-time event
        const io = req.app.get('io');
        if (io) {
            io.emit('new_post', populatedPost);
        }

        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
exports.getPosts = async (req, res) => {
    try {
        // Only return active posts in the public feed
        const posts = await Post.find({ isActive: true })
            .sort({ createdAt: -1 })
            .populate('user', ['displayName', 'avatar']);

        // Add application count for each post
        const ContactRequest = require('../models/ContactRequest');
        const postsWithCount = await Promise.all(posts.map(async (post) => {
            const applicationCount = await ContactRequest.countDocuments({ post: post._id });
            return {
                ...post.toObject(),
                applicationCount
            };
        }));

        res.json(postsWithCount);
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
        const post = await Post.findById(req.params.id)
            .populate('user', ['displayName', 'avatar'])
            .populate({
                path: 'comments',
                populate: [
                    { path: 'user', select: 'displayName avatar' },
                    { path: 'replies.user', select: 'displayName avatar' }
                ]
            });

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Add application count
        const ContactRequest = require('../models/ContactRequest');
        const applicationCount = await ContactRequest.countDocuments({ post: post._id });

        res.json({
            ...post.toObject(),
            applicationCount
        });
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

        await Post.findByIdAndDelete(req.params.id);

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

        // Add application count for each post
        const ContactRequest = require('../models/ContactRequest');
        const postsWithCount = await Promise.all(posts.map(async (post) => {
            const applicationCount = await ContactRequest.countDocuments({ post: post._id });
            return {
                ...post.toObject(),
                applicationCount
            };
        }));

        res.json(postsWithCount);
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

        // Sync status string
        if (post.isActive) {
            post.status = 'active';
        } else {
            post.status = 'inactive';
        }

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

        // Check block status (only if liking, unliking is always allowed)
        if (likeIndex === -1 && post.user.toString() !== req.user.id) {
            const User = require('../models/User');
            // Check if post owner blocked current user
            const postOwner = await User.findById(post.user);
            if (postOwner.blockedUsers.includes(req.user.id)) {
                return res.status(403).json({ msg: 'You cannot interact with this post' });
            }
            // Check if current user blocked post owner (optional, but good for consistency)
            const currentUser = await User.findById(req.user.id);
            if (currentUser.blockedUsers.includes(post.user)) {
                return res.status(403).json({ msg: 'You have blocked this user' });
            }
        }

        if (likeIndex > -1) {
            // Unlike
            post.likes.splice(likeIndex, 1);
        } else {
            // Like
            post.likes.push(req.user.id);
        }

        await post.save();

        // Notify if liked and not self
        if (likeIndex === -1 && post.user.toString() !== req.user.id) {
            const io = req.app.get('io');
            await createNotification(io, {
                recipient: post.user,
                sender: req.user.id,
                type: 'like',
                title: 'New Like',
                message: 'Someone liked your post.',
                link: `/post/${post._id}`,
                relatedId: post._id
            });
        }

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

        res.json({ shares: post.shares, link: `${process.env.CLIENT_URL || 'http://localhost:5173'}/post/${post._id}` });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server Error');
    }
};

// @desc    Get related posts
// @route   GET /api/posts/related/:id
// @access  Public
exports.getRelatedPosts = async (req, res) => {
    try {
        const currentPost = await Post.findById(req.params.id);
        if (!currentPost) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Find posts with same type OR same location, excluding current post
        // Prioritize same type
        const relatedPosts = await Post.find({
            _id: { $ne: req.params.id },
            isActive: true,
            $or: [
                { type: currentPost.type },
                { location: currentPost.location }
            ]
        })
            .limit(4)
            .populate('user', ['displayName', 'avatar'])
            .sort({ createdAt: -1 });

        res.json(relatedPosts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update post status (active, inactive, sold, completed, archived)
// @route   PATCH /api/posts/:id/status
// @access  Private
exports.updatePostStatus = async (req, res) => {
    try {
        const { status } = req.body;
        // Validate status
        const validStatuses = ['active', 'inactive', 'sold', 'completed', 'archived'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ msg: 'Invalid status' });
        }

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Check user authorization
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        post.status = status;

        // Auto-update isActive based on status
        if (status === 'active') {
            post.isActive = true;
        } else {
            post.isActive = false;
        }

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

// @desc    Get post analytics
// @route   GET /api/posts/:id/analytics
// @access  Private
exports.getPostAnalytics = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Check user authorization
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        res.json({
            views: post.views,
            likes: post.likes.length,
            shares: post.shares,
            daysActive: Math.floor((Date.now() - new Date(post.createdAt)) / (1000 * 60 * 60 * 24))
        });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server Error');
    }
};
// @desc    Create a comment
// @route   POST /api/posts/:id/comment
// @access  Private
exports.commentOnPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Check for profanity in comment
        if (containsProfanity(req.body.text)) {
            return res.status(400).json({ msg: 'Comment contains inappropriate language. Please be respectful.' });
        }

        // Check block status
        if (post.user.toString() !== req.user.id) {
            const User = require('../models/User');
            const postOwner = await User.findById(post.user);
            if (postOwner.blockedUsers.includes(req.user.id)) {
                return res.status(403).json({ msg: 'You cannot comment on this post' });
            }
            const currentUser = await User.findById(req.user.id);
            if (currentUser.blockedUsers.includes(post.user)) {
                return res.status(403).json({ msg: 'You have blocked this user' });
            }
        }

        const newComment = {
            user: req.user.id,
            text: req.body.text,
            createdAt: new Date()
        };

        post.comments.unshift(newComment);
        await post.save();

        // Populate the user of the new comment to return it immediately
        const populatedPost = await Post.findById(req.params.id).populate('comments.user', ['displayName', 'avatar']);
        const addedComment = populatedPost.comments[0];

        // Emit notification to post owner (if not self)
        if (post.user.toString() !== req.user.id) {
            const io = req.app.get('io');
            await createNotification(io, {
                recipient: post.user,
                sender: req.user.id,
                type: 'request', // Map 'comment' to available enum type or expand enum. Using 'request' (message circle) for now or 'info'
                title: 'New Comment',
                message: `New comment on your post: ${req.body.text.substring(0, 30)}${req.body.text.length > 30 ? '...' : ''}`,
                link: `/post/${post._id}`,
                relatedId: post._id
            });
        }

        res.json(addedComment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete comment
// @route   DELETE /api/posts/:id/comment/:commentId
// @access  Private
exports.deleteComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Pull out comment
        const comment = post.comments.find(comment => comment.id === req.params.commentId);

        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found' });
        }

        // Check user
        if (comment.user.toString() !== req.user.id && post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Get remove index
        const removeIndex = post.comments.map(comment => comment.id.toString()).indexOf(req.params.commentId);

        post.comments.splice(removeIndex, 1);

        await post.save();
        res.json(post.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Edit comment
// @route   PUT /api/posts/:id/comment/:commentId
// @access  Private
exports.editComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Find comment
        const comment = post.comments.find(comment => comment.id === req.params.commentId);

        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found' });
        }

        // Check user authorization
        if (comment.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Update comment text
        comment.text = req.body.text;
        await post.save();

        // Return updated comment with populated user
        const populatedPost = await Post.findById(req.params.id).populate('comments.user', ['displayName', 'avatar']);
        const updatedComment = populatedPost.comments.find(c => c.id === req.params.commentId);

        res.json(updatedComment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Reply to a comment
// @route   POST /api/posts/:id/comment/:commentId/reply
// @access  Private
exports.replyToComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        const comment = post.comments.find(comment => comment.id === req.params.commentId);

        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found' });
        }

        // Check block status (with comment owner)
        if (comment.user.toString() !== req.user.id) {
            const User = require('../models/User');
            const commentOwner = await User.findById(comment.user);
            if (commentOwner.blockedUsers.includes(req.user.id)) {
                return res.status(403).json({ msg: 'You cannot reply to this user' });
            }
            const currentUser = await User.findById(req.user.id);
            if (currentUser.blockedUsers.includes(comment.user)) {
                return res.status(403).json({ msg: 'You have blocked this user' });
            }
        }

        const newReply = {
            user: req.user.id,
            text: req.body.text,
            createdAt: new Date()
        };

        if (!comment.replies) {
            comment.replies = [];
        }

        comment.replies.push(newReply);
        await post.save();

        // Populate to return full data
        const populatedPost = await Post.findById(req.params.id)
            .populate('comments.replies.user', ['displayName', 'avatar']);

        const updatedComment = populatedPost.comments.find(c => c.id === req.params.commentId);
        const addedReply = updatedComment.replies[updatedComment.replies.length - 1];


        // Emit notification to comment owner (if not self)
        if (comment.user.toString() !== req.user.id) {
            const io = req.app.get('io');
            if (io) {
                await createNotification(io, {
                    recipient: comment.user,
                    sender: req.user.id,
                    type: 'request', // Using 'request' as generic 'reply' or add 'reply' to enum
                    title: 'New Reply',
                    message: `Reply to your comment: ${req.body.text.substring(0, 30)}...`,
                    link: `/post/${post._id}`,
                    relatedId: post._id
                });
            }
        }

        res.json(addedReply);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
