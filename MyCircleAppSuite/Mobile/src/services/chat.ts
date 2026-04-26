import api from './api';

export const ensureConversationWithUser = async (userId: string, postId?: string) => {
    const res = await api.post(`/chat/init/${userId}`, postId ? { postId } : {});
    return res.data;
};

export const getConversationById = async (conversationId: string) => {
    const res = await api.get(`/chat/conversations/${conversationId}`);
    return res.data;
};
