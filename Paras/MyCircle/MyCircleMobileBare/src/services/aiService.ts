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

export const getPostExplanation = async (post: any): Promise<{ summary: string; context: string; interestingFacts: string[] }> => {
    try {
        console.log("AI Service: Requesting explanation for post:", post?.title);
        const response = await api.post('/ai/explain-post', { post });
        console.log("AI Service Response:", JSON.stringify(response.data));

        // Validate response structure
        if (response.data && typeof response.data === 'object') {
            return {
                summary: response.data.summary || 'No summary available',
                context: response.data.context || '',
                interestingFacts: Array.isArray(response.data.interestingFacts) ? response.data.interestingFacts : []
            };
        }
        console.warn("AI Service: Invalid response structure", response.data);
        return { summary: 'Explanation unavailable', context: '', interestingFacts: [] };
    } catch (error: any) {
        console.error('Explanation error:', error.message);
        console.error('Error details:', error.response?.data || error.code || 'No additional details');
        return { summary: 'Explanation unavailable', context: '', interestingFacts: [] };
    }
};
