import api from './api';

export const moderateContent = async (text: string): Promise<{ safe: boolean; reason?: string }> => {
    try {
        const response = await api.post('/ai/moderate', { text });
        return response.data;
    } catch (error) {
        console.error('Moderation error:', error);
        return { safe: true }; // Fail open if API fails
    }
};

export const getChatSuggestions = async (messages: { sender: 'user' | 'other'; text: string }[]): Promise<string[]> => {
    try {
        const response = await api.post('/ai/suggest', { messages });
        return response.data.suggestions;
    } catch (error) {
        console.error('Suggestion error:', error);
        return [];
    }
};

export const getPostInsights = async (post: any): Promise<{ summary: string; tips: string[]; score: number }> => {
    try {
        const response = await api.post('/ai/analyze-post', { post });
        return response.data;
    } catch (error) {
        console.error('Insight error:', error);
        return { summary: 'Analysis unavailable', tips: [], score: 0 };
    }
};
