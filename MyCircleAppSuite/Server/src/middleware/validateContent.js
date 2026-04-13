const { checkContentSafety, checkImageSafety } = require('../config/groq');
const { containsProfanity } = require('../utils/profanityFilter');
const fs = require('fs').promises;
const ApiError = require('../utils/ApiError');

const POST_TYPES = new Set(['job', 'service', 'sell', 'rent', 'barter']);

function normalizeStringArray(value) {
    if (value === undefined) return undefined;
    if (Array.isArray(value)) {
        return value.map(item => String(item).trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
        return value
            .split(',')
            .map(item => item.trim())
            .filter(Boolean);
    }
    return undefined;
}

/**
 * Middleware to validate post content for safety
 */
async function validatePostContent(req, res, next) {
    try {
        const { title, description } = req.body;
        const trimmedTitle = typeof title === 'string' ? title.trim() : '';
        const trimmedDescription = typeof description === 'string' ? description.trim() : '';
        const trimmedLocation = typeof req.body.location === 'string' ? req.body.location.trim() : '';
        const trimmedType = typeof req.body.type === 'string' ? req.body.type.trim() : '';

        if (!trimmedTitle) {
            return res.status(400).json({ msg: 'Title is required' });
        }
        if (trimmedTitle.length > 200) {
            return res.status(400).json({ msg: 'Title too long' });
        }
        if (!trimmedDescription) {
            return res.status(400).json({ msg: 'Description is required' });
        }
        if (trimmedDescription.length > 5000) {
            return res.status(400).json({ msg: 'Description too long' });
        }
        if (!trimmedLocation) {
            return res.status(400).json({ msg: 'Location is required' });
        }
        if (!POST_TYPES.has(trimmedType)) {
            return res.status(400).json({ msg: 'Invalid post type' });
        }
        if (req.body.price !== undefined && req.body.price !== '') {
            const numericPrice = Number(req.body.price);
            if (!Number.isFinite(numericPrice) || numericPrice < 0) {
                return res.status(400).json({ msg: 'Price must be a valid non-negative number' });
            }
        }

        // Quick profanity check first
        if (trimmedTitle && containsProfanity(trimmedTitle)) {
            return res.status(400).json({
                msg: 'Post title contains inappropriate language. Please be respectful.'
            });
        }

        if (trimmedDescription && containsProfanity(trimmedDescription)) {
            return res.status(400).json({
                msg: 'Post description contains inappropriate language. Please be respectful.'
            });
        }

        // Combine text for a single AI check (more efficient)
        const textToAnalyze = `${title || ''} ${description || ''}`.trim();
        if (textToAnalyze) {
            const analysis = await checkContentSafety(textToAnalyze);
            if (!analysis.safe) {
                return res.status(400).json({
                    msg: `Content Violation: ${analysis.reason || 'Potentially unsafe content'}`
                });
            }
        }

        // Analyze all uploaded images (req.files is array from upload.array())
        const files = req.files || (req.file ? [req.file] : []);
        for (const file of files) {
            try {
                const imageBuffer = await fs.readFile(file.path);
                const imageAnalysis = await checkImageSafety(imageBuffer, file.mimetype);

                if (!imageAnalysis.safe) {
                    await fs.unlink(file.path).catch(console.error);
                    return res.status(400).json({
                        msg: `Image Violation: ${imageAnalysis.reason || 'Potentially unsafe image'}`
                    });
                }
            } catch (err) {
                console.error('Error processing image:', err.message);
                return next(new ApiError(503, 'Image moderation service unavailable'));
            }
        }

        next();
    } catch (error) {
        console.error('Content validation error:', error.message);
        next(new ApiError(503, 'Content moderation service unavailable'));
    }
}

/**
 * Middleware to validate profile content for safety
 */
async function validateProfileContent(req, res, next) {
    try {
        const bio = typeof req.body.bio === 'string' ? req.body.bio.trim() : req.body.bio;
        const displayName = typeof req.body.displayName === 'string' ? req.body.displayName.trim() : req.body.displayName;
        const skills = normalizeStringArray(req.body.skills ?? req.body['skills[]']);

        if (displayName !== undefined && displayName.length > 50) {
            return res.status(400).json({ msg: 'Display name too long' });
        }
        if (bio !== undefined && bio.length > 500) {
            return res.status(400).json({ msg: 'Bio is too long (max 500 characters)' });
        }
        if (skills && skills.some(skill => skill.length > 50)) {
            return res.status(400).json({ msg: 'Each skill must be 50 characters or fewer' });
        }

        if (displayName !== undefined) {
            req.body.displayName = displayName;
        }
        if (bio !== undefined) {
            req.body.bio = bio;
        }
        if (skills !== undefined) {
            req.body.skills = skills;
        }

        const textToAnalyze = `${displayName || ''} ${bio || ''}`.trim();
        if (textToAnalyze) {
            const analysis = await checkContentSafety(textToAnalyze);
            if (!analysis.safe) {
                return res.status(400).json({
                    msg: `Profile Violation: ${analysis.reason || 'Potentially unsafe content'}`
                });
            }
        }

        if (req.file) {
            const imageBuffer = await fs.readFile(req.file.path);
            const imageAnalysis = await checkImageSafety(imageBuffer, req.file.mimetype);

            if (!imageAnalysis.safe) {
                await fs.unlink(req.file.path).catch(console.error);
                return res.status(400).json({
                    msg: `Avatar Violation: ${imageAnalysis.reason || 'Potentially unsafe image'}`
                });
            }
        }

        next();
    } catch (error) {
        console.error('Profile validation error:', error.message);
        next(new ApiError(503, 'Profile moderation service unavailable'));
    }
}

module.exports = {
    validatePostContent,
    validateProfileContent
};
