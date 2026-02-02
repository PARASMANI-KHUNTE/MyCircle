import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export const usePosts = (latitude?: number, longitude?: number, radius?: number) => {
    return useQuery({
        queryKey: ['posts', { latitude, longitude, radius }],
        queryFn: async () => {
            let url = '/posts';
            if (latitude && longitude) {
                const searchRadius = radius || 50; // Default 50km
                url += `?latitude=${latitude}&longitude=${longitude}&radius=${searchRadius}`;
            }
            const { data } = await api.get(url);
            return data;
        },
        staleTime: 1000 * 60, // 1 minute fresh
        gcTime: 1000 * 60 * 5, // 5 minutes cache
    });
};
