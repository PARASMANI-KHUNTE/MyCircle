const ContactRequest = require('../models/ContactRequest');
const Post = require('../models/Post');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const { createNotification } = require('./notificationController');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { applyNewRating, refreshTrustScore } = require('../utils/trustScore');

const normalizeRequestStatus = (status) => {
    if (status === 'approved') return 'accepted';
    return status;
};

const serializeRequest = (request, viewerId) => {
    const requestObject = request.toObject ? request.toObject() : request;
    const normalizedStatus = normalizeRequestStatus(requestObject.status);
    const viewerRole = requestObject.requester?._id?.toString?.() === viewerId || requestObject.requester?.toString?.() === viewerId
        ? 'requester'
        : 'recipient';
    const counterparty = viewerRole === 'requester' ? requestObject.recipient : requestObject.requester;
    const myRating = (requestObject.ratings || []).find(
        (rating) => rating.fromUser?.toString?.() === viewerId || rating.fromUser?._id?.toString?.() === viewerId
    );

    return {
        ...requestObject,
        status: normalizedStatus,
        conversationId: requestObject.conversationId || null,
        viewerRole,
        counterparty,
        canMarkComplete: normalizedStatus === 'accepted',
        canRate: normalizedStatus === 'completed' && !myRating,
        myRating: myRating || null,
    };
};

// @desc    Create a contact request
// @route   POST /api/contacts/request or POST /api/contacts/:postId
// @access  Private
exports.createRequest = asyncHandler(async (req, res) => {
    const requesterId = req.user.id;
    const { postId: bodyPostId, recipientId, message } = req.body || {};
    const postId = bodyPostId || req.params.postId;

    if (!postId) {
        throw new ApiError(400, 'Post ID is required');
    }

    // Fetch the post to get recipient
    const post = await Post.findById(postId);
    if (!post) {
        throw new ApiError(404, 'Post not found');
    }

    const finalRecipientId = recipientId || post.user;
    if (!finalRecipientId) {
        throw new ApiError(400, 'Post has no valid owner');
    }

    // Check if user is the owner
    if (post.user.toString() === requesterId) {
        throw new ApiError(400, 'Cannot request contact for your own post');
    }

    // Check for existing request
    const existingRequest = await ContactRequest.findOne({
        requester: requesterId,
        recipient: finalRecipientId,
        post: postId
    });

    if (existingRequest) {
        throw new ApiError(400, 'Contact request already sent for this post');
    }

    // Check if users have blocked each other
    const currentUser = await User.findById(requesterId);
    const recipientUser = await User.findById(finalRecipientId);

    if (!currentUser) throw new ApiError(404, 'User account not found');
    if (!recipientUser) throw new ApiError(404, 'Recipient no longer exists');

    // Use .some() for safer ID comparison in arrays
    const isBlockedByCurrent = currentUser.blockedUsers?.some(id => id.toString() === finalRecipientId.toString());
    if (isBlockedByCurrent) {
        throw new ApiError(403, 'You have blocked this user');
    }

    const isCurrentBlockedByRecipient = recipientUser.blockedUsers?.some(id => id.toString() === requesterId);
    if (isCurrentBlockedByRecipient) {
        throw new ApiError(403, 'You cannot make a request to this user');
    }

    // Check for cooldown (24 hours between requests to same post)
    const lastRequest = await ContactRequest.findOne({
        requester: requesterId,
        post: postId,
        status: { $in: ['rejected', 'expired'] }
    }).sort({ createdAt: -1 });

    if (lastRequest) {
        const hoursSinceLastRequest = (Date.now() - lastRequest.createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastRequest < 24) {
            const hoursRemaining = Math.ceil(24 - hoursSinceLastRequest);
            throw new ApiError(429, `Please wait ${hoursRemaining} hours before sending another request for this post`);
        }
    }

    // Create new request with 7-day expiry
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const contactRequest = await ContactRequest.create({
        requester: requesterId,
        recipient: finalRecipientId,
        post: postId,
        message: message,
        status: 'pending',
        expiresAt
    });

    // Populate requester details for notification
    await contactRequest.populate('requester', 'displayName avatar');

    // Send real-time notification to recipient
    const io = req.app.get('io');
    await createNotification(io, {
        recipient: finalRecipientId,
        sender: requesterId,
        type: 'request',
        title: 'New Contact Request',
        message: `${contactRequest.requester?.displayName || 'Someone'} sent you a request for your post: ${post.title}`,
        link: '/requests',
        relatedId: postId
    });

    res.json(serializeRequest(contactRequest, requesterId));
});

// @desc    Get received requests (for my posts)
// @route   GET /api/contact/received
// @access  Private
exports.getReceivedRequests = async (req, res, next) => {
    try {
        const requests = await ContactRequest.find({ recipient: req.user.id })
            .populate('post', ['title', 'type', 'images', 'price', 'budgetMin', 'budgetMax', 'duration', 'availability'])
            .populate('requester', ['displayName', 'avatar', 'rating', 'reputation'])
            .sort({ createdAt: -1 });

        res.json(requests.map((request) => serializeRequest(request, req.user.id)));
    } catch (err) {
        return next(err);
    }
};

// @desc    Get sent requests (my applications)
// @route   GET /api/contact/sent
// @access  Private
exports.getSentRequests = async (req, res, next) => {
    try {
        const requests = await ContactRequest.find({ requester: req.user.id })
            .populate('post', ['title', 'type', 'images', 'price', 'budgetMin', 'budgetMax', 'duration', 'availability'])
            .populate('recipient', ['displayName', 'avatar', 'rating', 'reputation'])
            .sort({ createdAt: -1 });

        // Filter out contact info if not approved! 
        // Although the population above gets it from Post, we should maybe be careful?
        // Actually, logic: If status is approved, frontend gets 'post' details which might have contact.
        // But let's be explicit: The *Post* model has fields contactPhone/Whatsapp.
        // We should primarily rely on the logic that if approved, allow access.

        // For MVP: We return the request. If approved, the frontend can call GetPost again to see contact 
        // OR we include it here only if approved.

        // Let's refine the response:
        const enrichedRequests = requests.map(reqObj => {
            const reqJson = serializeRequest(reqObj, req.user.id);
            if (reqJson.status !== 'accepted' && reqJson.status !== 'completed') {
                if (reqJson.post) {
                    delete reqJson.post.contactPhone;
                    delete reqJson.post.contactWhatsapp;
                }
            }
            return reqJson;
        });

        res.json(enrichedRequests);
    } catch (err) {
        return next(err);
    }
};

// @desc    Update request status (Approve/Reject)
// @route   PUT /api/contact/:id/status
// @access  Private
exports.updateRequestStatus = async (req, res, next) => {
    try {
        const requestedStatus = normalizeRequestStatus(req.body.status);
        if (!['accepted', 'rejected', 'completed', 'canceled'].includes(requestedStatus)) {
            return res.status(400).json({ msg: 'Invalid status' });
        }

        let request = await ContactRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ msg: 'Request not found' });
        }

        const requesterId = request.requester;
        const recipientId = request.recipient;
        const postId = request.post;

        const isRecipient = recipientId.toString() === req.user.id;
        const isRequester = requesterId.toString() === req.user.id;

        if (!isRecipient && !isRequester) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        if ((requestedStatus === 'accepted' || requestedStatus === 'rejected') && !isRecipient) {
            return res.status(403).json({ msg: 'Only the post owner can accept or reject a request' });
        }

        if ((requestedStatus === 'completed' || requestedStatus === 'canceled') && !isRecipient && !isRequester) {
            return res.status(403).json({ msg: 'Not authorized to update this request' });
        }

        if (requestedStatus === 'completed' && !['accepted', 'approved'].includes(request.status)) {
            return res.status(400).json({ msg: 'Only accepted requests can be completed' });
        }

        request.status = requestedStatus;
        if (requestedStatus === 'accepted' && !request.acceptedAt) {
            request.acceptedAt = new Date();
        }
        if (requestedStatus === 'completed') {
            request.completedAt = new Date();
            if (!request.completionMarkedBy.some((userId) => userId.toString() === req.user.id)) {
                request.completionMarkedBy.push(req.user.id);
            }
            
            // Update linked post to completed
            if (request.post) {
                const post = await Post.findById(request.post);
                if (post) {
                    post.status = 'completed';
                    post.completedAt = new Date();
                    await post.save();
                }
            }
        }
        await request.save();

        // Populate recipient details for notification
        await request.populate('recipient', 'displayName');
        await request.populate('requester', 'displayName');
        await request.populate('post', 'title user');

        // If approved, ensure a conversation exists
        let conversationId = null;
        if (requestedStatus === 'accepted') {
            const participants = [requesterId, recipientId];
            let conversation = await Conversation.findOne({
                participants: { $all: participants }
            });

            if (!conversation) {
                conversation = new Conversation({
                    participants,
                    postId // Link the conversation to the post
                });
                await conversation.save();
            }
            conversationId = conversation._id;
            request.conversationId = conversationId;
        }

        if (requestedStatus === 'completed') {
            const post = await Post.findById(request.post);
            if (post?.user?.toString() === request.recipient.toString()) {
                const provider = await User.findById(request.recipient);
                if (provider) {
                    provider.stats.tasksCompleted = (provider.stats.tasksCompleted || 0) + 1;
                    await refreshTrustScore(provider);
                }
            }
        }

        // Send real-time notification to requester
        const io = req.app.get('io');
        try {
            const isPositive = requestedStatus === 'accepted' || requestedStatus === 'completed';
            await createNotification(io, {
                recipient: isRecipient ? requesterId : recipientId,
                sender: req.user.id,
                type: requestedStatus === 'accepted' ? 'approval' : 'info',
                title: requestedStatus === 'accepted'
                    ? 'Request Accepted'
                    : requestedStatus === 'completed'
                        ? 'Work Marked Complete'
                        : requestedStatus === 'canceled'
                            ? 'Request Canceled'
                            : 'Request Rejected',
                message: `${isRecipient ? request.recipient?.displayName : request.requester?.displayName || 'User'} has ${requestedStatus} this request.`,
                link: '/requests',
                relatedId: postId,
                conversationId: conversationId
            });
        } catch (notifErr) {
            console.error('Failed to send notification for request status update:', notifErr);
        }

        const serializedRequest = serializeRequest(request, req.user.id);
        if (conversationId) {
            serializedRequest.conversationId = conversationId;
        }

        res.json(serializedRequest);
    } catch (err) {
        return next(err);
    }
};

// @desc    Rate a completed request counterparty
// @route   POST /api/contact/:id/rate
// @access  Private
exports.rateRequest = asyncHandler(async (req, res) => {
    const { score, review } = req.body;
    const numericScore = Number(score);

    if (!Number.isFinite(numericScore) || numericScore < 1 || numericScore > 5) {
        throw new ApiError(400, 'Score must be between 1 and 5');
    }

    const request = await ContactRequest.findById(req.params.id)
        .populate('requester', 'displayName')
        .populate('recipient', 'displayName');

    if (!request) {
        throw new ApiError(404, 'Request not found');
    }

    const isRequester = request.requester._id.toString() === req.user.id;
    const isRecipient = request.recipient._id.toString() === req.user.id;

    if (!isRequester && !isRecipient) {
        throw new ApiError(403, 'Not authorized to rate this request');
    }

    if (normalizeRequestStatus(request.status) !== 'completed') {
        throw new ApiError(400, 'You can only rate completed requests');
    }

    if (request.ratings.some((rating) => rating.fromUser.toString() === req.user.id)) {
        throw new ApiError(400, 'You have already rated this request');
    }

    const targetUserId = isRequester ? request.recipient._id : request.requester._id;
    request.ratings.push({
        fromUser: req.user.id,
        toUser: targetUserId,
        role: isRequester ? 'requester' : 'recipient',
        score: numericScore,
        review: review || ''
    });
    await request.save();

    const ratedUser = await User.findById(targetUserId);
    if (!ratedUser) {
        throw new ApiError(404, 'Rated user not found');
    }

    await applyNewRating(ratedUser, numericScore);

    const io = req.app.get('io');
    await createNotification(io, {
        recipient: targetUserId,
        sender: req.user.id,
        type: 'info',
        title: 'New Rating Received',
        message: `You received a ${numericScore}-star rating for completed work.`,
        link: '/requests',
        relatedId: request.post
    });

    res.json(serializeRequest(request, req.user.id));
});
// @desc    Delete a contact request (Withdraw/Clear)
// @route   DELETE /api/contact/:id
// @access  Private
exports.deleteRequest = async (req, res, next) => {
    try {
        const request = await ContactRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ msg: 'Request not found' });
        }

        // Verify user is either requester or recipient
        if (request.requester.toString() !== req.user.id && request.recipient.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await ContactRequest.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Request removed' });
    } catch (err) {
        return next(err);
    }
};
