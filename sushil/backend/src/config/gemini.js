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

module.exports = { checkContentSafety };
