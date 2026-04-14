import api from '../utils/api';

export const moderateContent = async (text) => {
    try {
        const response = await api.post('/ai/moderate', { text });
        return response.data;
    } catch (error) {
        console.error('Moderation error:', error);
        return { safe: true }; // Fail open if API fails
    }
};

export const getChatSuggestions = async (messages) => {
    try {
        const response = await api.post('/ai/suggest', { messages });
        return response.data.suggestions;
    } catch (error) {
        console.error('Suggestion error:', error);
        return [];
    }
};

export const getPostInsights = async (post) => {
    try {
        const response = await api.post('/ai/analyze-post', { post });
        const data = response.data || {};
        return {
            ...data,
            score: data.demandScore ?? data.score ?? 0,
            summary: data.priceAnalysis ?? data.summary ?? 'Analysis unavailable',
            tips: data.tips ?? [],
        };
    } catch (error) {
        console.error('Insight error:', error);
        return { summary: 'Analysis unavailable', tips: [], score: 0 };
    }
};

export const getPostExplanation = async (post) => {
    try {
        const response = await api.post('/ai/explain-post', { post });
        const data = response.data || {};
        return {
            ...data,
            explanation: data.summary || data.explanation || data.context || JSON.stringify(data.interestingFacts) || 'AI summary unavailable',
        };
    } catch {
        return { explanation: 'AI summary unavailable', summary: 'Explanation unavailable', context: '', interestingFacts: [] };
    }
};
