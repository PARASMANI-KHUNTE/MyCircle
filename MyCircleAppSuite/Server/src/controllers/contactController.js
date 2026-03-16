const ContactRequest = require('../models/ContactRequest');
const Post = require('../models/Post');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const { createNotification } = require('./notificationController');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

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

    res.json(contactRequest);
});

// @desc    Get received requests (for my posts)
// @route   GET /api/contact/received
// @access  Private
exports.getReceivedRequests = async (req, res, next) => {
    try {
        const requests = await ContactRequest.find({ recipient: req.user.id })
            .populate('post', ['title', 'type', 'images', 'price'])
            .populate('requester', ['displayName', 'avatar'])
            .sort({ createdAt: -1 });

        res.json(requests);
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
            .populate('post', ['title', 'type', 'images', 'price'])
            .populate('recipient', ['displayName', 'avatar'])
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
            const reqJson = reqObj.toObject();
            if (reqJson.status !== 'approved') {
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
        const { status } = req.body; // 'approved' or 'rejected'
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ msg: 'Invalid status' });
        }

        let request = await ContactRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ msg: 'Request not found' });
        }

        // Verify recipient is the logged in user
        if (request.recipient.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        request.status = status;
        await request.save();

        // Populate recipient details for notification
        await request.populate('recipient', 'displayName');

        // If approved, ensure a conversation exists
        let conversationId = null;
        if (status === 'approved') {
            let conversation = await Conversation.findOne({
                participants: { $all: [request.requester, req.user.id] }
            });

            if (!conversation) {
                conversation = new Conversation({
                    participants: [request.requester, req.user.id],
                    postId: request.post // Link the conversation to the post
                });
                await conversation.save();
            }
            conversationId = conversation._id;
        }

        // Send real-time notification to requester
        const io = req.app.get('io');
        try {
            await createNotification(io, {
                recipient: request.requester,
                sender: req.user.id,
                type: status === 'approved' ? 'approval' : 'info',
                title: status === 'approved' ? 'Request Approved' : 'Request Rejected',
                message: `${request.recipient?.displayName || 'User'} has ${status} your contact request.`,
                link: '/requests',
                relatedId: request.post,
                conversationId: conversationId
            });
        } catch (notifErr) {
            console.error('Failed to send notification for request status update:', notifErr);
        }

        res.json(request);
    } catch (err) {
        return next(err);
    }
};
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
