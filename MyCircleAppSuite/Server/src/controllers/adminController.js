const User = require('../models/User');
const Post = require('../models/Post');
const EscrowTransaction = require('../models/EscrowTransaction');
const Wallet = require('../models/Wallet');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const mongoose = require('mongoose');

// Escape user-supplied search strings before using them in $regex queries
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Parse pagination, capped to prevent unbounded queries
const parsePagination = (query) => {
    const page = Math.max(parseInt(query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit) || 20, 1), 100);
    return { page, limit, skip: (page - 1) * limit };
};

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        throw new ApiError(403, 'Admin access required');
    }
    next();
};

// Attach requireAdmin alongside the exports.* handlers defined below,
// without replacing the exports object (which previously discarded every handler).
exports.requireAdmin = requireAdmin;

// @desc    Get admin dashboard stats
// @route   GET /admin/stats
// @access  Private (Admin)
exports.getStats = asyncHandler(async (req, res) => {
    const [
        totalUsers,
        activeUsers,
        totalPosts,
        activePosts,
        totalRevenue,
        pendingEscrows,
        openReports,
        avgResponseTime
    ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ lastSeenAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
        Post.countDocuments(),
        Post.countDocuments({ isActive: true }),
        // Total released escrow amounts replaced with 0
        0,
        EscrowTransaction.countDocuments({ status: { $in: ['pending', 'funded', 'held'] } }),
        Report.countDocuments({ status: { $in: ['pending', 'under_review'] } }),
        // Mock avg response time - would need actual metrics collection
        Promise.resolve(120)
    ]);

    // Calculate month-over-month changes
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const [
        usersLastMonth,
        activeLastMonth,
        // revenueLastMonth removed - no payment data
        // escrowsLastMonth removed - no payment data
        reportsLastMonth
    ] = await Promise.all([
        User.countDocuments({ createdAt: { $lt: lastMonth } }),
        User.countDocuments({ lastSeenAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000), lastSeenAt: { $lt: lastMonth } } }),
        // skipped - no revenue data
        reportsLastMonth
    ]);

    const calculateChange = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    res.json({
        totalUsers: { value: totalUsers, change: calculateChange(totalUsers, usersLastMonth) },
        activeUsers: { value: activeUsers, change: calculateChange(activeUsers, activeLastMonth) },
        totalRevenue: { value: totalRevenue[0]?.total || 0, change: calculateChange(totalRevenue[0]?.total || 0, revenueLastMonth[0]?.total || 0) },
        pendingEscrows: { value: pendingEscrows, change: calculateChange(pendingEscrows, escrowsLastMonth) },
        openReports: { value: openReports, change: calculateChange(openReports, reportsLastMonth) },
        avgResponseTime: { value: avgResponseTime, change: -5.2 } // Mock
    });
});

// @desc    Get recent activity feed
// @route   GET /admin/activity
// @access  Private (Admin)
exports.getActivity = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 20;

    const [newUsers, newEscrows, newReports] = await Promise.all([
        User.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('displayName email createdAt role'),
        // Escrows removed - activity feed focuses on users and reports
        Report.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('reporter', 'displayName')
            .populate('reportedUser', 'displayName')
    ]);

    const activities = [
        ...newUsers.map(u => ({
            type: 'user',
            description: `New user registered: ${u.displayName}`,
            timestamp: u.createdAt,
            severity: 'info'
        })),
        ...newReports.map(r => ({
            type: 'report',
            description: `New report: ${r.category} on ${r.contentType}`,
            timestamp: r.createdAt,
            severity: r.status === 'pending' ? 'high' : 'medium'
        }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
     .slice(0, limit);

    res.json(activities);
});

// @desc    Get all users with pagination and filters
// @route   GET /admin/users
// @access  Private (Admin)
exports.getUsers = asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);
    const search = req.query.search;
    const role = req.query.role;
    const status = req.query.status;

    const query = {};
    if (search) {
        const safeSearch = escapeRegex(search);
        query.$or = [
            { displayName: { $regex: safeSearch, $options: 'i' } },
            { email: { $regex: safeSearch, $options: 'i' } }
        ];
    }
    if (role && role !== 'all') {
        query.role = role;
    }
    if (status === 'banned') {
        query.banned = true;
    } else if (status === 'active') {
        query.lastSeenAt = { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) };
    } else if (status === 'online') {
        query.isOnline = true;
    }

    const [users, total] = await Promise.all([
        User.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        User.countDocuments(query)
    ]);

    res.json({
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    });
});

// @desc    Get single user details
// @route   GET /admin/users/:id
// @access  Private (Admin)
exports.getUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-passwordHash -passwordSalt');
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    // Get user's posts and reports
    const [posts, reports] = await Promise.all([
        Post.find({ user: user._id }).select('title price isActive createdAt').limit(10),
        Report.find({ $or: [{ reporter: user._id }, { reportedUser: user._id }] })
            .sort({ createdAt: -1 })
            .limit(10)
    ]);

    res.json({ user, posts, reports });
});

// @desc    Update user role
// @route   POST /admin/users/:id/role
// @access  Private (Admin)
exports.updateUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    if (!['user', 'moderator', 'admin'].includes(role)) {
        throw new ApiError(400, 'Invalid role');
    }

    // Prevent admins from changing their own role (avoids accidental self-lockout)
    if (req.user.id === String(req.params.id)) {
        throw new ApiError(400, 'You cannot change your own role');
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true }
    ).select('-passwordHash -passwordSalt');

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    res.json({ user, message: `Role updated to ${role}` });
});

// @desc    Ban user
// @route   POST /admin/users/:id/ban
// @access  Private (Admin)
exports.banUser = asyncHandler(async (req, res) => {
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
        req.params.id,
        { banned: true, banReason: reason, bannedAt: new Date(), bannedBy: req.user.id },
        { new: true }
    ).select('-passwordHash -passwordSalt');

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    // Revoke all refresh tokens
    // TODO: Implement token revocation

    res.json({ user, message: 'User banned successfully' });
});

// @desc    Unban user
// @route   POST /admin/users/:id/unban
// @access  Private (Admin)
exports.unbanUser = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.params.id,
        { banned: false, banReason: null, bannedAt: null, bannedBy: null },
        { new: true }
    ).select('-passwordHash -passwordSalt');

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    res.json({ user, message: 'User unbanned successfully' });
});

// @desc    Get all posts with pagination and filters
// @route   GET /admin/posts
// @access  Private (Admin)
exports.getPosts = asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);
    const search = req.query.search;
    const isActive = req.query.isActive;

    const query = {};
    if (search) {
        const safeSearch = escapeRegex(search);
        query.title = { $regex: safeSearch, $options: 'i' };
    }
    if (isActive !== undefined) {
        query.isActive = JSON.parse(isActive);
    }

    const [posts, total] = await Promise.all([
        Post.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Post.countDocuments(query)
    ]);

    res.json({
        posts,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    });
});