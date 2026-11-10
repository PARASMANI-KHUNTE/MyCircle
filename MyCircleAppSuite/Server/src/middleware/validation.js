const { z } = require('zod');
const { POST_TYPES, EXCHANGE_PREFERENCES } = require('../constants/postTypes');

const validate = (schema) => (req, res, next) => {
    try {
        // Assign the parsed (type-coerced) result back so controllers
        // receive validated data, not the raw request body.
        req.body = schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errors = error.issues.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));
            return res.status(400).json({ 
                message: 'Validation failed', 
                errors 
            });
        }
        next(error);
    }
};

const schemas = {
    sendMessage: z.object({
        recipientId: z.string().min(1, 'Recipient ID is required'),
        text: z.string().min(1, 'Message text is required').max(5000, 'Message too long'),
        postId: z.string().optional(),
    }),

    sendMessageToConversation: z.object({
        text: z.string().min(1, 'Message text is required').max(5000, 'Message too long'),
    }),

    createPost: z.object({
        title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
        description: z.string().max(5000, 'Description too long').optional(),
        type: z.enum(POST_TYPES).optional(),
        price: z.number().min(0).optional(),
        location: z.string().optional(),
        images: z.array(z.string()).optional(),
        duration: z.number().optional(),
        isUrgent: z.boolean().optional(),
        exchangePreference: z.enum(EXCHANGE_PREFERENCES).optional(),
        acceptsBarter: z.boolean().optional(),
    }),

    updateProfile: z.object({
        displayName: z.string().min(1, 'Display name cannot be empty').max(50, 'Display name too long').optional(),
        bio: z.string().max(500, 'Bio too long').optional(),
        // User.location is a plain string (e.g. "Mumbai"), not a GeoJSON object
        location: z.string().max(200, 'Location too long').optional(),
        skills: z.array(z.string().max(50, 'Skill too long')).max(20, 'Too many skills').optional(),
    }),

    blockUser: z.object({
        userId: z.string().min(1, 'User ID is required'),
    }),

    reportUser: z.object({
        reportedUserId: z.string().min(1, 'Reported user ID is required'),
        reason: z.string().min(3, 'Reason is required').max(1000, 'Reason too long'),
        category: z.enum(['spam', 'harassment', 'scam', 'impersonation', 'hate_speech', 'nudity', 'violence', 'other']).optional(),
        contentType: z.enum(['post', 'comment', 'chat', 'profile', 'image', 'user']).optional(),
        contentId: z.string().optional(),
    }),

    createContactRequest: z.object({
        recipientId: z.string().min(1, 'Recipient ID is required'),
        message: z.string().max(500, 'Message too long').optional(),
    }),

    searchUsers: z.object({
        q: z.string().optional(),
        skills: z.string().optional(),
        location: z.string().optional(),
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(50).default(20),
    }),

    rateRequest: z.object({
        score: z.coerce.number().min(1).max(5),
        review: z.string().max(300, 'Review too long').optional(),
    }),
};

module.exports = { validate, schemas };
