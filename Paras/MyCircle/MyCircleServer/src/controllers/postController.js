const Post = require('../models/Post');
const { checkContentSafety } = require('../config/gemini');
const { createNotification } = require('./notificationController');
const { containsProfanity } = require('../utils/profanityFilter');

// @desc    Create a post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res) => {
    try {
        const { type, title, description, price, location, contactPhone, contactWhatsapp, duration } = req.body;

        // Calculate expiresAt based on duration
        let expiresAt = null;
        if (duration) {
            const durationInMinutes = parseInt(duration, 10);
            if (!isNaN(durationInMinutes)) {
                expiresAt = new Date(Date.now() + durationInMinutes * 60000);
            }
        }

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
            locationCoords: (req.body.latitude && req.body.longitude) ? {
                type: 'Point',
                coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
            } : undefined,
            images,
            contactPhone,
            contactWhatsapp,
            expiresAt
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
        const { latitude, longitude, radius = 50, type, filter, userId } = req.query; // radius in km

        let pipeline = [];

        // 1. Geospatial Stage (Must be first if present)
        if (latitude && longitude) {
            pipeline.push({
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    distanceField: 'dist.calculated', // Output field
                    maxDistance: parseFloat(radius) * 1000, // Meters
                    spherical: true,
                    query: { isActive: true } // Filter for active posts
                }
            });
        } else {
            // If no location, just match active posts
            pipeline.push({ $match: { isActive: true } });
        }

        // Filter expired posts (if expiresAt is set)
        // We match where expiresAt is null OR expiresAt > now
        pipeline.push({
            $match: {
                $or: [
                    { expiresAt: { $exists: false } },
                    { expiresAt: null },
                    { expiresAt: { $gt: new Date() } }
                ]
            }
        });

        // 2. Additional Filters
        if (type && type !== 'all') {
            pipeline.push({ $match: { type: type } });
        }

        // Handle 'filter' param (e.g., 'active', 'sold' - though getPosts usually just shows active)
        // The original code only showed { isActive: true }, so we stick to that for public feed.

        // 3. Sorting
        // $geoNear sorts by distance automatically. If not using geoNear, sort by date.
        if (!latitude || !longitude) {
            pipeline.push({ $sort: { createdAt: -1 } });
        }

        // 4. Lookup (Populate) User
        pipeline.push({
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'user'
            }
        });
        pipeline.push({ $unwind: '$user' }); // Lookup returns array, flatten it

        // 5. Project (Select Fields & Formatting)
        pipeline.push({
            $project: {
                // Include all post fields
                user: { _id: '$user._id', displayName: '$user.displayName', avatar: '$user.avatar' }, // Select specific user fields
                type: 1, title: 1, description: 1, price: 1, location: 1, images: 1, status: 1,
                isActive: 1, views: 1, likes: 1, shares: 1, createdAt: 1,
                // Include locationCoords for map visibility
                locationCoords: 1,
                distance: { $ifNull: ['$dist.calculated', null] } // Flatten distance
            }
        });

        const posts = await Post.aggregate(pipeline);

        // Add application count for each post (Aggregation makes this harder to do efficiently in one go without complex lookups)
        // We can do it in parallel
        const ContactRequest = require('../models/ContactRequest');
        const postsWithCount = await Promise.all(posts.map(async (post) => {
            // Convert distance to km/m string if present
            let distanceDisplay = null;
            if (post.distance !== null) {
                if (post.distance < 1000) {
                    distanceDisplay = `${Math.round(post.distance)}m away`;
                } else {
                    distanceDisplay = `${(post.distance / 1000).toFixed(1)}km away`;
                }
            }

            const applicationCount = await ContactRequest.countDocuments({ post: post._id });
            return {
                ...post,
                distance: distanceDisplay,
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

        // Cascade Delete: Remove related data
        const ContactRequest = require('../models/ContactRequest');
        const Notification = require('../models/Notification');

        // 1. Delete Contact Requests for this post
        await ContactRequest.deleteMany({ post: req.params.id });

        // 2. Delete Notifications related to this post
        await Notification.deleteMany({ relatedId: req.params.id });

        // 3. Delete the post (which deletes embedded comments automatically)
        await Post.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Post and related data removed' });
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

// @desc    Get posts liked by current user
// @route   GET /api/posts/liked
// @access  Private
exports.getLikedPosts = async (req, res) => {
    try {
        const posts = await Post.find({ likes: req.user.id })
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
            const User = require('../models/User');
            const sender = await User.findById(req.user.id);
            const senderName = sender ? sender.displayName : 'Someone';
            const postTitle = post.title.length > 25 ? post.title.substring(0, 25) + '...' : post.title;

            const io = req.app.get('io');
            await createNotification(io, {
                recipient: post.user,
                sender: req.user.id,
                type: 'like',
                title: 'New Like',
                message: `${senderName} liked your post: "${postTitle}"`,
                link: `/post/${post._id}`,
                relatedId: post._id,
                postId: post._id
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
            const User = require('../models/User');
            const sender = await User.findById(req.user.id);
            const senderName = sender ? sender.displayName : 'Someone';
            const postTitle = post.title.length > 25 ? post.title.substring(0, 25) + '...' : post.title;

            const io = req.app.get('io');
            await createNotification(io, {
                recipient: post.user,
                sender: req.user.id,
                type: 'comment',
                title: 'New Comment',
                message: `${senderName} commented on "${postTitle}": ${req.body.text.substring(0, 30)}${req.body.text.length > 30 ? '...' : ''}`,
                link: `/post/${post._id}`,
                relatedId: post._id,
                postId: post._id // Explicitly add postId for mobile navigation
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

        // Check for profanity in reply
        if (containsProfanity(req.body.text)) {
            return res.status(400).json({ msg: 'Reply contains inappropriate language. Please be respectful.' });
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
                const User = require('../models/User');
                const sender = await User.findById(req.user.id);
                const senderName = sender ? sender.displayName : 'Someone';

                await createNotification(io, {
                    recipient: comment.user,
                    sender: req.user.id,
                    type: 'request', // Using 'request' as generic 'reply' or add 'reply' to enum
                    title: 'New Reply',
                    message: `${senderName} replied: ${req.body.text.substring(0, 30)}${req.body.text.length > 30 ? '...' : ''}`,
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
