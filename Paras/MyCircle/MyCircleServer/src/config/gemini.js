const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const FormData = require('form-data');

// Configuration
const GEMINI_MODEL = "gemini-pro"; // Using legacy stable name
const LOCAL_AI_URL = "http://localhost:8000";

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
const getModel = () => {
    if (!isKeyValid()) return null;
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
        return genAI.getGenerativeModel({ model: GEMINI_MODEL });
    } catch (e) {
        console.error(`Gemini Init Error:`, e.message);
        return null;
    }
};

/**
 * Helper: Call Local AI Server (Fallback/Hybrid)
 */
const callLocalAI = async (endpoint, payload, isMultipart = false) => {
    try {
        const url = `${LOCAL_AI_URL}${endpoint}`;
        const headers = {
            'X-Internal-Secret': process.env.API_SECRET_KEY || 'dev_secret',
            ...(isMultipart ? payload.getHeaders() : {})
        };

        const response = await axios.post(url, payload, { headers, timeout: 30000 });

        return response.data;
    } catch (error) {
        console.error(`Local AI Error [${endpoint}]:`, error.message);
        return null; // Both failed
    }
};

/**
 * 1. Text Safety Check (Hybrid: Gemini -> Local Fallback)
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
                try {
                    return JSON.parse(jsonText);
                } catch (parseErr) {
                    console.error("Gemini JSON Parse Error (checkContentSafety):", parseErr.message);
                }
            }
        } catch (err) {
            console.warn("Gemini Safety Check Failed, trying Local AI...", err.message);
        }
    }

    // Fallback to Local AI
    const localRes = await callLocalAI('/text/moderate', { text });
    if (localRes) {
        return {
            safe: localRes.allowed,
            reason: localRes.reason
        };
    }

    return { safe: true, warning: 'Moderation unavailable' };
};

/**
 * 2. Image Safety Check (Hybrid Strategy)
 * Strategy: Image -> Local AI (Vision) -> Description -> Gemini (Text Analysis)
 * This saves bandwidth and quota.
 */
const checkImageSafety = async (imageBuffer, mimeType) => {
    if (!imageBuffer) return { safe: true };

    try {
        // Step 1: Send Image to Local AI for Description & initial NSFW check
        const form = new FormData();
        form.append('file', imageBuffer, { filename: 'upload.jpg', contentType: mimeType });

        console.log(" Sending Image to Local AI for Analysis...");
        const localAnalysis = await callLocalAI('/image/analyze', form, true);

        if (!localAnalysis) {
            // Totally failed
            return { safe: true, warning: "Image analysis failed" };
        }

        // Verify Local AI findings
        console.log(" Local AI Result:", localAnalysis);

        // If Local AI says it's HIGH RISK, trust it immediately
        if (localAnalysis.nsfw_score > 0.7) {
            return { safe: false, reason: "NSFW content detected by AI Vision" };
        }

        // Step 2: Use Gemini to double-check the description (Cheap Text Request)
        const model = getModel();
        if (model && localAnalysis.summary) {
            const prompt = `Review this image description for safety. 
            Description: "${localAnalysis.summary}"
            Objects: "${localAnalysis.labels.join(', ')}"
            JSON: {"safe": boolean, "reason": "why"}`;

            const result = await model.generateContent(prompt);
            const jsonText = result.response.text().match(/\{[\s\S]*\}/)?.[0];
            if (jsonText) {
                try {
                    return JSON.parse(jsonText);
                } catch (parseErr) {
                    console.error("Gemini JSON Parse Error (checkImageSafety):", parseErr.message);
                }
            }
        }

        return { safe: true };

    } catch (error) {
        console.error("Hybrid Image Safety Check Error:", error.message);
        return { safe: true };
    }
};

/**
 * 3. Generate Suggestions (Hybrid: Gemini -> Local Fallback)
 */
const generateSuggestions = async (contextMessages) => {
    const contextStr = contextMessages.map(m => `${m.sender}: ${m.text}`).join('\n');
    const systemPrompt = `Suggest 3 short, polite replies. JSON: {"suggestions": []}. History:\n${contextStr}`;

    // Try Gemini
    const model = getModel();
    if (model) {
        try {
            const result = await model.generateContent(systemPrompt);
            const jsonText = result.response.text().match(/\{[\s\S]*\}/)?.[0];
            if (jsonText) {
                try {
                    return JSON.parse(jsonText).suggestions || [];
                } catch (parseErr) {
                    console.error("Gemini JSON Parse Error (generateSuggestions):", parseErr.message);
                }
            }
        } catch (err) {
            console.warn("Gemini Suggestions Failed, switching to Local AI...", err.message);
        }
    }

    // Fallback Local AI (Text Analysis can simulate simple suggestions or we use summarize endpoint as hack)
    // For now, simple fallback
    return ["Interested", "Available?", "Thanks"];
};

/**
 * 4. Analyze & Explain Post (Hybrid: Gemini -> Local Fallback)
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
                try {
                    return JSON.parse(jsonText);
                } catch (parseErr) {
                    console.error("Gemini JSON Parse Error (analyzePost):", parseErr.message);
                }
            }
        } catch (err) {
            console.warn("Gemini Analyze Failed, trying Local AI...", err.message);
        }
    }

    // Fallback: Use Local AI Text Analysis to extract sentiment/toxicity as proxy for "demand"
    const localRes = await callLocalAI('/text/analyze', { text: postData.description, context: 'post' });
    if (localRes) {
        const score = Math.floor((1 - localRes.toxicity_score) * 10);
        return {
            demandScore: score,
            demandLevel: score > 7 ? "High" : "Moderate",
            priceAnalysis: "AI Estimate (Local Backup)"
        };
    }

    return { demandScore: 5, demandLevel: "Moderate", priceAnalysis: "Data unavailable" };
};

const explainPost = async (postData) => {
    // Similar fallback logic...
    const prompt = `Explain post: ${postData.title}, ${postData.description}. JSON: {"summary": "", "context": "", "interestingFacts": []}`;

    const model = getModel();
    if (model) {
        try {
            const result = await model.generateContent(prompt);
            const jsonText = result.response.text().match(/\{[\s\S]*\}/)?.[0];
            if (jsonText) {
                try {
                    return JSON.parse(jsonText);
                } catch (parseErr) {
                    console.error("Gemini JSON Parse Error (explainPost):", parseErr.message);
                }
            }
        } catch (err) {
            console.warn("Gemini Explain Failed...", err.message);
        }
    }

    // Local Fallback (Summarize)
    const localRes = await callLocalAI('/text/summarize', { text: postData.description, max_length: 50 });
    if (localRes) {
        return {
            summary: localRes.summary,
            context: "Generated by Local AI",
            interestingFacts: ["Local AI Powered"],
            isFallback: true
        };
    }

    return {
        summary: postData.title,
        context: postData.description,
        interestingFacts: [],
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
                try {
                    return JSON.parse(jsonText);
                } catch (parseErr) {
                    console.error("Gemini JSON Parse Error (getPlaceholderSuggestions):", parseErr.message);
                }
            }
        } catch (err) {
            console.warn("Gemini Suggestions Failed...", err.message);
        }
    }

    return { icon: "Zap", gifKeywords: ["abstract", "dynamic", "circle"] };
};

module.exports = {
    checkContentSafety,
    checkImageSafety,
    generateSuggestions,
    analyzePost,
    explainPost,
    getPlaceholderSuggestions
};

