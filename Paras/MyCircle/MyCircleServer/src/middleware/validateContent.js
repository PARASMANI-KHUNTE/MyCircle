const { checkContentSafety, checkImageSafety } = require('../config/gemini');
const { containsProfanity } = require('../utils/profanityFilter');
const fs = require('fs').promises;

/**
 * Middleware to validate post content for safety
 */
async function validatePostContent(req, res, next) {
    try {
        const { title, description } = req.body;

        // Quick profanity check first
        if (title && containsProfanity(title)) {
            return res.status(400).json({
                msg: 'Post title contains inappropriate language. Please be respectful.'
            });
        }

        if (description && containsProfanity(description)) {
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

        // Analyze image if present
        if (req.file) {
            const imageBuffer = await fs.readFile(req.file.path);
            const imageAnalysis = await checkImageSafety(imageBuffer, req.file.mimetype);

            if (!imageAnalysis.safe) {
                await fs.unlink(req.file.path).catch(console.error);
                return res.status(400).json({
                    msg: `Image Violation: ${imageAnalysis.reason || 'Potentially unsafe image'}`
                });
            }
        }

        next();
    } catch (error) {
        console.error('Content validation error:', error.message);
        next(); // Fail open
    }
}

/**
 * Middleware to validate profile content for safety
 */
async function validateProfileContent(req, res, next) {
    try {
        const { bio, displayName } = req.body;

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
        next(); // Fail open
    }
}

module.exports = {
    validatePostContent,
    validateProfileContent
};
