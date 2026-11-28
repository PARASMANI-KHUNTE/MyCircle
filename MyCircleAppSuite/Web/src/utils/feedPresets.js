export const DEFAULT_FEED_FILTERS = {
    type: 'all',
    radius: 50,
    barterOnly: false,
    urgentOnly: false,
    location: '',
};

export const normalizeFeedFilters = (filters = {}) => ({
    type: filters.type || DEFAULT_FEED_FILTERS.type,
    radius: Math.min(Math.max(Number(filters.radius) || DEFAULT_FEED_FILTERS.radius, 1), 500),
    barterOnly: Boolean(filters.barterOnly),
    urgentOnly: Boolean(filters.urgentOnly),
    location: String(filters.location || ''),
});

export const buildFeedParams = (filters = {}, { query = '', sort = 'latest', coords = null } = {}) => {
    const normalized = normalizeFeedFilters(filters);
    const params = {
        limit: 50,
        type: normalized.type,
        q: query.trim() || undefined,
        sort,
        barterOnly: normalized.barterOnly,
        urgentOnly: normalized.urgentOnly,
    };

    if (normalized.location) params.location = normalized.location;
    if (coords?.lat != null && coords?.lng != null) {
        params.latitude = coords.lat;
        params.longitude = coords.lng;
        params.radius = normalized.radius;
    }

    return params;
};

export const describeFeedPreset = (preset = {}) => {
    const normalized = normalizeFeedFilters(preset);
    const parts = [normalized.type === 'all' ? 'All types' : normalized.type];

    if (normalized.location) parts.push(normalized.location);
    parts.push(`within ${normalized.radius} km`);
    if (normalized.barterOnly) parts.push('barter only');
    if (normalized.urgentOnly) parts.push('urgent only');

    return parts.join(' · ');
};
