export const TITLE_MAX_LENGTH = 200;
export const DESCRIPTION_MAX_LENGTH = 5000;
export const MAX_POST_IMAGES = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const LOCATION_SOURCES = ['current', 'map'] as const;

export type LocationSource = typeof LOCATION_SOURCES[number];
export type LocationMethod = 'detect' | 'pin';

export interface LocationSelection {
    method: LocationMethod | null;
    location: string;
    latitude?: number | string | null;
    longitude?: number | string | null;
}

export interface LocationPayload {
    location: string;
    latitude: number;
    longitude: number;
    locationSource: LocationSource;
}

export type ValidationSection = 'category' | 'details' | 'location' | 'exchange' | 'all';

export interface ValidationError {
    field: string;
    message: string;
    section: Exclude<ValidationSection, 'all'>;
}

export interface PostDraft {
    type?: string;
    subType?: string;
    jobType?: string;
    itemCategory?: string;
    title?: string;
    description?: string;
    location?: string;
    latitude?: number | string | null;
    longitude?: number | string | null;
    locationSource?: LocationSource | null;
    price?: number | string;
    duration?: number | string;
    exchangePreference?: string;
}

const SECTION_ORDER: Array<Exclude<ValidationSection, 'all'>> = [
    'category',
    'details',
    'location',
    'exchange',
];

const parseNumber = (value: unknown): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const error = (
    section: Exclude<ValidationSection, 'all'>,
    field: string,
    message: string
): ValidationError => ({ section, field, message });

export function getLocationSource(method: LocationMethod | null): LocationSource | null {
    if (method === 'detect') return 'current';
    if (method === 'pin') return 'map';
    return null;
}

export function switchLocationMethod(
    selection: LocationSelection,
    nextMethod: LocationMethod
): LocationSelection {
    if (selection.method === nextMethod) return selection;

    return {
        method: nextMethod,
        location: '',
        latitude: null,
        longitude: null,
    };
}

export function getLocationPayload(selection: LocationSelection): LocationPayload | null {
    const source = getLocationSource(selection.method);
    const latitude = parseNumber(selection.latitude);
    const longitude = parseNumber(selection.longitude);
    const location = (selection.location || '').trim();

    if (!source || latitude === null || longitude === null || !location) return null;

    return { location, latitude, longitude, locationSource: source };
}

const validateCategory = (draft: PostDraft): ValidationError | null => {
    if (!draft.type) {
        return error('category', 'type', 'Choose a category to continue.');
    }

    if (draft.type === 'job' && !draft.subType && !draft.jobType) {
        return error('category', 'subType', 'Select a job type.');
    }

    if (['sell', 'rent'].includes(draft.type) && !draft.subType && !draft.itemCategory) {
        return error('category', 'itemCategory', 'Select an item category.');
    }

    return null;
};

const validateDetails = (draft: PostDraft): ValidationError | null => {
    const title = (draft.title || '').trim();
    const description = (draft.description || '').trim();

    if (!title) return error('details', 'title', 'Add a title so people know what this post is about.');
    if (title.length > TITLE_MAX_LENGTH) {
        return error('details', 'title', `Title must be ${TITLE_MAX_LENGTH} characters or fewer.`);
    }
    if (!description) return error('details', 'description', 'Add a description with the important details.');
    if (description.length > DESCRIPTION_MAX_LENGTH) {
        return error('details', 'description', `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`);
    }

    return null;
};

const validateLocation = (draft: PostDraft): ValidationError | null => {
    const latitude = parseNumber(draft.latitude);
    const longitude = parseNumber(draft.longitude);

    // New clients always send a single explicit source. Older drafts remain valid
    // so posts created before this change can still be edited and published.
    if (draft.locationSource !== undefined) {
        if (!draft.locationSource || !LOCATION_SOURCES.includes(draft.locationSource)) {
            return error('location', 'location', 'Confirm a location using one option: detect GPS or pin on the map.');
        }
    }

    if (latitude === null || longitude === null) {
        return error('location', 'location', 'Detect your location or pin a spot on the map.');
    }

    if (!(draft.location || '').trim()) {
        return error('location', 'location', 'Confirm the location before continuing.');
    }

    return null;
};

const validateExchange = (draft: PostDraft): ValidationError | null => {
    const priceValue = String(draft.price ?? '').trim();

    if (priceValue) {
        const price = parseNumber(priceValue);
        if (price === null || price < 0) {
            return error('exchange', 'price', 'Price must be a non-negative number.');
        }
    }

    if (draft.duration !== undefined && draft.duration !== '') {
        const duration = parseNumber(draft.duration);
        if (duration === null || duration <= 0) {
            return error('exchange', 'duration', 'Choose a valid duration.');
        }
    }

    return null;
};

export function validatePostDraft(
    section: ValidationSection,
    draft: PostDraft
): ValidationError | null {
    if (section === 'all') {
        for (const key of SECTION_ORDER) {
            const found = validatePostDraft(key, draft);
            if (found) return found;
        }
        return null;
    }

    switch (section) {
        case 'category':
            return validateCategory(draft);
        case 'details':
            return validateDetails(draft);
        case 'location':
            return validateLocation(draft);
        case 'exchange':
            return validateExchange(draft);
        default:
            return null;
    }
}

export function sectionForField(field: string): Exclude<ValidationSection, 'all'> {
    if (field === 'type' || field === 'subType' || field === 'jobType' || field === 'itemCategory') {
        return 'category';
    }
    if (field === 'title' || field === 'description') return 'details';
    if (field === 'location' || field === 'latitude' || field === 'longitude') return 'location';
    return 'exchange';
}
