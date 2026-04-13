import { keepPreviousData, useQuery } from '@tanstack/react-query';
import api from '../services/api';

interface UsePostsOptions {
    latitude?: number;
    longitude?: number;
    radius?: number;
    limit?: number;
    type?: string;
    q?: string;
    location?: string;
    sort?: string;
    barterOnly?: boolean;
}

export const usePosts = ({
    latitude,
    longitude,
    radius,
    limit = 20,
    type,
    q,
    location,
    sort,
    barterOnly,
}: UsePostsOptions = {}) => {
    return useQuery({
        queryKey: ['posts', { latitude, longitude, radius, limit, type, q, location, sort, barterOnly }],
        queryFn: async () => {
            const params: Record<string, string | number | boolean> = { limit };
            if (latitude && longitude) {
                params.latitude = latitude;
                params.longitude = longitude;
                params.radius = radius || 50;
            }
            if (type && type !== 'all') {
                params.type = type;
            }
            if (q) {
                params.q = q;
            }
            if (location && location !== 'All') {
                params.location = location;
            }
            if (sort) {
                params.sort = sort;
            }
            if (barterOnly) {
                params.barterOnly = true;
            }
            const { data } = await api.get('/posts', { params });
            return data;
        },
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60, // 1 minute fresh
        gcTime: 1000 * 60 * 5, // 5 minutes cache
    });
};
