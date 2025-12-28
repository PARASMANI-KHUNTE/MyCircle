const {
    checkContentSafety,
    generateSuggestions,
    analyzePost,
    explainPost
} = require('../config/gemini');

// @desc    Moderate content (check for abuse)
// @route   POST /api/ai/moderate
// @access  Private
exports.moderateContent = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ msg: 'Text is required' });

        const result = await checkContentSafety(text);
        res.json(result);
    } catch (err) {
        return next(err);
    }
};

// @desc    Get chat suggestions
// @route   POST /api/ai/suggest
// @access  Private
exports.getSuggestions = async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ msg: 'Valid messages array required' });
        }

        const suggestions = await generateSuggestions(messages);
        res.json({ suggestions });
    } catch (err) {
        return next(err);
    }
};

// @desc    Analyze post
// @route   POST /api/ai/analyze-post
// @access  Private
exports.analyzePost = async (req, res) => {
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
exports.explainPost = async (req, res) => {
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
