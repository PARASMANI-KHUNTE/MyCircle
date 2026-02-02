const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    try {
        console.log('Listing available Gemini models...');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
        // Note: The SDK might not have a direct listModels, but we can try to find it or check docs.
        // Actually, listModels is available on the genAI instance in some versions or via separate client.
        // For @google/generative-ai, we might need to use the REST API if listModels isn't exposed.

        // Let's try to just hit a very standard one without the dash if dash is the problem.
        // Or check if the key is actually for a specific project that doesn't have Gemini enabled?

        console.log('API Key (masked):', process.env.GEMINI_API_KEY.substring(0, 5) + '...');
    } catch (error) {
        console.error('Failed to list models:', error);
    }
}

listModels();
