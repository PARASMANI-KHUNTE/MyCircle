const { GoogleGenerativeAI } = require('@google/generative-ai');
const natural = require('natural');
const Filter = require('bad-words');

// Configuration
const GEMINI_MODEL = "gemini-pro";

// Initialize Local NLP Tools
const tokenizer = new natural.WordTokenizer();
const Analyzer = natural.SentimentAnalyzer;
const stemmer = natural.PorterStemmer;
const analyzer = new Analyzer("English", stemmer, "afinn");
const profanityFilter = new Filter();

/**
 * Validates the Gemini API Key.
 */
const isKeyValid = () => {
    const key = process.env.GEMINI_API_KEY;
    return (key && key.trim() !== '' && key !== 'your_gemini_api_key_here');
};

/**
 * Get Gemini Model Instance
 */
const getModel = (modelName = GEMINI_MODEL) => {
    if (!isKeyValid()) return null;
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
        return genAI.getGenerativeModel({ model: modelName });
    } catch (e) {
        console.error(`Gemini Init Error:`, e.message);
        return null;
    }
};

/**
 * 1. Text Safety Check (Hybrid: Gemini -> Local Library Fallback)
 */
const checkContentSafety = async (text) => {
    if (!text || text.trim().length === 0) return { safe: true };

    // Try Gemini First
    const model = getModel();
    if (model) {
        try {
            const prompt = `Analyze logic text for safety. JSON: {"safe": boolean, "reason": "why"}. Text: "${text}"`;
            const result = await model.generateContent(prompt);
            const jsonText = result.response.text().match(/\{[\s\S]*\}/)?.[0];
            if (jsonText) {
                return JSON.parse(jsonText);
            }
        } catch (err) {
            console.warn("Gemini Safety Check Failed, trying Local Library...", err.message);
        }
    }

    // Fallback: Local Profanity Filter
    const isProfane = profanityFilter.isProfane(text);
    if (isProfane) {
        return { safe: false, reason: "Contains profanity (Local Filter)" };
    }
    return { safe: true };
};

/**
 * 2. Image Safety Check (Cloud Only -> Fail Open)
 */
const checkImageSafety = async (imageBuffer, mimeType) => {
    if (!imageBuffer) return { safe: true };

    // Gemini Vision
    const model = getModel("gemini-pro-vision"); // Or updated vision model name
    if (model) {
        try {
            const prompt = "Is this image safe for a public social media platform? JSON: {\"safe\": boolean, \"reason\": \"why\"}";
            const imagePart = {
                inlineData: {
                    data: imageBuffer.toString('base64'),
                    mimeType
                }
            };

            const result = await model.generateContent([prompt, imagePart]);
            const jsonText = result.response.text().match(/\{[\s\S]*\}/)?.[0];
            if (jsonText) {
                return JSON.parse(jsonText);
            }
        } catch (err) {
            console.warn("Gemini Vision Failed:", err.message);
        }
    }

    // Fallback: We cannot check images locally easily without heavy ML.
    // Fail Open (Allow) but log warning.
    return { safe: true, warning: 'Image moderation unavailable' };
};

/**
 * 3. Generate Suggestions (Gemini -> Static Fallback)
 */
const generateSuggestions = async (contextMessages) => {
    const contextStr = contextMessages.map(m => `${m.sender}: ${m.text}`).join('\n');
    const systemPrompt = `Suggest 3 short, polite replies. JSON: {"suggestions": []}. History:\n${contextStr}`;

    const model = getModel();
    if (model) {
        try {
            const result = await model.generateContent(systemPrompt);
            const jsonText = result.response.text().match(/\{[\s\S]*\}/)?.[0];
            if (jsonText) {
                return JSON.parse(jsonText).suggestions || [];
            }
        } catch (err) {
            console.warn("Gemini Suggestions Failed...", err.message);
        }
    }

    // Fallback: Static helpful replies
    return ["Interested!", "Is this still available?", "Can you tell me more?"];
};

/**
 * 4. Analyze & Explain Post (Hybrid: Gemini -> Local NLP)
 */
const analyzePost = async (postData) => {
    const prompt = `Analyze post: ${postData.title}, ${postData.description}, Price: ${postData.price}. 
    JSON: {"demandScore": 1-10, "demandLevel": "Low/High", "priceAnalysis": "sentence"}`;

    const model = getModel();
    if (model) {
        try {
            const result = await model.generateContent(prompt);
            const jsonText = result.response.text().match(/\{[\s\S]*\}/)?.[0];
            if (jsonText) {
                return JSON.parse(jsonText);
            }
        } catch (err) {
            console.warn("Gemini Analyze Failed, trying Local NLP...", err.message);
        }
    }

    // Fallback: Local NLP Sentiment Analysis
    const textToAnalyze = `${postData.title} ${postData.description}`;
    const tokens = tokenizer.tokenize(textToAnalyze);
    const sentiment = analyzer.getSentiment(tokens); // Score from -5 to 5 typically

    // Map sentiment to "Demand" (Rough proxy: Positive words = Higher demand/appeal)
    // Scale -1 to 1 -> 1 to 10
    const normalizedScore = Math.min(10, Math.max(1, Math.floor((sentiment + 1) * 5)));

    return {
        demandScore: normalizedScore,
        demandLevel: normalizedScore > 6 ? "High" : "Moderate",
        priceAnalysis: "AI Estimate (Local NLP Backup)"
    };
};

const explainPost = async (postData) => {
    const prompt = `Explain post: ${postData.title}, ${postData.description}. JSON: {"summary": "", "context": "", "interestingFacts": []}`;

    const model = getModel();
    if (model) {
        try {
            const result = await model.generateContent(prompt);
            const jsonText = result.response.text().match(/\{[\s\S]*\}/)?.[0];
            if (jsonText) {
                return JSON.parse(jsonText);
            }
        } catch (err) {
            console.warn("Gemini Explain Failed...", err.message);
        }
    }

    // Fallback: Simple extraction
    return {
        summary: postData.title,
        context: postData.description.substring(0, 100) + "...",
        interestingFacts: ["Detail extraction unavailable (Offline Mode)"],
        isFallback: true
    };
};

/**
 * 5. Placeholder Suggestions (Icons & GIF tags)
 */
const getPlaceholderSuggestions = async (title, description) => {
    const prompt = `Based on this post, suggest a relevant Lucide icon name and 3 keywords for a GIF.
    Title: "${title}"
    Description: "${description}"
    JSON format: {"icon": "IconName", "gifKeywords": ["tag1", "tag2", "tag3"]}`;

    const model = getModel();
    if (model) {
        try {
            const result = await model.generateContent(prompt);
            const jsonText = result.response.text().match(/\{[\s\S]*\}/)?.[0];
            if (jsonText) {
                return JSON.parse(jsonText);
            }
        } catch (err) {
            console.warn("Gemini Suggestions Failed...", err.message);
        }
    }

    // Fallback: Keyword matching
    const text = (title + " " + description).toLowerCase();
    let icon = "Zap";
    let keywords = ["abstract", "cool"];

    if (text.includes("phone") || text.includes("mobile")) { icon = "Smartphone"; keywords = ["technology", "phone"]; }
    else if (text.includes("car") || text.includes("vehicle")) { icon = "Car"; keywords = ["drive", "car", "fast"]; }
    else if (text.includes("home") || text.includes("house")) { icon = "Home"; keywords = ["house", "cozy"]; }
    else if (text.includes("game") || text.includes("console")) { icon = "Gamepad"; keywords = ["gaming", "fun"]; }

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

