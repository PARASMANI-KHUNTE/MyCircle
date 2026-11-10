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
        EscrowTransaction.aggregate([
            { $match: { status: 'released' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
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
        revenueLastMonth,
        escrowsLastMonth,
        reportsLastMonth
    ] = await Promise.all([
        User.countDocuments({ createdAt: { $lt: lastMonth } }),
        User.countDocuments({ lastSeenAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000), lastSeenAt: { $lt: lastMonth } } }),
        EscrowTransaction.aggregate([
            { $match: { status: 'released', createdAt: { $lt: lastMonth } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        EscrowTransaction.countDocuments({ status: { $in: ['pending', 'funded', 'held'] }, createdAt: { $lt: lastMonth } }),
        Report.countDocuments({ status: { $in: ['pending', 'under_review'] }, createdAt: { $lt: lastMonth } })
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
        EscrowTransaction.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('buyer', 'displayName')
            .populate('seller', 'displayName')
            .populate('post', 'title'),
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
        ...newEscrows.map(e => ({
            type: 'payment',
            description: `New escrow created: ${e.post?.title || 'Unknown'} (₹${e.amount})`,
            timestamp: e.createdAt,
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

    // Get user's posts, escrows, reports
    const [posts, escrows, reports] = await Promise.all([
        Post.find({ user: user._id }).select('title price isActive createdAt').limit(10),
        EscrowTransaction.find({ $or: [{ buyer: user._id }, { seller: user._id }] })
            .populate('post', 'title')
            .sort({ createdAt: -1 })
            .limit(10),
        Report.find({ $or: [{ reporter: user._id }, { reportedUser: user._id }] })
            .sort({ createdAt: -1 })
            .limit(10)
    ]);

    res.json({ user, posts, escrows, reports });
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

// @desc    Get all payments/transactions
// @route   GET /admin/payments
// @access  Private (Admin)
exports.getPayments = asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);
    const search = req.query.search;
    const type = req.query.type;
    const status = req.query.status;

    const query = {};
    if (search) {
        const safeSearch = escapeRegex(search);
        // $regex cannot match populated paths (post.title); resolve matching post ids first
        const [matchingPosts, matchingUsers] = await Promise.all([
            Post.find({ title: { $regex: safeSearch, $options: 'i' } }).select('_id').limit(100),
            User.find({ displayName: { $regex: safeSearch, $options: 'i' } }).select('_id').limit(100)
        ]);

        query.$or = [];
        if (mongoose.isValidObjectId(search)) {
            query.$or.push({ _id: search });
        }
        query.$or.push({ razorpayOrderId: { $regex: safeSearch, $options: 'i' } });
        if (matchingPosts.length) {
            query.$or.push({ post: { $in: matchingPosts.map(p => p._id) } });
        }
        if (matchingUsers.length) {
            query.$or.push({ buyer: { $in: matchingUsers.map(u => u._id) } }, { seller: { $in: matchingUsers.map(u => u._id) } });
        }
    }
    if (type && type !== 'all') {
        // Determine type from fields
        if (type === 'topup') query.stripePaymentIntentId = { $exists: false };
    }
    if (status && status !== 'all') {
        query.status = status;
    }

    const [transactions, total] = await Promise.all([
        EscrowTransaction.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('buyer', 'displayName email')
            .populate('seller', 'displayName email')
            .populate('post', 'title price images'),
        EscrowTransaction.countDocuments(query)
    ]);

    res.json({
        transactions,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    });
});

// @desc    Get single transaction details
// @route   GET /admin/payments/:id
// @access  Private (Admin)
exports.getPayment = asyncHandler(async (req, res) => {
    const transaction = await EscrowTransaction.findById(req.params.id)
        .populate('buyer', 'displayName email avatar')
        .populate('seller', 'displayName email avatar')
        .populate('post', 'title price images');

    if (!transaction) {
        throw new ApiError(404, 'Transaction not found');
    }

    res.json(transaction);
});

// @desc    Get all reports
// @route   GET /admin/reports
// @access  Private (Admin)
exports.getReports = asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);
    const search = req.query.search;
    const status = req.query.status;
    const category = req.query.category;

    const query = {};
    if (search) {
        const safeSearch = escapeRegex(search);
        // $regex cannot match populated paths (reporter.displayName); resolve matching user ids first
        const matchingUsers = await User.find({
            displayName: { $regex: safeSearch, $options: 'i' }
        }).select('_id').limit(100);

        query.$or = [{ reason: { $regex: safeSearch, $options: 'i' } }];
        if (matchingUsers.length) {
            query.$or.push(
                { reporter: { $in: matchingUsers.map(u => u._id) } },
                { reportedUser: { $in: matchingUsers.map(u => u._id) } }
            );
        }
    }
    if (status && status !== 'all') {
        query.status = status;
    }
    if (category && category !== 'all') {
        query.category = category;
    }

    const [reports, total] = await Promise.all([
        Report.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('reporter', 'displayName email avatar role')
            .populate('reportedUser', 'displayName email avatar role'),
        Report.countDocuments(query)
    ]);

    res.json({
        reports,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    });
});

// @desc    Get single report details
// @route   GET /admin/reports/:id
// @access  Private (Admin)
exports.getReport = asyncHandler(async (req, res) => {
    const report = await Report.findById(req.params.id)
        .populate('reporter', 'displayName email avatar role')
        .populate('reportedUser', 'displayName email avatar role');

    if (!report) {
        throw new ApiError(404, 'Report not found');
    }

    res.json(report);
});

// @desc    Resolve report
// @route   POST /admin/reports/:id/resolve
// @access  Private (Admin)
exports.resolveReport = asyncHandler(async (req, res) => {
    const report = await Report.findByIdAndUpdate(
        req.params.id,
        { status: 'resolved', resolvedAt: new Date(), resolvedBy: req.user.id },
        { new: true }
    ).populate('reporter', 'displayName email').populate('reportedUser', 'displayName email');

    if (!report) {
        throw new ApiError(404, 'Report not found');
    }

    // Notify reporter
    // TODO: Send notification

    res.json({ report, message: 'Report marked as resolved' });
});

// @desc    Dismiss report
// @route   POST /admin/reports/:id/dismiss
// @access  Private (Admin)
exports.dismissReport = asyncHandler(async (req, res) => {
    const report = await Report.findByIdAndUpdate(
        req.params.id,
        { status: 'dismissed', dismissedAt: new Date(), dismissedBy: req.user.id },
        { new: true }
    );

    if (!report) {
        throw new ApiError(404, 'Report not found');
    }

    res.json({ report, message: 'Report dismissed' });
});

// @desc    Escalate report
// @route   POST /admin/reports/:id/escalate
// @access  Private (Admin)
exports.escalateReport = asyncHandler(async (req, res) => {
    const report = await Report.findByIdAndUpdate(
        req.params.id,
        { status: 'escalated', escalatedAt: new Date(), escalatedBy: req.user.id },
        { new: true }
    );

    if (!report) {
        throw new ApiError(404, 'Report not found');
    }

    res.json({ report, message: 'Report escalated' });
});

// @desc    Get service health
// @route   GET /admin/health/:service/metrics
// @access  Private (Admin)
exports.getServiceMetrics = asyncHandler(async (req, res) => {
    // This would typically query Prometheus or similar
    // For now, return mock data based on service name
    const { service } = req.params;

    const mockMetrics = {
        identity: { memory: { heapUsed: 45000000, heapTotal: 80000000 }, cpu: 12.5, connections: 45, requestsPerMinute: 230, errorRate: 0.001, dbStatus: 'connected' },
        marketplace: { memory: { heapUsed: 65000000, heapTotal: 120000000 }, cpu: 25.3, connections: 120, requestsPerMinute: 890, errorRate: 0.002, dbStatus: 'connected' },
        communication: { memory: { heapUsed: 35000000, heapTotal: 60000000 }, cpu: 8.2, connections: 500, requestsPerMinute: 1200, errorRate: 0.0005, dbStatus: 'connected' },
        contact: { memory: { heapUsed: 20000000, heapTotal: 40000000 }, cpu: 5.1, connections: 30, requestsPerMinute: 150, errorRate: 0.001, dbStatus: 'connected' },
        notifications: { memory: { heapUsed: 15000000, heapTotal: 30000000 }, cpu: 3.8, connections: 25, requestsPerMinute: 80, errorRate: 0.0001, dbStatus: 'connected' },
        payment: { memory: { heapUsed: 40000000, heapTotal: 70000000 }, cpu: 15.6, connections: 40, requestsPerMinute: 320, errorRate: 0.003, dbStatus: 'connected' },
    };

    res.json(mockMetrics[service] || {});
});

// @desc    Get analytics data
// @route   GET /admin/analytics
// @access  Private (Admin)
exports.getAnalytics = asyncHandler(async (req, res) => {
    const range = req.query.range || '30d';
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Generate daily data for charts.
    // Aggregate all days in bulk instead of issuing per-day queries (avoids days*5 DB round trips).
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayKeys = [];
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dayKeys.push(date.toISOString().slice(0, 10));
    }

    const countByDay = {
        $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
        }
    };
    const sumByDay = {
        $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: '$amount' }
        }
    };

    const [usersByDay, postsByDay, escrowsByDay, revenueByDay, activeByDay] = await Promise.all([
        User.aggregate([{ $match: { createdAt: { $gte: startDate } } }, countByDay]),
        Post.aggregate([{ $match: { createdAt: { $gte: startDate } } }, countByDay]),
        EscrowTransaction.aggregate([{ $match: { createdAt: { $gte: startDate } } }, countByDay]),
        EscrowTransaction.aggregate([{ $match: { status: 'released', createdAt: { $gte: startDate } } }, sumByDay]),
        User.aggregate([{ $match: { lastSeenAt: { $gte: startDate } } }, countByDay])
    ]);

    const toDayMap = (rows, field) => Object.fromEntries(rows.map(row => [row._id, row[field] || 0]));
    const usersMap = toDayMap(usersByDay, 'count');
    const postsMap = toDayMap(postsByDay, 'count');
    const escrowsMap = toDayMap(escrowsByDay, 'count');
    const revenueMap = toDayMap(revenueByDay, 'total');
    const activeMap = toDayMap(activeByDay, 'count');

    const dailyData = dayKeys.map((key) => ({
        date: new Date(`${key}T00:00:00.000Z`).toISOString(),
        users: usersMap[key] || 0,
        posts: postsMap[key] || 0,
        messages: Math.floor(Math.random() * 500) + 100, // Mock messages count
        revenue: revenueMap[key] || 0,
        escrows: escrowsMap[key] || 0,
        activeUsers: activeMap[key] || 0
    }));

    // Overview stats
    const [totalUsers, totalPosts, totalRevenue, totalEscrows] = await Promise.all([
        User.countDocuments(),
        Post.countDocuments(),
        EscrowTransaction.aggregate([{ $match: { status: 'released' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
        EscrowTransaction.countDocuments()
    ]);

    // Categories
    const categories = await Post.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
    ]);

    // Locations
    const locations = await Post.aggregate([
        { $group: { _id: '$location', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
    ]);

    // Registrations (daily users)
    const registrations = dailyData.map(d => ({ date: d.date, users: d.users }));
    const revenue = dailyData.map(d => ({ date: d.date, revenue: d.revenue }));
    const activity = dailyData.map(d => ({ date: d.date, activeUsers: d.activeUsers }));
    const posts = dailyData.map(d => ({ date: d.date, posts: d.posts }));
    const messages = dailyData.map(d => ({ date: d.date, messages: d.messages }));
    const escrow = dailyData.map(d => ({ date: d.date, escrows: d.escrows }));

    // Growth calculations
    const prevStart = new Date(startDate);
    prevStart.setDate(prevStart.getDate() - days);

    const [prevUsers, prevPosts, prevRevenue, prevActive] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: prevStart, $lt: startDate } }),
        Post.countDocuments({ createdAt: { $gte: prevStart, $lt: startDate } }),
        EscrowTransaction.aggregate([
            { $match: { status: 'released', createdAt: { $gte: prevStart, $lt: startDate } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        User.countDocuments({ lastSeenAt: { $gte: prevStart, $lt: startDate } })
    ]);

    const calculateGrowth = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    // Funnel
    const funnel = [
        { label: 'Visitors', count: totalUsers * 10, rate: 100 },
        { label: 'Signups', count: totalUsers, rate: 10 },
        { label: 'Active Users', count: dailyData[dailyData.length - 1]?.activeUsers || 0, rate: 5 },
        { label: 'Created Posts', count: totalPosts, rate: 2 },
        { label: 'Made Purchase', count: totalEscrows, rate: 1 }
    ];

    res.json({
        overview: {
            totalUsers,
            activeUsers: dailyData[dailyData.length - 1]?.activeUsers || 0,
            totalRevenue: totalRevenue[0]?.total || 0,
            totalPosts,
            userGrowth: calculateGrowth(totalUsers, prevUsers),
            activeGrowth: calculateGrowth(dailyData[dailyData.length - 1]?.activeUsers || 0, prevActive),
            revenueGrowth: calculateGrowth(totalRevenue[0]?.total || 0, prevRevenue[0]?.total || 0),
            postGrowth: calculateGrowth(totalPosts, prevPosts)
        },
        daily: dailyData,
        registrations,
        revenue,
        activity,
        posts,
        messages,
        escrow,
        categories: categories.map(c => ({ category: c._id, count: c.count })),
        locations: locations.map(l => ({ location: l._id, count: l.count })),
        funnel
    });
});