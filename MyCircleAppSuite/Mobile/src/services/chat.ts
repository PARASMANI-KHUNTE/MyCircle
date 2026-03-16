import api from './api';

export const ensureConversationWithUser = async (userId: string) => {
    const res = await api.post(`/chat/init/${userId}`);
    return res.data;
};

export const getConversationById = async (conversationId: string) => {
    const res = await api.get('/chat/conversations');
    return res.data.find((conversation: any) => conversation._id === conversationId) || null;
};

