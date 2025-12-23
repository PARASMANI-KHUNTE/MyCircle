const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const checkContentSafety = async (text) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.warn("GEMINI_API_KEY is missing. Skipping safety check (Dev Mode).");
            return { safe: true };
        }

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `
        You are a content moderation AI. Analyze the following text for:
        1. Fraud/Scams
        2. Toxicity/Hate Speech
        3. Illegal content
        
        Text: "${text}"
        
        Respond with valid JSON only:
        {
            "safe": boolean,
            "reason": "string (brief explanation if unsafe, else null)"
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();

        // Clean up markdown code blocks if present
        const jsonString = textResponse.replace(/^```json\n|\n```$/g, '').trim();

        const safetyResult = JSON.parse(jsonString);
        return safetyResult;

    } catch (error) {
        console.error("Gemini Safety Check Error:", error);
        // Fallback: Fail open or closed? 
        // For MVP, fail open (allow) but log error to avoid blocking users if AI is down.
        // Or fail closed (secure). Let's fail open for now with a warning log.
        return { safe: true, warning: "AI check failed" };
    }
};

const generateSuggestions = async (contextMessages) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return ["Hello", "How are you?", "Is this still available?"];
        }

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Format last few messages for context
        // contextMessages should be array of { sender: 'user'|'other', text: '...' }
        const contextStr = contextMessages.map(m => `${m.sender}: ${m.text}`).join('\n');

        const prompt = `
        Based on the following chat conversation, suggest 3 short, relevant, and polite quick replies for the user.
        Conversation:
        ${contextStr}
        
        Respond with valid JSON only:
        {
            "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();
        const jsonString = textResponse.replace(/^```json\n|\n```$/g, '').trim();
        const data = JSON.parse(jsonString);

        return data.suggestions || [];
    } catch (error) {
        console.error("Gemini Suggestion Error:", error);
        return ["Interested", "Available?", "Thanks"];
    }
};

const analyzePost = async (postData) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return {
                summary: "Your post is performing well.",
                tips: ["Try adding more photos to increase engagement.", "Share on social media."],
                score: 85
            };
        }

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `
        Analyze this post performance and content:
        Title: ${postData.title}
        Description: ${postData.description}
        Likes: ${postData.likes || 0}
        Shares: ${postData.shares || 0}
        
        Provide:
        1. A brief performance summary (1 sentence).
        2. 2 specific tips to improve engagement.
        3. A quality score (0-100).

        Respond with valid JSON only:
        {
            "summary": "string",
            "tips": ["tip1", "tip2"],
            "score": number
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();
        const jsonString = textResponse.replace(/^```json\n|\n```$/g, '').trim();
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        return {
            summary: "Analysis unavailable.",
            tips: ["Check back later."],
            score: 0
        };
    }
}

module.exports = { checkContentSafety, generateSuggestions, analyzePost };
