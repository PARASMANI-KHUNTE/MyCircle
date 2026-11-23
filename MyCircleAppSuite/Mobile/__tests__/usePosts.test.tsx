jest.mock('../src/services/api', () => ({
    __esModule: true,
    default: { get: jest.fn().mockResolvedValue({ data: [] }) },
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

const flush = () => new Promise<void>((resolve) => setImmediate(() => resolve()));

describe('usePosts', () => {
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
            params: { limit: 50, urgentOnly: true },
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
});
