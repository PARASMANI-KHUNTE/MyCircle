const User = require('../models/User');
const Post = require('../models/Post');

// @desc    Get current user profile
// @route   GET /api/user/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
    try {
        const { bio, contactPhone, contactWhatsapp, location, skills } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Update fields
        if (bio) user.bio = bio;
        if (contactPhone) user.contactPhone = contactPhone;
        if (contactWhatsapp) user.contactWhatsapp = contactWhatsapp;
        if (location) user.location = location;
        if (skills) user.skills = skills; // Expecting array of strings

        await user.save();
        res.json(user);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get user statistics
// @route   GET /api/user/stats
// @access  Private
exports.getUserStats = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Calculate dynamic stats
        const postCount = await Post.countDocuments({ user: req.user.id });
        const activePostCount = await Post.countDocuments({ user: req.user.id, isActive: true });

        // Update user stats in DB (sync)
        user.stats.totalPosts = postCount;
        user.stats.activePosts = activePostCount;
        await user.save();

        res.json({
            stats: user.stats,
            rating: user.rating,
            reviews: user.reviews,
            joined: user.createdAt
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
