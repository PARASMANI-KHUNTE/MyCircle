import { InfiniteData, keepPreviousData, useInfiniteQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import api from '../services/api';
import { getPageMeta } from '../utils/pagination';

export interface UsePostsOptions {
    latitude?: number;
    longitude?: number;
    radius?: number;
    limit?: number;
    type?: string;
    q?: string;
    location?: string;
    sort?: string;
    barterOnly?: boolean;
    urgentOnly?: boolean;
}

export interface PostsPage {
    items: any[];
    hasMore: boolean;
    total?: number;
    nextPage?: number;
}

export const postsQueryKey = (options: UsePostsOptions = {}) => [
    'posts',
    {
        latitude: options.latitude,
        longitude: options.longitude,
        radius: options.radius,
        limit: options.limit,
        type: options.type,
        q: options.q,
        location: options.location,
        sort: options.sort,
        barterOnly: options.barterOnly,
        urgentOnly: options.urgentOnly,
    },
] as const;

const buildParams = (options: UsePostsOptions, page: number) => {
    const {
        latitude,
        longitude,
        radius,
        limit = 20,
        type,
        q,
        location,
        sort,
        barterOnly,
        urgentOnly,
    } = options;
    const params: Record<string, string | number | boolean> = { page, limit };

    // 0° latitude/longitude are valid coordinates (e.g. the Gulf of
    // Guinea), so only skip absent values rather than falsy ones.
    if (latitude !== undefined && latitude !== null
        && longitude !== undefined && longitude !== null) {
        params.latitude = latitude;
        params.longitude = longitude;
        params.radius = radius || 50;
    }
    if (type && type !== 'all') params.type = type;
    if (q) params.q = q;
    if (location && location !== 'All') params.location = location;
    if (sort) params.sort = sort;
    if (barterOnly) params.barterOnly = true;
    if (urgentOnly) params.urgentOnly = true;
    return params;
};

export const usePosts = (options: UsePostsOptions = {}) => {
    const limit = options.limit ?? 20;
    const query = useInfiniteQuery({
        queryKey: postsQueryKey(options),
        queryFn: async ({ pageParam }) => {
            const response = await api.get('/posts', {
                params: buildParams({ ...options, limit }, pageParam),
            });
            const items = Array.isArray(response.data) ? response.data : [];
            const meta = getPageMeta(response.headers, items.length, limit);
            return {
                items,
                ...meta,
                nextPage: meta.hasMore ? pageParam + 1 : undefined,
            } satisfies PostsPage;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => lastPage.nextPage,
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60, // 1 minute fresh
        gcTime: 1000 * 60 * 5, // 5 minutes cache
    });

    // Keep the public shape as a flat array so existing consumers/filters do
    // not need to know about React Query's page structure.
    const data = useMemo(
        () => query.data?.pages.flatMap((page) => page.items) ?? [],
        [query.data]
    );

    return {
        ...query,
        data,
        total: query.data?.pages[0]?.total,
        hasMore: Boolean(query.hasNextPage),
        fetchMore: query.fetchNextPage,
        isFetchingMore: query.isFetchingNextPage,
    };
};

/** Invalidate every feed query after a post is created, edited, deleted or toggled. */
export const invalidatePosts = (queryClient: QueryClient) =>
    queryClient.invalidateQueries({ queryKey: ['posts'] });

/** Adds a freshly created/streamed post to the first cached feed page. */
export const prependPostToFeed = (
    queryClient: ReturnType<typeof useQueryClient>,
    options: UsePostsOptions,
    post: any
) => {
    queryClient.setQueryData(
        postsQueryKey(options),
        (old: InfiniteData<PostsPage> | undefined) => {
            if (!old) return old;
            const pages = old.pages.map((page, index) => {
                const items = index === 0
                    ? [post, ...page.items.filter((item) => item._id !== post._id)]
                    : page.items.filter((item) => item._id !== post._id);
                return { ...page, items };
            });
            return { ...old, pages };
        }
    );
};
