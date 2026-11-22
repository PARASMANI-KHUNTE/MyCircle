import api from './api';

export const getAdminOverview = async () => {
    const response = await api.get('/admin/overview');
    return response.data;
};

export const listAdminUsers = async (params: Record<string, string | number>) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
};

export const updateUserStatus = async (id: string, status: 'active' | 'suspended' | 'banned') => {
    const response = await api.patch(`/admin/users/${id}/status`, { status });
    return response.data;
};

export const listAdminPosts = async (params: Record<string, string | number>) => {
    const response = await api.get('/admin/posts', { params });
    return response.data;
};

export const updatePostModeration = async (id: string, moderationStatus: 'visible' | 'hidden' | 'removed') => {
    const response = await api.patch(`/admin/posts/${id}/moderation`, { moderationStatus });
    return response.data;
};

export const listAdminSubmissions = async (params: Record<string, string | number>) => {
    const response = await api.get('/admin/submissions', { params });
    return response.data;
};

export const updateSupportSubmission = async (
    id: string,
    payload: { status: 'open' | 'in_progress' | 'resolved' | 'dismissed'; response?: string }
) => {
    const response = await api.patch(`/admin/submissions/${id}`, payload);
    return response.data;
};
