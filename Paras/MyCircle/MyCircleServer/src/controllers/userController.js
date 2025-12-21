const User = require('../models/User');
const Post = require('../models/Post');
const ContactRequest = require('../models/ContactRequest');

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
        console.log('Update Profile Req Body:', req.body); // DEBUG LOG
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
        if (req.file) user.avatar = req.file.path;

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
// @desc    Update user settings
// @route   PUT /api/user/settings
// @access  Private
exports.updateUserSettings = async (req, res) => {
    try {
        const { emailNotifications, profileVisibility } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (user.preferences) {
            if (emailNotifications !== undefined) user.preferences.emailNotifications = emailNotifications;
            if (profileVisibility !== undefined) user.preferences.profileVisibility = profileVisibility;
        } else {
            user.preferences = {
                emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
                profileVisibility: profileVisibility !== undefined ? profileVisibility : 'public'
            };
        }

        await user.save();
        res.json(user.preferences);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Block a user
// @route   POST /api/user/block/:userId
// @access  Private
exports.blockUser = async (req, res) => {
    try {
        const userToBlockId = req.params.userId;
        const user = await User.findById(req.user.id);

        if (!user.blockedUsers.includes(userToBlockId)) {
            user.blockedUsers.push(userToBlockId);
            await user.save();
        }

        res.json({ msg: 'User blocked' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Unblock a user
// @route   POST /api/user/unblock/:userId
// @access  Private
exports.unblockUser = async (req, res) => {
    try {
        const userToUnblockId = req.params.userId;
        const user = await User.findById(req.user.id);

        user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== userToUnblockId);
        await user.save();

        res.json({ msg: 'User unblocked' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Report a user
// @route   POST /api/user/report
// @access  Private
exports.reportUser = async (req, res) => {
    try {
        const { reason, contentType, contentId, reportedUserId } = req.body;

        const reportedUser = await User.findById(reportedUserId);
        if (!reportedUser) return res.status(404).json({ msg: 'User not found' });

        reportedUser.reports.push({
            reporter: req.user.id,
            reason,
            contentType,
            contentId
        });
        await reportedUser.save();

        res.json({ msg: 'Report submitted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get user connections (approved contact requests)
// @route   GET /api/user/connections
// @access  Private
exports.getConnections = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find all approved contact requests involving the user
        const connections = await ContactRequest.find({
            $or: [
                { requester: userId, status: 'approved' },
                { recipient: userId, status: 'approved' }
            ]
        }).populate('requester recipient', 'displayName avatar profile');

        // Extract the "other" user from each connection
        const connectedUsers = connections.map(conn => {
            const otherUser = conn.requester._id.toString() === userId
                ? conn.recipient
                : conn.requester;
            return {
                _id: otherUser._id,
                displayName: otherUser.displayName,
                avatar: otherUser.avatar,
                status: conn.status,
                requestId: conn._id
            };
        });

        // De-duplicate if multiple requests between same users (edge case)
        const uniqueUsers = Array.from(new Map(connectedUsers.map(u => [u._id.toString(), u])).values());

        res.json(uniqueUsers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
