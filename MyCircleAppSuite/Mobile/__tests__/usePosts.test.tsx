jest.mock('../src/services/api', () => ({
    __esModule: true,
    default: { get: jest.fn().mockResolvedValue({ data: [], headers: { 'x-has-more': 'false' } }) },
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '../src/services/api';
import { usePosts } from '../src/hooks/usePosts';

const HookHarness = (props: any) => {
    usePosts(props);
    return null;
};

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 50));

describe('usePosts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('treats zero latitude/longitude as real coordinates', async () => {
        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false, gcTime: 0 } },
        });
        let renderer!: ReactTestRenderer.ReactTestRenderer;

        await ReactTestRenderer.act(async () => {
            renderer = ReactTestRenderer.create(
                <QueryClientProvider client={queryClient}>
                    <HookHarness latitude={0} longitude={0} radius={25} limit={50} />
                </QueryClientProvider>
            );
            await flush();
        });

        expect(api.get).toHaveBeenCalledWith('/posts', {
            params: { page: 1, limit: 50, latitude: 0, longitude: 0, radius: 25 },
        });

        await ReactTestRenderer.act(async () => {
            renderer.unmount();
            queryClient.clear();
            await flush();
        });
    });

    it('sends urgentOnly to the server and includes it in the cache key', async () => {
        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false, gcTime: 0 } },
        });
        let renderer!: ReactTestRenderer.ReactTestRenderer;

        await ReactTestRenderer.act(async () => {
            renderer = ReactTestRenderer.create(
                <QueryClientProvider client={queryClient}>
                    <HookHarness urgentOnly limit={50} />
                </QueryClientProvider>
            );
            await flush();
        });

        expect(api.get).toHaveBeenCalledWith('/posts', {
            params: { page: 1, limit: 50, urgentOnly: true },
        });
        expect(queryClient.getQueryCache().findAll().some((query) =>
            JSON.stringify(query.queryKey).includes('urgentOnly')
        )).toBe(true);

        await ReactTestRenderer.act(async () => {
            renderer.unmount();
            queryClient.clear();
            await flush();
        });
    });

    it('appends older pages and stops when x-has-more is false', async () => {
        (api.get as jest.Mock)
            .mockResolvedValueOnce({
                data: [{ _id: 'post-1' }],
                headers: { 'x-has-more': 'true', 'x-total-count': '2' },
            })
            .mockResolvedValueOnce({
                data: [{ _id: 'post-2' }],
                headers: { 'x-has-more': 'false', 'x-total-count': '2' },
            });

        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false, gcTime: 0 } },
        });
        let renderer!: ReactTestRenderer.ReactTestRenderer;
        let latest!: ReturnType<typeof usePosts>;
        const PagingHarness = () => {
            latest = usePosts({ limit: 1 });
            return null;
        };

        await ReactTestRenderer.act(async () => {
            renderer = ReactTestRenderer.create(
                <QueryClientProvider client={queryClient}>
                    <PagingHarness />
                </QueryClientProvider>
            );
            await flush();
        });
        await ReactTestRenderer.act(async () => {
            await flush();
        });

        expect(latest.data).toEqual([{ _id: 'post-1' }]);
        expect(latest.hasMore).toBe(true);

        await ReactTestRenderer.act(async () => {
            await latest.fetchMore();
            await flush();
        });

        expect(api.get).toHaveBeenLastCalledWith('/posts', { params: { page: 2, limit: 1 } });
        expect(latest.data).toEqual([{ _id: 'post-1' }, { _id: 'post-2' }]);
        expect(latest.hasMore).toBe(false);
        expect(latest.total).toBe(2);

        await ReactTestRenderer.act(async () => {
            renderer.unmount();
            queryClient.clear();
            await flush();
        });
    });
});
