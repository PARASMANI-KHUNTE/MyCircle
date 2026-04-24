const User = require('../models/User');
const Post = require('../models/Post');
const ContactRequest = require('../models/ContactRequest');
const Conversation = require('../models/Conversation');
const { admin } = require('../config/firebase');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const mongoose = require('mongoose');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const buildUserPairQuery = (firstUserId, secondUserId) => ({
    $or: [
        { requester: firstUserId, recipient: secondUserId },
        { requester: secondUserId, recipient: firstUserId }
    ]
});

const normalizeText = (value) => typeof value === 'string'
    ? value.replace(/\s+/g, ' ').trim()
    : '';

// @desc    Get current user profile
// @route   GET /api/user/profile
// @access  Private
exports.getUserProfile = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('-passwordHash -passwordSalt');
    if (!user) {
        throw new ApiError(404, 'User not found');
    }
    res.json(user);
});

// @desc    Get Firebase Custom Token for authenticated user
// @route   GET /api/user/firebase-token
// @access  Private
exports.getFirebaseToken = asyncHandler(async (req, res, next) => {
    if (!admin) {
        throw new ApiError(500, 'Firebase Admin SDK not initialized');
    }
    
    // Create a custom token for the user using their MongoDB ID
    const customToken = await admin.auth().createCustomToken(req.user.id.toString());
    
    res.json({ token: customToken });
});

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
exports.updateUserProfile = asyncHandler(async (req, res, next) => {
    const {
        displayName,
        bio,
        contactPhone,
        contactWhatsapp,
        location
    } = req.body;
    const rawSkills = req.body.skills ?? req.body['skills[]'];

    const user = await User.findById(req.user.id);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    // Simple validation
    if (bio && bio.length > 500) {
        throw new ApiError(400, 'Bio is too long (max 500 characters)');
    }

    // Update fields
    if (displayName !== undefined) user.displayName = displayName.trim();
    if (bio !== undefined) user.bio = bio;
    if (contactPhone !== undefined) user.contactPhone = contactPhone;
    if (contactWhatsapp !== undefined) user.contactWhatsapp = contactWhatsapp;
    if (location !== undefined) user.location = location;

    // Ensure skills is an array
    if (rawSkills !== undefined) {
        user.skills = Array.isArray(rawSkills)
            ? rawSkills.map(skill => String(skill).trim()).filter(Boolean)
            : (typeof rawSkills === 'string'
                ? rawSkills.split(',').map(s => s.trim()).filter(Boolean)
                : user.skills);
    }

    if (req.file) user.avatar = req.file.path;

    await user.save();
    res.json(user);
});

// @desc    Get user statistics
// @route   GET /api/user/stats
// @access  Private
exports.getUserStats = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Calculate dynamic stats
        const postCount = await Post.countDocuments({ user: req.user.id });
        const activePostCount = await Post.countDocuments({ user: req.user.id, isActive: true });
        const receivedRequestsCount = await ContactRequest.countDocuments({ recipient: req.user.id });

        // Update user stats in DB (sync)
        user.stats.totalPosts = postCount;
        user.stats.activePosts = activePostCount;
        // Optionally add to schema if we want to persist it, but for now we just return it

        await user.save();

        res.json({
            stats: {
                ...user.stats.toObject(),
                receivedRequests: receivedRequestsCount
            },
            rating: user.rating,
            reviews: user.reviews,
            joined: user.createdAt
        });
    } catch (err) {
        return next(err);
    }
};

// @desc    Update user settings
// @route   PUT /api/user/settings
// @access  Private
exports.updateUserSettings = async (req, res, next) => {
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
        return next(err);
    }
};

// @desc    Block a user
// @route   POST /api/user/block/:userId
// @access  Private
exports.blockUser = async (req, res, next) => {
    try {
        const userToBlockId = req.params.userId;
        if (!mongoose.Types.ObjectId.isValid(userToBlockId)) {
            return res.status(400).json({ msg: 'Invalid user ID' });
        }
        if (userToBlockId === req.user.id) {
            return res.status(400).json({ msg: 'You cannot block yourself' });
        }
        const [user, userToBlock] = await Promise.all([
            User.findById(req.user.id),
            User.findById(userToBlockId).select('displayName')
        ]);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        if (!userToBlock) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const alreadyBlocked = user.blockedUsers.some(id => id.toString() === userToBlockId);

        if (!alreadyBlocked) {
            user.blockedUsers.push(userToBlockId);
        }

        user.following = (user.following || []).filter(id => id.toString() !== userToBlockId);
        user.followers = (user.followers || []).filter(id => id.toString() !== userToBlockId);
        if (user.stats) {
            user.stats.followingCount = user.following.length;
            user.stats.followersCount = user.followers.length;
        }

        await Promise.all([
            user.save(),
            User.findByIdAndUpdate(userToBlockId, [
                {
                    $set: {
                        following: {
                            $filter: {
                                input: '$following',
                                as: 'followedUser',
                                cond: { $ne: ['$$followedUser', new mongoose.Types.ObjectId(req.user.id)] }
                            }
                        },
                        followers: {
                            $filter: {
                                input: '$followers',
                                as: 'followerUser',
                                cond: { $ne: ['$$followerUser', new mongoose.Types.ObjectId(req.user.id)] }
                            }
                        }
                    }
                },
                {
                    $set: {
                        'stats.followingCount': { $size: '$following' },
                        'stats.followersCount': { $size: '$followers' }
                    }
                }
            ]),
        ]);

        const [deletedRequestsResult] = await Promise.all([
            ContactRequest.deleteMany(buildUserPairQuery(req.user.id, userToBlockId)),
            Conversation.updateMany(
                { participants: { $all: [req.user.id, userToBlockId] } },
                { $addToSet: { deletedBy: req.user.id } }
            )
        ]);

        res.json({
            msg: alreadyBlocked
                ? `${userToBlock.displayName} was already blocked. Existing chat and request links were cleaned up.`
                : `${userToBlock.displayName} has been blocked. You will no longer be able to message each other.`,
            blockedUserId: userToBlockId,
            alreadyBlocked,
            requestsRemoved: deletedRequestsResult.deletedCount || 0,
            conversationsHidden: true
        });
    } catch (err) {
        return next(err);
    }
};

// @desc    Unblock a user
// @route   POST /api/user/unblock/:userId
// @access  Private
exports.unblockUser = async (req, res, next) => {
    try {
        const userToUnblockId = req.params.userId;
        if (!mongoose.Types.ObjectId.isValid(userToUnblockId)) {
            return res.status(400).json({ msg: 'Invalid user ID' });
        }
        const user = await User.findById(req.user.id);
        const userToUnblock = await User.findById(userToUnblockId).select('displayName');

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        if (!userToUnblock) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const wasBlocked = user.blockedUsers.some(id => id.toString() === userToUnblockId);

        user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== userToUnblockId);
        await user.save();

        res.json({
            msg: wasBlocked
                ? `${userToUnblock.displayName} has been unblocked. They can contact you again if a valid connection exists.`
                : `${userToUnblock.displayName} was not blocked.`,
            unblockedUserId: userToUnblockId,
            wasBlocked
        });
    } catch (err) {
        return next(err);
    }
};

// @desc    Get blocked users list
// @route   GET /api/user/blocked
// @access  Private
exports.getBlockedUsers = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).populate('blockedUsers', 'displayName avatar bio location');
        res.json(user.blockedUsers || []);
    } catch (err) {
        return next(err);
    }
};

// @desc    Report a user
// @route   POST /api/user/report
// @access  Private
exports.reportUser = async (req, res, next) => {
    try {
        const { reason, category = 'other', contentType = 'user', contentId, reportedUserId } = req.body;
        const normalizedReason = normalizeText(reason);

        if (reportedUserId === req.user.id) {
            return res.status(400).json({ msg: 'You cannot report yourself' });
        }
        if (!mongoose.Types.ObjectId.isValid(reportedUserId)) {
            return res.status(400).json({ msg: 'Invalid reported user ID' });
        }
        if (normalizedReason.length < 3) {
            return res.status(400).json({ msg: 'Please provide a little more detail for the report.' });
        }

        const reportedUser = await User.findById(reportedUserId);
        if (!reportedUser) return res.status(404).json({ msg: 'User not found' });

        const normalizedContentId = contentId && mongoose.Types.ObjectId.isValid(contentId)
            ? new mongoose.Types.ObjectId(contentId)
            : undefined;
        const duplicateReport = (reportedUser.reports || []).find((report) => (
            report.reporter?.toString() === req.user.id &&
            report.contentType === contentType &&
            String(report.contentId || '') === String(normalizedContentId || '') &&
            Date.now() - new Date(report.createdAt).getTime() < 24 * 60 * 60 * 1000
        ));

        if (duplicateReport) {
            return res.status(409).json({
                msg: 'You already reported this recently. Our team will review the existing report.'
            });
        }

        reportedUser.reports.push({
            reporter: req.user.id,
            category,
            reason: normalizedReason,
            contentType,
            ...(normalizedContentId ? { contentId: normalizedContentId } : {})
        });
        await reportedUser.save();

        res.status(201).json({
            msg: 'Report submitted. Our team will review it and take action if needed.',
            category,
            contentType
        });
    } catch (err) {
        return next(err);
    }
};

// @desc    Get user connections (approved contact requests)
// @route   GET /api/user/connections
// @access  Private
exports.getConnections = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Find all approved contact requests involving the user
        const connections = await ContactRequest.find({
            $or: [
                { requester: userId, status: { $in: ['accepted', 'approved'] } },
                { recipient: userId, status: { $in: ['accepted', 'approved'] } }
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
        return next(err);
    }
};

// @desc    Get user by ID (Public Profile)
// @route   GET /api/user/:userId
// @access  Private
exports.getUserById = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.userId).select('-passwordHash -passwordSalt -preferences -blockedUsers');
    if (!user) {
        throw new ApiError(404, 'User not found');
    }
    res.json(user);
});

// @desc    Follow a user
// @route   POST /api/user/follow/:userId
// @access  Private
exports.followUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.id;

        if (userId === currentUserId) {
            return res.status(400).json({ msg: 'You cannot follow yourself' });
        }

        const userToFollow = await User.findById(userId);
        const currentUser = await User.findById(currentUserId);

        if (!userToFollow) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if already following
            if ((currentUser.following || []).some(id => id.toString() === userId)) {
                return res.status(400).json({ msg: 'Already following this user' });
            }

        // Add to following/followers arrays
        currentUser.following.push(userId);
        userToFollow.followers.push(currentUserId);

        // Update stats
        currentUser.stats.followingCount = currentUser.following.length;
        userToFollow.stats.followersCount = userToFollow.followers.length;

        await currentUser.save();
        await userToFollow.save();

        res.json({ msg: 'User followed successfully', followingCount: currentUser.stats.followingCount });
    } catch (err) {
        return next(err);
    }
};

// @desc    Unfollow a user
// @route   DELETE /api/user/unfollow/:userId
// @access  Private
exports.unfollowUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.id;

        const userToUnfollow = await User.findById(userId);
        const currentUser = await User.findById(currentUserId);

        if (!userToUnfollow) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Remove from following/followers arrays
        currentUser.following = currentUser.following.filter(id => id.toString() !== userId);
        userToUnfollow.followers = userToUnfollow.followers.filter(id => id.toString() !== currentUserId);

        // Update stats
        currentUser.stats.followingCount = currentUser.following.length;
        userToUnfollow.stats.followersCount = userToUnfollow.followers.length;

        await currentUser.save();
        await userToUnfollow.save();

        res.json({ msg: 'User unfollowed successfully', followingCount: currentUser.stats.followingCount });
    } catch (err) {
        return next(err);
    }
};

// @desc    Get followers list
// @route   GET /api/user/:userId/followers
// @access  Private
exports.getFollowers = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).populate('followers', 'displayName avatar bio location');

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user.followers);
    } catch (err) {
        return next(err);
    }
};

// @desc    Get following list
// @route   GET /api/user/:userId/following
// @access  Private
exports.getFollowing = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).populate('following', 'displayName avatar bio location');

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user.following);
    } catch (err) {
        return next(err);
    }
};
// @desc    Endorse a user's skill
// @route   POST /api/user/endorse/:userId
// @access  Private
exports.endorseSkill = async (req, res, next) => {
    try {
        const { skill } = req.body;
        const targetUserId = req.params.userId;
        const endorserId = req.user.id;

        if (targetUserId === endorserId) {
            return res.status(400).json({ msg: 'You cannot endorse yourself' });
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Initialize skillEndorsements if undefined
        if (!targetUser.skillEndorsements) {
            targetUser.skillEndorsements = [];
        }

        let skillEntry = targetUser.skillEndorsements.find(e => e.skill.toLowerCase() === skill.toLowerCase());

        if (skillEntry) {
            // Check if already endorsed
            if ((skillEntry.endorsedBy || []).some(id => id.toString() === endorserId)) {
                return res.status(400).json({ msg: 'You have already endorsed this skill for this user' });
            }
            skillEntry.count += 1;
            skillEntry.endorsedBy.push(endorserId);
        } else {
            // Add new skill endorsement
            targetUser.skillEndorsements.push({
                skill: skill,
                count: 1,
                endorsedBy: [endorserId]
            });
        }

        await targetUser.save();
        res.json({ msg: 'Skill endorsed successfully', skillEndorsements: targetUser.skillEndorsements });

    } catch (err) {
        return next(err);
    }
};

// @desc    Get services (Search users by skill)
// @route   GET /api/user/services
// @access  Public (or Private)
exports.getServices = async (req, res, next) => {
    try {
        const { sort } = req.query;
        const skill = req.query.skill ? req.query.skill.trim() : '';
        if (skill.length > 100) {
            return res.status(400).json({ msg: 'Skill query is too long' });
        }
        const safeSkillRegex = skill ? escapeRegex(skill) : '';
        let query = {};

        if (skill) {
            // Flexible search: Case-insensitive regex for skills array OR skillEndorsements
            query.$or = [
                { skills: { $regex: safeSkillRegex, $options: 'i' } },
                { 'skillEndorsements.skill': { $regex: safeSkillRegex, $options: 'i' } }
            ];
        }


        let services = await User.find(query)
            .select('displayName avatar bio skills skillEndorsements rating reviews location stats')
            .lean(); // Use lean for performance since we'll process it


        // Process results to add a specific sortable "endorsement count" for the searched skill
        if (skill) {
            services = services.map(user => {
                const endorsement = user.skillEndorsements?.find(e => e.skill.toLowerCase() === skill.toLowerCase());
                return {
                    ...user,
                    relevanceEndorsements: endorsement ? endorsement.count : 0
                };
            });
        }

        // Sorting
        if (sort === 'rating') {
            services.sort((a, b) => b.rating - a.rating);
        } else if (sort === 'endorsements') {
            // Sort by specific skill endorsement if searching, otherwise total endorsements
            if (skill) {
                services.sort((a, b) => b.relevanceEndorsements - a.relevanceEndorsements);
            } else {
                const getTotalEndorsements = (u) => u.skillEndorsements?.reduce((acc, curr) => acc + curr.count, 0) || 0;
                services.sort((a, b) => getTotalEndorsements(b) - getTotalEndorsements(a));
            }
        }

        res.json(services);
    } catch (err) {
        return next(err);
    }
};
