const {
    checkContentSafety,
    generateSuggestions,
    analyzePost,
    explainPost
} = require('../config/gemini');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// @desc    Moderate content (check for abuse)
// @route   POST /api/ai/moderate
// @access  Private
exports.moderateContent = asyncHandler(async (req, res, next) => {
    const { text } = req.body;
    if (!text) throw new ApiError(400, 'Text is required');

    const result = await checkContentSafety(text);
    res.json(result);
});

// @desc    Get chat suggestions
// @route   POST /api/ai/suggest
// @access  Private
exports.getSuggestions = asyncHandler(async (req, res, next) => {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
        throw new ApiError(400, 'Valid messages array required');
    }

    const suggestions = await generateSuggestions(messages);
    res.json({ suggestions });
});

// @desc    Analyze post
// @route   POST /api/ai/analyze-post
// @access  Private
exports.analyzePost = async (req, res, next) => {
    try {
        const { post } = req.body;
        if (!post) {
            return res.status(400).json({ msg: 'Post data required' });
        }

        const analysis = await analyzePost(post);
        res.json(analysis);
    } catch (err) {
        return next(err);
    }
};

// @desc    Explain post (Public)
// @route   POST /api/ai/explain-post
// @access  Private (Authenticated users)
exports.explainPost = async (req, res, next) => {
    try {
        const { post } = req.body;
        if (!post) {
            return res.status(400).json({ msg: 'Post data required' });
        }

        const explanation = await explainPost(post);
        res.json(explanation);
    } catch (err) {
        return next(err);
    }
};
