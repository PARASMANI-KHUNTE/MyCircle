const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyze text content for safety violations
 * @param {string} text - Text to analyze
 * @returns {Promise<{safe: boolean, reason: string}>}
 */
async function analyzeText(text) {
    try {
        if (!text || text.trim().length === 0) {
            return { safe: true, reason: null };
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `Analyze the following text for inappropriate content including:
- Explicit sexual content
- Hate speech or discrimination
- Violence or threats
- Illegal activities
- Spam or scams

Text to analyze: "${text}"

Respond in JSON format:
{
  "safe": true/false,
  "reason": "brief explanation if unsafe, null if safe"
}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const analysisText = response.text();

        // Parse JSON response
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            return analysis;
        }

        // Fallback if parsing fails
        return { safe: true, reason: null };
    } catch (error) {
        console.error('Error analyzing text:', error);
        // Fail open - allow content if AI service fails
        return { safe: true, reason: null };
    }
}

/**
 * Analyze image content for safety violations
 * @param {Buffer} imageBuffer - Image buffer to analyze
 * @param {string} mimeType - MIME type of the image
 * @returns {Promise<{safe: boolean, reason: string}>}
 */
async function analyzeImage(imageBuffer, mimeType) {
    try {
        if (!imageBuffer) {
            return { safe: true, reason: null };
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const imagePart = {
            inlineData: {
                data: imageBuffer.toString('base64'),
                mimeType: mimeType
            }
        };

        const prompt = `Analyze this image for inappropriate content including:
- Explicit sexual content
- Violence or gore
- Hate symbols
- Illegal activities

Respond in JSON format:
{
  "safe": true/false,
  "reason": "brief explanation if unsafe, null if safe"
}`;

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const analysisText = response.text();

        // Parse JSON response
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            return analysis;
        }

        // Fallback if parsing fails
        return { safe: true, reason: null };
    } catch (error) {
        console.error('Error analyzing image:', error);
        // Fail open - allow content if AI service fails
        return { safe: true, reason: null };
    }
}

module.exports = {
    analyzeText,
    analyzeImage
};
