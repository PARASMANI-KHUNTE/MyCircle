const Review = require('../models/Review');
const Post = require('../models/Post');
const User = require('../models/User');

const recalcPostRating = async (postId) => {
    const agg = await Review.aggregate([
        { $match: { post: postId } },
        { $group: { _id: '$post', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const { avgRating = 0, count = 0 } = agg[0] || {};
    await Post.findByIdAndUpdate(postId, {
        ratingAvg: Number(avgRating.toFixed ? avgRating.toFixed(2) : avgRating) || 0,
        ratingCount: count,
    });
    return { avgRating: avgRating || 0, count };
};

const recalcUserRating = async (userId) => {
    const postIds = await Post.find({ user: userId }).select('_id');
    if (!postIds || postIds.length === 0) {
        await User.findByIdAndUpdate(userId, { ratingAvg: 0, ratingCount: 0, rating: 0, reviews: 0 });
        return { avgRating: 0, count: 0 };
    }
    const ids = postIds.map((p) => p._id);
    const agg = await Review.aggregate([
        { $match: { post: { $in: ids } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const { avgRating = 0, count = 0 } = agg[0] || {};
    await User.findByIdAndUpdate(userId, {
        ratingAvg: Number(avgRating.toFixed ? avgRating.toFixed(2) : avgRating) || 0,
        ratingCount: count,
        rating: Number(avgRating) || 0,
        reviews: count,
    });
    return { avgRating: avgRating || 0, count };
};

exports.getPostReviews = async (req, res) => {
    try {
        const { id } = req.params; // post id
        const reviews = await Review.find({ post: id })
            .sort({ createdAt: -1 })
            .populate('reviewer', ['displayName', 'avatar']);
        res.json(reviews);
    } catch (err) {
        console.error('getPostReviews error:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
};

exports.upsertReview = async (req, res) => {
    try {
        const { id } = req.params; // post id
        const { rating, text } = req.body;
        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }
        if (post.user.toString() === req.user.id) {
            return res.status(400).json({ msg: 'Cannot review your own post' });
        }
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
        }

        await Review.findOneAndUpdate(
            { post: id, reviewer: req.user.id },
            { rating, text },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const postStats = await recalcPostRating(post._id);
        const userStats = await recalcUserRating(post.user);

        const reviewDoc = await Review.findOne({ post: id, reviewer: req.user.id }).populate('reviewer', ['displayName', 'avatar']);

        res.json({
            review: reviewDoc,
            postRating: postStats,
            ownerRating: userStats,
        });
    } catch (err) {
        console.error('upsertReview error:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
};

exports.getUserReviews = async (req, res) => {
    try {
        const { id } = req.params; // user id
        const posts = await Post.find({ user: id }).select('_id');
        if (!posts || posts.length === 0) {
            return res.json([]);
        }

        const postIds = posts.map((p) => p._id);
        const reviews = await Review.find({ post: { $in: postIds } })
            .sort({ createdAt: -1 })
            .populate('reviewer', ['displayName', 'avatar'])
            .populate('post', ['title']);

        res.json(reviews);
    } catch (err) {
        console.error('getUserReviews error:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
};
