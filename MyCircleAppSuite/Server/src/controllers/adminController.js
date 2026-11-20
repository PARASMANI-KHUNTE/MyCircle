const mongoose = require('mongoose');
const User = require('../models/User');
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