const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Validates the existence and basic format of the Gemini API Key.
 * @returns {boolean}
 */
const isKeyValid = () => {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key.trim() === '' || key === 'your_gemini_api_key_here') {
        return false;
    }
    return true;
};

const getModel = (modelName = "gemini-1.5-flash") => {
    if (!isKeyValid()) return null;
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        return genAI.getGenerativeModel({ model: modelName });
    } catch (e) {
        console.error("Gemini Initialization Error:", e.message);
        return null;
    }
};

/**
 * Unified text safety check
 */
const checkContentSafety = async (text) => {
    try {
        if (!text || text.trim().length === 0) return { safe: true };

        const model = getModel();
        if (!model) {
            console.warn("GEMINI_API_KEY missing or invalid. Skipping safety check.");
            return { safe: true, warning: 'AI moderation disabled' };
        }

        const prompt = `Analyze the following text for inappropriate content (sexual content, hate speech, violence, illegal acts, scams).
        Respond in JSON format: {"safe": boolean, "reason": "why if unsafe, else null"}
        Text: "${text}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();

        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return { safe: true };
    } catch (error) {
        console.error("Gemini Safety Check Error:", error.message);
        return { safe: true, error: "AI service error" };
    }
};

/**
 * Image safety check
 */
const checkImageSafety = async (imageBuffer, mimeType) => {
    try {
        if (!imageBuffer) return { safe: true };

        const model = getModel();
        if (!model) return { safe: true, warning: 'AI image moderation disabled' };

        const imagePart = {
            inlineData: {
                data: imageBuffer.toString('base64'),
                mimeType: mimeType
            }
        };

        const prompt = `Analyze this image for inappropriate content (explicit, violence, hate symbols, illegal).
        Respond in JSON format: {"safe": boolean, "reason": "why if unsafe, else null"}`;

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const textResponse = response.text();

        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return { safe: true };
    } catch (error) {
        console.error("Gemini Image Safety Error:", error.message);
        return { safe: true };
    }
};

const generateSuggestions = async (contextMessages) => {
    try {
        const model = getModel();
        if (!model) return ["Interested", "Available?", "Thanks"];

        const contextStr = contextMessages.map(m => `${m.sender}: ${m.text}`).join('\n');
        const prompt = `Based on this chat, suggest 3 short, polite quick replies.
        Respond in JSON: {"suggestions": ["s1", "s2", "s3"]}
        Chat:\n${contextStr}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const data = JSON.parse(response.text().match(/\{[\s\S]*\}/)[0]);
        return data.suggestions || [];
    } catch (error) {
        console.error("Gemini Suggestion Error:", error.message);
        return ["Interested", "Available?", "Thanks"];
    }
};

const analyzePost = async (postData) => {
    try {
        const model = getModel();
        if (!model) return { summary: "Post analysis unavailable.", tips: ["Add more details."], score: 80 };

        const prompt = `Analyze this post: Title: ${postData.title}, Desc: ${postData.description}.
        Provide JSON: {"summary": "string", "tips": ["t1", "t2"], "score": 0-100}`;

        const result = await model.generateContent(prompt);
        const data = JSON.parse((await result.response).text().match(/\{[\s\S]*\}/)[0]);
        return data;
    } catch (error) {
        console.error("Gemini Analysis Error:", error.message);
        return { summary: "Analysis failed.", tips: ["Try again later."], score: 0 };
    }
};

const explainPost = async (postData) => {
    try {
        const model = getModel();
        if (!model) return { summary: "Post explanation unavailable.", context: "Details in description.", interestingFacts: [] };

        const prompt = `Explain this post: Title: ${postData.title}, Desc: ${postData.description}.
        Provide JSON: {"summary": "string", "context": "string", "interestingFacts": ["f1", "f2"]}`;

        const result = await model.generateContent(prompt);
        const data = JSON.parse((await result.response).text().match(/\{[\s\S]*\}/)[0]);
        return data;
    } catch (error) {
        console.error("Gemini Explanation Error:", error.message);
        return { summary: "Explanation unavailable.", context: "", interestingFacts: [] };
    }
};

module.exports = {
    checkContentSafety,
    checkImageSafety,
    generateSuggestions,
    analyzePost,
    explainPost
};

