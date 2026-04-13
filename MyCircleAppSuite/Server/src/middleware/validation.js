const { z } = require('zod');

const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errors = error.errors.map(err => ({
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

    createPost: z.object({
        title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
        description: z.string().max(5000, 'Description too long').optional(),
        type: z.enum(['job', 'service', 'sell', 'rent', 'barter']).optional(),
        price: z.number().min(0).optional(),
        location: z.string().optional(),
        images: z.array(z.string()).optional(),
        duration: z.number().optional(),
        isUrgent: z.boolean().optional(),
        exchangePreference: z.enum(['money', 'barter', 'flexible']).optional(),
        acceptsBarter: z.boolean().optional(),
    }),

    updateProfile: z.object({
        displayName: z.string().max(50, 'Display name too long').optional(),
        bio: z.string().max(500, 'Bio too long').optional(),
        location: z.object({
            type: z.literal('Point'),
            coordinates: z.array(z.number()).length(2),
        }).optional(),
        skills: z.array(z.string()).optional(),
        services: z.array(z.string()).optional(),
    }),

    blockUser: z.object({
        userId: z.string().min(1, 'User ID is required'),
    }),

    reportUser: z.object({
        reportedUserId: z.string().min(1, 'Reported user ID is required'),
        reason: z.string().min(1, 'Reason is required').max(1000, 'Reason too long'),
        contentType: z.enum(['post', 'comment', 'chat', 'profile', 'image']).optional(),
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
};

module.exports = { validate, schemas };