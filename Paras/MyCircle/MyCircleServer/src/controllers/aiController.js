const { checkContentSafety, generateSuggestions } = require('../config/gemini');

// @desc    Moderate content (check for abuse)
// @route   POST /api/ai/moderate
// @access  Private
exports.moderateContent = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ message: 'Text is required' });

        const result = await checkContentSafety(text);
        res.json(result);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get chat suggestions
// @route   POST /api/ai/suggest
// @access  Private
exports.getSuggestions = async (req, res) => {
    try {
        const { messages } = req.body; // Array of { sender: 'user'|'other', text: '...' }
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ message: 'Valid messages array required' });
        }

        const suggestions = await generateSuggestions(messages);
        res.json({ suggestions });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Analyze post
// @route   POST /api/ai/analyze-post
// @access  Private
exports.analyzePost = async (req, res) => {
    try {
        const { post } = req.body;
        if (!post) {
            return res.status(400).json({ message: 'Post data required' });
        }

        const analysis = await require('../config/gemini').analyzePost(post);
        res.json(analysis);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
// @desc    Explain post (Public)
// @route   POST /api/ai/explain-post
// @access  Private (Authenticated users)
exports.explainPost = async (req, res) => {
    try {
        const { post } = req.body;
        console.log("explainPost Request received for:", post?.title);
        if (!post) {
            return res.status(400).json({ message: 'Post data required' });
        }

        const explanation = await require('../config/gemini').explainPost(post);
        console.log("explainPost Result:", explanation);
        res.json(explanation);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
