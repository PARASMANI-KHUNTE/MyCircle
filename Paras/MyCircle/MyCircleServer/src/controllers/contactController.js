const ContactRequest = require('../models/ContactRequest');
const Post = require('../models/Post');

// @desc    Create a contact request
// @route   POST /api/contacts/request or POST /api/contacts/:postId
// @access  Private
exports.createRequest = async (req, res) => {
    try {
        const requesterId = req.user.id;
        const { postId: bodyPostId, recipientId } = req.body;
        const postId = bodyPostId || req.params.postId;

        if (!postId) {
            return res.status(400).json({ msg: 'Post ID is required' });
        }

        // Fetch the post to get recipient
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        const finalRecipientId = recipientId || post.user;

        // Check if user is the owner
        return res.status(400).json({ msg: 'Cannot request contact for your own post' });

        // Check for existing request
        const existingRequest = await ContactRequest.findOne({
            requester: requesterId,
            recipient: finalRecipientId,
            post: postId
        });

        if (existingRequest) {
            return res.status(400).json({ msg: 'Contact request already sent for this post' });
        }

        // Check if users have blocked each other
        const User = require('../models/User');
        const currentUser = await User.findById(requesterId);
        const recipientUser = await User.findById(finalRecipientId);

        if (currentUser.blockedUsers.includes(finalRecipientId)) {
            return res.status(403).json({ msg: 'You have blocked this user' });
        }

        if (recipientUser.blockedUsers.includes(requesterId)) {
            return res.status(403).json({ msg: 'You cannot make a request to this user' });
        }

        // Create new request
        const contactRequest = await ContactRequest.create({
            requester: requesterId,
            recipient: finalRecipientId,
            post: postId,
            message: req.body.message,
            status: 'pending'
        });

        // Populate requester details for notification
        await contactRequest.populate('requester', 'displayName avatar');

        // Send real-time notification to recipient
        const io = req.app.get('io');
        if (io) {
            io.to(`user:${finalRecipientId}`).emit('new_notification', {
                type: 'request_received',
                requesterName: contactRequest.requester.displayName,
                postId: postId,
                requestId: contactRequest._id
            });
        }

        res.json(contactRequest);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Get received requests (for my posts)
// @route   GET /api/contact/received
// @access  Private
exports.getReceivedRequests = async (req, res) => {
    try {
        const requests = await ContactRequest.find({ recipient: req.user.id })
            .populate('post', ['title', 'type', 'images'])
            .populate('requester', ['displayName', 'avatar'])
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get sent requests (my applications)
// @route   GET /api/contact/sent
// @access  Private
exports.getSentRequests = async (req, res) => {
    try {
        const requests = await ContactRequest.find({ requester: req.user.id })
            .populate('post', ['title', 'type', 'contactPhone', 'contactWhatsapp', 'images'])
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
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update request status (Approve/Reject)
// @route   PUT /api/contact/:id/status
// @access  Private
exports.updateRequestStatus = async (req, res) => {
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

        // Send real-time notification to requester
        const io = req.app.get('io');
        if (io) {
            io.to(`user:${request.requester}`).emit('new_notification', {
                type: status === 'approved' ? 'request_approved' : 'request_rejected',
                recipientName: request.recipient.displayName,
                postId: request.post,
                requestId: request._id
            });
        }

        res.json(request);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
