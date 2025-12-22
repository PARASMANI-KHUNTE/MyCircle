const { analyzeText, analyzeImage } = require('../services/aiService');
const { containsProfanity } = require('../utils/profanityFilter');
const fs = require('fs').promises;

/**
 * Middleware to validate post content for safety
 */
async function validatePostContent(req, res, next) {
    try {
        const { title, description } = req.body;

        // Quick profanity check first (faster than AI)
        if (title && containsProfanity(title)) {
            return res.status(400).json({
                error: 'Content Violation',
                message: 'Post title contains inappropriate language. Please be respectful.'
            });
        }

        if (description && containsProfanity(description)) {
            return res.status(400).json({
                error: 'Content Violation',
                message: 'Post description contains inappropriate language. Please be respectful.'
            });
        }

        // Analyze title with AI
        if (title) {
            const titleAnalysis = await analyzeText(title);
            if (!titleAnalysis.safe) {
                return res.status(400).json({
                    error: 'Content Violation',
                    message: `Post title contains inappropriate content: ${titleAnalysis.reason}`
                });
            }
        }

        // Analyze description with AI
        if (description) {
            const descAnalysis = await analyzeText(description);
            if (!descAnalysis.safe) {
                return res.status(400).json({
                    error: 'Content Violation',
                    message: `Post description contains inappropriate content: ${descAnalysis.reason}`
                });
            }
        }

        // Analyze image if present
        if (req.file) {
            const imageBuffer = await fs.readFile(req.file.path);
            const imageAnalysis = await analyzeImage(imageBuffer, req.file.mimetype);

            if (!imageAnalysis.safe) {
                // Delete the uploaded file
                await fs.unlink(req.file.path).catch(console.error);

                return res.status(400).json({
                    error: 'Content Violation',
                    message: `Image contains inappropriate content: ${imageAnalysis.reason}`
                });
            }
        }

        next();
    } catch (error) {
        console.error('Content validation error:', error);
        // Fail open - allow content if validation fails
        next();
    }
}

/**
 * Middleware to validate profile content for safety
 */
async function validateProfileContent(req, res, next) {
    try {
        const { bio, displayName } = req.body;

        // Analyze display name
        if (displayName) {
            const nameAnalysis = await analyzeText(displayName);
            if (!nameAnalysis.safe) {
                return res.status(400).json({
                    error: 'Content Violation',
                    message: `Display name contains inappropriate content: ${nameAnalysis.reason}`
                });
            }
        }

        // Analyze bio
        if (bio) {
            const bioAnalysis = await analyzeText(bio);
            if (!bioAnalysis.safe) {
                return res.status(400).json({
                    error: 'Content Violation',
                    message: `Bio contains inappropriate content: ${bioAnalysis.reason}`
                });
            }
        }

        // Analyze avatar if present
        if (req.file) {
            const imageBuffer = await fs.readFile(req.file.path);
            const imageAnalysis = await analyzeImage(imageBuffer, req.file.mimetype);

            if (!imageAnalysis.safe) {
                // Delete the uploaded file
                await fs.unlink(req.file.path).catch(console.error);

                return res.status(400).json({
                    error: 'Content Violation',
                    message: `Avatar image contains inappropriate content: ${imageAnalysis.reason}`
                });
            }
        }

        next();
    } catch (error) {
        console.error('Profile validation error:', error);
        // Fail open - allow content if validation fails
        next();
    }
}

module.exports = {
    validatePostContent,
    validateProfileContent
};
