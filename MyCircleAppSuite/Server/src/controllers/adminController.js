const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const ContactRequest = require('../models/ContactRequest');
const SupportSubmission = require('../models/SupportSubmission');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { schemas, validate } = require('../middleware/validation');

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Admin: list users
// @route   GET /api/admin/users
// @access  Admin
exports.listUsers = asyncHandler(async (req, res, next) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const q = String(req.query.q || '').trim();
    const role = String(req.query.role || '').trim();

    const filter = {};
    if (q) {
        const re = new RegExp(escapeRegex(q), 'i');
        filter.$or = [{ displayName: re }, { email: re }];
    }
    if (role && ['user', 'admin', 'moderator'].includes(role)) {
        filter.role = role;
    }

    const [users, total] = await Promise.all([
        User.find(filter)
            .select('-passwordHash -passwordSalt -pushTokens -blockedUsers -followers -following')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        User.countDocuments(filter),
    ]);

    res.json({ users, page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
});

// @desc    Admin: update user role
// @route   PATCH /api/admin/users/:id/role
// @access  Admin
exports.updateUserRole = [
    validate(schemas.adminUpdateUserRole),
    asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, 'Invalid user ID');
        }
        if (String(req.user.id) === String(id)) {
            throw new ApiError(400, 'You cannot change your own role');
        }
        const target = await User.findById(id);
        if (!target) {
            throw new ApiError(404, 'User not found');
        }
        target.role = req.body.role;
        await target.save();
        const safe = await User.findById(id).select('-passwordHash -passwordSalt -pushTokens').lean();
        res.json({ msg: 'Role updated', user: safe });
    }),
];

// @desc    Admin: list reports (aggregated from users.reports)
// @route   GET /api/admin/reports
// @access  Admin
exports.listReports = asyncHandler(async (req, res, next) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const category = String(req.query.category || '').trim();
    const contentType = String(req.query.contentType || '').trim();

    const matchReport = {};
    if (category) matchReport['reports.category'] = category;
    if (contentType) matchReport['reports.contentType'] = contentType;

    const pipeline = [
        { $unwind: '$reports' },
        ...(Object.keys(matchReport).length ? [{ $match: matchReport }] : []),
        { $sort: { 'reports.createdAt': -1 } },
        {
            $project: {
                _id: 0,
                reportedUserId: '$_id',
                reportedUserName: '$displayName',
                reportedUserEmail: '$email',
                report: '$reports',
            },
        },
        {
            $facet: {
                items: [{ $skip: skip }, { $limit: limit }],
                total: [{ $count: 'count' }],
            },
        },
    ];

    const result = await User.aggregate(pipeline);
    const items = result[0]?.items || [];
    const total = result[0]?.total?.[0]?.count || 0;

    res.json({ reports: items, page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
});

// @desc    Admin: platform progress overview
// @route   GET /api/admin/overview
// @access  Admin
exports.getOverview = asyncHandler(async (req, res) => {
    const [users, posts, deals, openReports, openSubmissions, suspendedUsers] = await Promise.all([
        User.countDocuments({}),
        Post.countDocuments({ moderationStatus: 'visible' }),
        ContactRequest.countDocuments({ status: 'completed' }),
        SupportSubmission.countDocuments({ type: 'report', status: { $in: ['open', 'in_progress'] } }),
        SupportSubmission.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
        User.countDocuments({ accountStatus: { $in: ['suspended', 'banned'] } }),
    ]);

    res.json({ users, posts, deals, openReports, openSubmissions, suspendedUsers });
});

// @desc    Admin: update a user's account status (suspend/ban/restore)
// @route   PATCH /api/admin/users/:id/status
// @access  Admin
exports.updateUserStatus = [
    validate(schemas.adminUpdateUserStatus),
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, 'Invalid user ID');
        }
        if (String(req.user.id) === String(id)) {
            throw new ApiError(400, 'You cannot change your own account status');
        }
        const target = await User.findById(id);
        if (!target) {
            throw new ApiError(404, 'User not found');
        }

        target.accountStatus = req.body.status;
        await target.save();

        const safe = await User.findById(id)
            .select('-passwordHash -passwordSalt -pushTokens -blockedUsers -followers -following')
            .lean();
        res.json({ msg: 'Account status updated', user: safe });
    }),
];

// @desc    Admin: list posts for moderation
// @route   GET /api/admin/posts
// @access  Admin
exports.listPosts = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const q = String(req.query.q || '').trim();
    const moderationStatus = String(req.query.moderationStatus || '').trim();

    const filter = {};
    if (q) {
        const re = new RegExp(escapeRegex(q), 'i');
        filter.$or = [{ title: re }, { description: re }];
    }
    if (['visible', 'hidden', 'removed'].includes(moderationStatus)) {
        filter.moderationStatus = moderationStatus;
    }

    const [posts, total] = await Promise.all([
        Post.find(filter)
            .populate('user', 'displayName email avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Post.countDocuments(filter),
    ]);

    res.json({ posts, page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
});

// @desc    Admin: hide, restore or remove a post
// @route   PATCH /api/admin/posts/:id/moderation
// @access  Admin
exports.updatePostModeration = [
    validate(schemas.adminUpdatePostModeration),
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, 'Invalid post ID');
        }

        const post = await Post.findById(id);
        if (!post) {
            throw new ApiError(404, 'Post not found');
        }

        post.moderationStatus = req.body.moderationStatus;
        await post.save();

        res.json({ msg: 'Post moderation status updated', post });
    }),
];