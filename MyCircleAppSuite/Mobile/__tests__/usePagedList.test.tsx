jest.mock('../src/services/api', () => ({
    __esModule: true,
    default: { get: jest.fn() },
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import api from '../src/services/api';
import { usePagedList } from '../src/hooks/usePagedList';

const flush = () => new Promise<void>((resolve) => setImmediate(() => resolve()));

describe('usePagedList', () => {
    let latest!: ReturnType<typeof usePagedList<any>>;

    const Harness = () => {
        latest = usePagedList<any>({
            endpoint: '/posts/my-posts',
            limit: 2,
            errorLabel: 'Failed to load posts',
        });
        return null;
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const render = async () => {
        let renderer!: ReactTestRenderer.ReactTestRenderer;
        await ReactTestRenderer.act(async () => {
            renderer = ReactTestRenderer.create(<Harness />);
            await flush();
        });
        return renderer;
    };

    it('appends pages, deduplicates ids and reports the end of the list', async () => {
        (api.get as jest.Mock)
            .mockResolvedValueOnce({
                data: [{ _id: 'a' }, { _id: 'b' }],
                headers: { 'x-has-more': 'true' },
            })
            .mockResolvedValueOnce({
                data: [{ _id: 'b' }, { _id: 'c' }],
                headers: { 'x-has-more': 'false', 'x-total-count': '3' },
            });

        const renderer = await render();

        await ReactTestRenderer.act(async () => {
            await latest.refresh();
            await flush();
        });
        expect(api.get).toHaveBeenLastCalledWith('/posts/my-posts', { params: { page: 1, limit: 2 } });
        expect(latest.items).toHaveLength(2);
        expect(latest.hasMore).toBe(true);

        await ReactTestRenderer.act(async () => {
            await latest.loadMore();
            await flush();
        });

        expect(api.get).toHaveBeenLastCalledWith('/posts/my-posts', { params: { page: 2, limit: 2 } });
        expect(latest.items.map((item: any) => item._id)).toEqual(['a', 'b', 'c']);
        expect(latest.hasMore).toBe(false);
        expect(latest.total).toBe(3);

        await ReactTestRenderer.act(async () => renderer.unmount());
    });

    it('keeps older pages during a socket catch-up refresh', async () => {
        (api.get as jest.Mock)
            .mockResolvedValueOnce({
                data: [{ _id: 'a' }, { _id: 'b' }],
                headers: { 'x-has-more': 'true' },
            })
            .mockResolvedValueOnce({
                data: [{ _id: 'c' }],
                headers: { 'x-has-more': 'true' },
            })
            .mockResolvedValueOnce({
                data: [{ _id: 'new' }, { _id: 'a' }],
                headers: { 'x-has-more': 'true' },
            });

        const renderer = await render();

        await ReactTestRenderer.act(async () => {
            await latest.refresh();
            await flush();
        });
        await ReactTestRenderer.act(async () => {
            await latest.loadMore();
            await flush();
        });
        expect(latest.items.map((item: any) => item._id)).toEqual(['a', 'b', 'c']);

        await ReactTestRenderer.act(async () => {
            await latest.sync();
            await flush();
        });

        expect(latest.items.map((item: any) => item._id)).toEqual(['new', 'a', 'b', 'c']);

        await ReactTestRenderer.act(async () => renderer.unmount());
    });

    it('exposes a load-more error separately from an empty initial error', async () => {
        (api.get as jest.Mock)
            .mockResolvedValueOnce({ data: [{ _id: 'a' }], headers: { 'x-has-more': 'true' } })
            .mockRejectedValueOnce(new Error('Network Error'));

        const renderer = await render();

        await ReactTestRenderer.act(async () => {
            await latest.refresh();
            await flush();
        });
        await ReactTestRenderer.act(async () => {
            await latest.loadMore();
            await flush();
        });

        expect(latest.items).toHaveLength(1);
        expect(latest.error).toBe('Unable to connect to the server. Please check your internet connection.');

        (api.get as jest.Mock).mockResolvedValueOnce({
            data: [{ _id: 'b' }],
            headers: { 'x-has-more': 'false' },
        });
        await ReactTestRenderer.act(async () => {
            await latest.loadMore();
            await flush();
        });

        expect(latest.error).toBeNull();
        expect(latest.items.map((item: any) => item._id)).toEqual(['a', 'b']);

        await ReactTestRenderer.act(async () => renderer.unmount());
    });
});
