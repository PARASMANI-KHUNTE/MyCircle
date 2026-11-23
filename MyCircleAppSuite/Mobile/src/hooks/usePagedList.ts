import { useCallback, useRef, useState } from 'react';
import api from '../services/api';
import { formatErrorMessage } from '../utils/errorMessage';
import { getPageMeta } from '../utils/pagination';

interface UsePagedListOptions<T> {
    endpoint: string;
    limit?: number;
    errorLabel?: string;
    getItemId?: (item: T) => string;
    /** Older pages are prepended (chat) instead of appended (most lists). */
    mode?: 'append' | 'prepend';
}

/**
 * Page-number list state shared by the non-React-Query screens. Results are
 * deduplicated by id, page parameters come from the X-Has-More header, and an
 * in-flight guard prevents duplicate loads from list scroll events.
 */
export const usePagedList = <T extends { _id?: string }>({
    endpoint,
    limit = 20,
    errorLabel = 'Failed to load items',
    getItemId = (item) => String(item._id),
    mode = 'append',
}: UsePagedListOptions<T>) => {
    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [total, setTotal] = useState<number | null>(null);

    const pageRef = useRef(0);
    const inFlightRef = useRef(false);
    const seqRef = useRef(0);
    const endpointRef = useRef(endpoint);
    const limitRef = useRef(limit);
    const errorLabelRef = useRef(errorLabel);
    const getItemIdRef = useRef(getItemId);
    const modeRef = useRef(mode);

    endpointRef.current = endpoint;
    limitRef.current = limit;
    errorLabelRef.current = errorLabel;
    getItemIdRef.current = getItemId;
    modeRef.current = mode;

    const load = useCallback(async (page: number, append: boolean, merge: boolean) => {
        if (inFlightRef.current) return;

        const seq = ++seqRef.current;
        inFlightRef.current = true;
        if (append) setLoadingMore(true);
        else setLoading(true);
        setError(null);

        try {
            const res = await api.get(endpointRef.current, {
                params: { page, limit: limitRef.current },
            });
            const incoming: T[] = Array.isArray(res.data) ? res.data : [];
            const meta = getPageMeta(res.headers, incoming.length, limitRef.current);

            if (seq !== seqRef.current) return;

            pageRef.current = page;
            setTotal(meta.total ?? null);
            setHasMore(meta.hasMore);
            setItems((previous) => {
                const idOf = getItemIdRef.current;
                const incomingIds = new Set(incoming.map(idOf));

                if (merge) {
                    // Socket/focus catch-up: refresh the newest page but keep
                    // older pages the user has already loaded.
                    return [
                        ...incoming,
                        ...previous.filter((item) => !incomingIds.has(idOf(item))),
                    ];
                }
                if (!append) return incoming;

                const existingIds = new Set(previous.map(idOf));
                const fresh = incoming.filter((item) => !existingIds.has(idOf(item)));
                return modeRef.current === 'prepend'
                    ? [...fresh, ...previous]
                    : [...previous, ...fresh];
            });
        } catch (err) {
            if (seq === seqRef.current) {
                setError(formatErrorMessage(err, errorLabelRef.current));
            }
        } finally {
            if (seq === seqRef.current) {
                setLoading(false);
                setLoadingMore(false);
                inFlightRef.current = false;
            }
        }
    }, []);

    const refresh = useCallback(() => load(1, false, false), [load]);

    /** Page-1 refresh that preserves already loaded older pages. */
    const sync = useCallback(() => load(1, false, true), [load]);

    const loadMore = useCallback(() => {
        if (!hasMore || loading || loadingMore || inFlightRef.current) return;
        return load(pageRef.current + 1, true, false);
    }, [hasMore, loading, loadingMore, load]);

    return {
        items,
        setItems,
        loading,
        loadingMore,
        error,
        hasMore,
        total,
        refresh,
        sync,
        loadMore,
    };
};
