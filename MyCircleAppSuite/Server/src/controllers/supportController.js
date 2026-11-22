const mongoose = require('mongoose');
const SupportSubmission = require('../models/SupportSubmission');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const parsePagination = (query) => ({
    page: Math.max(1, parseInt(query.page, 10) || 1),
    limit: Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20)),
});

const optionalObjectId = (value) => (value && mongoose.Types.ObjectId.isValid(value)
    ? new mongoose.Types.ObjectId(value)
    : undefined);

// @desc    Submit a report, help request or feedback item
// @route   POST /api/support/submissions
// @access  Private
exports.createSubmission = asyncHandler(async (req, res) => {
    const { type, message, category, subjectType, subjectId, reportedUserId } = req.body;
    const trimmedMessage = String(message || '').trim();

    if (type === 'report' && reportedUserId && String(reportedUserId) === String(req.user.id)) {
        throw new ApiError(400, 'You cannot report yourself');
    }

    const parsedReportedUserId = optionalObjectId(reportedUserId);
    const parsedSubjectId = optionalObjectId(subjectId);

    const submission = await SupportSubmission.create({
        type,
        status: 'open',
        reporter: req.user.id,
        reportedUser: type === 'report' ? parsedReportedUserId : undefined,
        subjectType: subjectType || (type === 'report' ? 'user' : 'other'),
        subjectId: parsedSubjectId,
        category: type === 'report' ? (category || 'other') : 'other',
        message: trimmedMessage,
    });

    res.status(201).json(submission);
});

// @desc    List the current user's submissions
// @route   GET /api/support/submissions
// @access  Private
exports.getMySubmissions = asyncHandler(async (req, res) => {
    const { page, limit } = parsePagination(req.query);
    const skip = (page - 1) * limit;

    const submissions = await SupportSubmission.find({ reporter: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    res.json({ submissions, page, limit });
});

// @desc    Admin: list and filter support submissions
// @route   GET /api/admin/submissions
// @access  Admin
exports.listSubmissions = asyncHandler(async (req, res) => {
    const { page, limit } = parsePagination(req.query);
    const skip = (page - 1) * limit;
    const filter = {};

    if (['report', 'help', 'feedback'].includes(req.query.type)) filter.type = req.query.type;
    if (['open', 'in_progress', 'resolved', 'dismissed'].includes(req.query.status)) filter.status = req.query.status;

    const [submissions, total] = await Promise.all([
        SupportSubmission.find(filter)
            .populate('reporter', 'displayName email avatar')
            .populate('reportedUser', 'displayName avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        SupportSubmission.countDocuments(filter),
    ]);

    res.json({ submissions, page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
});

// @desc    Admin: update a submission's status and response
// @route   PATCH /api/admin/submissions/:id
// @access  Admin
exports.updateSubmission = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid submission ID');
    }

    const submission = await SupportSubmission.findById(id);
    if (!submission) {
        throw new ApiError(404, 'Submission not found');
    }

    submission.status = req.body.status;
    submission.response = req.body.response || '';
    submission.respondedBy = req.user.id;
    submission.respondedAt = new Date();
    await submission.save();

    res.json(submission);
});
