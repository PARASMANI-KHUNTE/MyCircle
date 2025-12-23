const ContactRequest = require('../models/ContactRequest');
const Post = require('../models/Post');

// @desc    Create a contact request
// @route   POST /api/contact/:postId
// @access  Private
const requestPopulation = [
    {
        path: 'post',
        select: ['title', 'type', 'contactPhone', 'contactWhatsapp', 'user'],
        populate: {
            path: 'user',
            select: ['contactPhone', 'contactWhatsapp', 'whatsappNumber'],
        },
    },
    { path: 'requester', select: ['displayName', 'avatar'] },
    { path: 'recipient', select: ['displayName', 'avatar'] },
];

const formatRequestResponse = (requestDoc, { hideContactIfPending = false } = {}) => {
    if (!requestDoc) return null;
    const request = requestDoc.toObject ? requestDoc.toObject() : { ...requestDoc };

    if (request.post) {
        const fallbackWhatsapp =
            request.post.contactWhatsapp ||
            request.post.contactPhone ||
            request.post.user?.contactWhatsapp ||
            request.post.user?.whatsappNumber ||
            request.post.user?.contactPhone;

        if (fallbackWhatsapp) {
            request.post.contactWhatsapp = fallbackWhatsapp;
        }

        if (request.post.user) {
            delete request.post.user;
        }

        if (hideContactIfPending && request.status !== 'approved') {
            delete request.post.contactWhatsapp;
            delete request.post.contactPhone;
        }
    }

    return request;
};

exports.createRequest = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Check if user is the owner
        if (post.user.toString() === req.user.id) {
            return res.status(400).json({ msg: 'Cannot request contact for your own post' });
        }

        // Check for existing request
        const existingRequest = await ContactRequest.findOne({
            post: req.params.postId,
            requester: req.user.id,
        });

        if (existingRequest) {
            return res.status(400).json({ msg: 'Request already sent' });
        }

        const newRequest = new ContactRequest({
            post: req.params.postId,
            requester: req.user.id,
            recipient: post.user,
            message: req.body.message,
        });

        let request = await newRequest.save();
        await request.populate(requestPopulation);

        res.json(formatRequestResponse(request));
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'Request already sent' });
        }
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get received requests (for my posts)
// @route   GET /api/contact/received
// @access  Private
exports.getReceivedRequests = async (req, res) => {
    try {
        const requests = await ContactRequest.find({ recipient: req.user.id })
            .populate(requestPopulation[0])
            .populate(requestPopulation[1])
            .sort({ createdAt: -1 });

        const response = requests.map((reqDoc) => formatRequestResponse(reqDoc));
        res.json(response);
    } catch (err) {
        console.error('getReceivedRequests error:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
};

// @desc    Get sent requests (my applications)
// @route   GET /api/contact/sent
// @access  Private
exports.getSentRequests = async (req, res) => {
    try {
        const requests = await ContactRequest.find({ requester: req.user.id })
            .populate(requestPopulation[0])
            .populate(requestPopulation[2])
            .sort({ createdAt: -1 });

        const response = requests.map((reqDoc) =>
            formatRequestResponse(reqDoc, { hideContactIfPending: true })
        );

        res.json(response);
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

        const request = await ContactRequest.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user.id },
            { status },
            { new: true }
        );

        if (!request) {
            return res.status(404).json({ msg: 'Request not found or not authorized' });
        }

        await request.populate(requestPopulation);

        res.json(formatRequestResponse(request));
    } catch (err) {
        console.error('updateRequestStatus error:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
};
