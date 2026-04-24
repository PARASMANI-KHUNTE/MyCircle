const Groq = require('groq-sdk').default;
const natural = require('natural');
const Filter = require('bad-words');

// Configuration
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// Initialize Local NLP Tools (fallback)
const tokenizer = new natural.WordTokenizer();
const Analyzer = natural.SentimentAnalyzer;
const stemmer = natural.PorterStemmer;
const analyzer = new Analyzer('English', stemmer, 'afinn');
const profanityFilter = new Filter();

/**
 * Validates the Groq API Key.
 */
const isKeyValid = () => {
    const key = process.env.GROQ_API_KEY;
    return (key && key.trim() !== '' && key !== 'your_groq_api_key_here');
};

/**
 * Get Groq client instance
 */
const getClient = () => {
    if (!isKeyValid()) return null;
    try {
        return new Groq({ apiKey: process.env.GROQ_API_KEY.trim() });
    } catch (e) {
        console.error('Groq Init Error:', e.message);
        return null;
    }
};

/**
 * Helper: call Groq chat completions and parse JSON from response
 */
const askGroq = async (prompt, systemPrompt = 'You are a helpful assistant. Always respond with valid JSON only.') => {
    const client = getClient();
    if (!client) return null;

    const completion = await client.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 512
    });

    const text = completion.choices[0]?.message?.content || '';
    const jsonText = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/)?.[0];
    return jsonText ? JSON.parse(jsonText) : null;
};

/**
 * 1. Text Safety Check (Hybrid: Groq -> Local Library Fallback)
 * Focuses on truly harmful content: spam, scams, illegal, explicit,Harassment
 */
const BLOCKED_PATTERNS = [
    /buy.*followers/i,
    /fake.*review/i,
    /hack.*account/i,
    /essay.*writing/i,
    /homework.*help/i,
    /exam.*cheating/i,
    /contract.*cheating/i,
];

const checkContentSafety = async (text) => {
    if (!text || text.trim().length === 0) return { safe: true };

    // Quick local check first for obvious blocked terms
    for (const pattern of BLOCKED_PATTERNS) {
        if (pattern.test(text)) {
            return { safe: false, reason: 'This type of content is not allowed on our platform' };
        }
    }

    // Try Groq for nuanced content
    if (isKeyValid()) {
        try {
            const prompt = `Classify this marketplace post. Return JSON: {"safe": boolean, "reason": "brief reason"}.
Blocked categories: spam, scam, fraud, illegal services, explicit content, harassment.
Allowed: jobs, services for sale, rentals, barter, legitimate requests.
Text: "${text.substring(0, 500)}"`;
            const result = await askGroq(prompt);
            if (result && typeof result.safe === 'boolean') {
                if (!result.safe && result.reason) {
                    result.reason = 'This content is not allowed on our platform';
                }
                return result;
            }
        } catch (err) {
            console.warn('Groq Safety Check Failed, trying Local Library...', err.message);
        }
    }

    // Fallback: Local Profanity Filter
    const isProfane = profanityFilter.isProfane(text);
    if (isProfane) {
        return { safe: false, reason: 'Post contains inappropriate language' };
    }
    return { safe: true };
};

/**
 * 2. Image Safety Check (Fail Open — Groq doesn't support vision)
 */
const checkImageSafety = async (imageBuffer, mimeType) => {
    if (!imageBuffer) return { safe: true };

    // Groq does not support image/vision input.
    // Fail open with a warning so the app keeps working.
    return { safe: true, warning: 'Image moderation unavailable (Groq does not support vision)' };
};

/**
 * 3. Generate Suggestions (Groq -> Static Fallback)
 */
const generateSuggestions = async (contextMessages) => {
    const contextStr = contextMessages.map(m => `${m.sender}: ${m.text}`).join('\n');
    const prompt = `Based on this conversation, suggest 3 short, polite replies. Return JSON: {"suggestions": ["reply1", "reply2", "reply3"]}. Conversation:\n${contextStr}`;

    if (isKeyValid()) {
        try {
            const result = await askGroq(prompt);
            if (result && Array.isArray(result.suggestions)) {
                return result.suggestions;
            }
        } catch (err) {
            console.warn('Groq Suggestions Failed...', err.message);
        }
    }

    // Fallback: Static helpful replies
    return ['Interested!', 'Is this still available?', 'Can you tell me more?'];
};

/**
 * 4. Analyze Post (Groq -> Local NLP Fallback)
 */
const analyzePost = async (postData) => {
    const prompt = `Analyze this marketplace post and estimate demand. Return JSON: {"demandScore": 1-10, "demandLevel": "Low|Moderate|High", "priceAnalysis": "one sentence"}. Post title: "${postData.title}", description: "${postData.description}", price: ${postData.price}.`;

    if (isKeyValid()) {
        try {
            const result = await askGroq(prompt);
            if (result && result.demandScore) {
                return result;
            }
        } catch (err) {
            console.warn('Groq Analyze Failed, trying Local NLP...', err.message);
        }
    }

    // Fallback: Local NLP Sentiment Analysis
    const textToAnalyze = `${postData.title} ${postData.description}`;
    const tokens = tokenizer.tokenize(textToAnalyze);
    const sentiment = analyzer.getSentiment(tokens);
    const normalizedScore = Math.min(10, Math.max(1, Math.floor((sentiment + 1) * 5)));

    return {
        demandScore: normalizedScore,
        demandLevel: normalizedScore > 6 ? 'High' : 'Moderate',
        priceAnalysis: 'AI Estimate (Local NLP Backup)'
    };
};

/**
 * 5. Explain Post (Groq -> Simple Extraction Fallback)
 */
const explainPost = async (postData) => {
    const prompt = `Explain this marketplace post in a friendly way. Return JSON: {"summary": "one-sentence summary", "context": "helpful context", "interestingFacts": ["fact1", "fact2"]}. Title: "${postData.title}", description: "${postData.description}".`;

    if (isKeyValid()) {
        try {
            const result = await askGroq(prompt);
            if (result && result.summary) {
                return result;
            }
        } catch (err) {
            console.warn('Groq Explain Failed...', err.message);
        }
    }

    // Fallback: Simple extraction
    return {
        summary: postData.title,
        context: (postData.description || '').substring(0, 100) + '...',
        interestingFacts: ['Detail extraction unavailable (Offline Mode)'],
        isFallback: true
    };
};

/**
 * 6. Placeholder Suggestions — Icons & GIF tags (Groq -> Keyword Fallback)
 */
const getPlaceholderSuggestions = async (title, description) => {
    const prompt = `Based on this post, suggest a relevant Lucide icon name and 3 keywords for a GIF search. Return JSON: {"icon": "LucideIconName", "gifKeywords": ["tag1", "tag2", "tag3"]}. Title: "${title}", Description: "${description}".`;

    if (isKeyValid()) {
        try {
            const result = await askGroq(prompt);
            if (result && result.icon) {
                return result;
            }
        } catch (err) {
            console.warn('Groq Placeholder Suggestions Failed...', err.message);
        }
    }

    // Fallback: Keyword matching
    const text = (title + ' ' + description).toLowerCase();
    let icon = 'Zap';
    let keywords = ['abstract', 'cool'];

    if (text.includes('phone') || text.includes('mobile')) { icon = 'Smartphone'; keywords = ['technology', 'phone']; }
    else if (text.includes('car') || text.includes('vehicle')) { icon = 'Car'; keywords = ['drive', 'car', 'fast']; }
    else if (text.includes('home') || text.includes('house')) { icon = 'Home'; keywords = ['house', 'cozy']; }
    else if (text.includes('game') || text.includes('console')) { icon = 'Gamepad'; keywords = ['gaming', 'fun']; }

    return { icon, gifKeywords: keywords };
};

module.exports = {
    checkContentSafety,
    checkImageSafety,
    generateSuggestions,
    analyzePost,
    explainPost,
    getPlaceholderSuggestions
};
