const User = require('../models/User');
const Post = require('../models/Post');

const sanitizeUserResponse = (userDoc, { isOwner = false } = {}) => {
    if (!userDoc) return null;

    const user = userDoc.toObject({ getters: true });
    user.id = user._id.toString();
    delete user._id;
    delete user.__v;

    if (isOwner) {
        return user;
    }

    const privacy = user.privacy || {};

    if (privacy.showEmail === false) {
        delete user.email;
    }

    if (privacy.showPhone === false) {
        delete user.contactPhone;
        delete user.contactWhatsapp;
        delete user.whatsappNumber;
    }

    if (privacy.showLocation === false) {
        delete user.location;
        delete user.area;
    }

    if (privacy.showStats === false) {
        delete user.stats;
        delete user.completedDeals;
        delete user.responseRate;
    }

    return user;
};

// @desc    Get current user profile
// @route   GET /api/user/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(sanitizeUserResponse(user, { isOwner: true }));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get a public profile by ID (for /profile/:id view)
// @route   GET /api/user/:id
// @access  Public
exports.getPublicProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(sanitizeUserResponse(user));
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.status(500).send('Server Error');
    }
};

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
    try {
        const {
            bio,
            contactPhone,
            contactWhatsapp,
            location,
            area,
            skills,
            coverImage,
            whatsappNumber,
            displayName,
            privacy
        } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Update fields
        if (bio !== undefined) user.bio = bio;
        if (contactPhone !== undefined) user.contactPhone = contactPhone;
        if (contactWhatsapp !== undefined) user.contactWhatsapp = contactWhatsapp;
        if (location !== undefined) user.location = location;
        if (area !== undefined) user.area = area;
        if (skills !== undefined) user.skills = skills;
        if (coverImage !== undefined) user.coverImage = coverImage;
        if (whatsappNumber !== undefined) user.whatsappNumber = whatsappNumber;
        if (displayName !== undefined) user.displayName = displayName;

        if (privacy && typeof privacy === 'object') {
            user.privacy = {
                ...user.privacy?.toObject?.() ?? user.privacy ?? {},
                showEmail: privacy.showEmail ?? user.privacy?.showEmail ?? false,
                showPhone: privacy.showPhone ?? user.privacy?.showPhone ?? true,
                showLocation: privacy.showLocation ?? user.privacy?.showLocation ?? true,
                showStats: privacy.showStats ?? user.privacy?.showStats ?? true,
            };
        }

        await user.save();
        res.json(sanitizeUserResponse(user, { isOwner: true }));

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
