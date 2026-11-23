/**
 * Helpers shared by every paginated mobile list. The server communicates
 * pagination through X-Page / X-Limit / X-Total-Count / X-Has-More headers,
 * which axios exposes with lower-cased names in React Native.
 */
export interface PageMeta {
    hasMore: boolean;
    total?: number;
}

const readHeader = (headers: any, name: string): unknown => {
    if (!headers) return undefined;
    if (typeof headers.get === 'function') return headers.get(name);
    return headers[name.toLowerCase()] ?? headers[name];
};

const parseHasMore = (value: unknown, fallback: boolean): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true' || normalized === '1') return true;
        if (normalized === 'false' || normalized === '0') return false;
    }
    return fallback;
};

/**
 * Reads pagination metadata from a response. When the server omits the header
 * (older deployments), a full page is treated as having more results.
 */
export const getPageMeta = (
    headers: unknown,
    receivedCount: number,
    requestedLimit: number
): PageMeta => {
    const hasMore = parseHasMore(
        readHeader(headers, 'x-has-more'),
        receivedCount >= requestedLimit
    );

    const rawTotal = readHeader(headers, 'x-total-count');
    const total = Number(rawTotal);
    return {
        hasMore,
        total: Number.isFinite(total) && rawTotal !== undefined && rawTotal !== null
            ? total
            : undefined,
    };
};
