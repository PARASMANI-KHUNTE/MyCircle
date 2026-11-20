export const TITLE_MAX_LENGTH = 200;
export const DESCRIPTION_MAX_LENGTH = 5000;
export const MAX_POST_IMAGES = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const LOCATION_SOURCES = ['current', 'map'];

const SECTION_ORDER = ['category', 'details', 'location', 'exchange'];

const parseNumber = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const validationError = (section, field, message) => ({ section, field, message });

export function getLocationSource(method) {
    if (method === 'detect') return 'current';
    if (method === 'pin') return 'map';
    return null;
}

export function switchLocationMethod(selection, nextMethod) {
    if (selection.method === nextMethod) return selection;

    return {
        method: nextMethod,
        location: '',
        latitude: null,
        longitude: null,
    };
}

export function getLocationPayload(selection) {
    const source = getLocationSource(selection.method);
    const latitude = parseNumber(selection.latitude);
    const longitude = parseNumber(selection.longitude);
    const location = (selection.location || '').trim();

    if (!source || latitude === null || longitude === null || !location) return null;

    return { location, latitude, longitude, locationSource: source };
}

const validateCategory = (draft) => {
    if (!draft.type) {
        return validationError('category', 'type', 'Choose a category to continue.');
    }

    if (draft.type === 'job' && !draft.subType && !draft.jobType) {
        return validationError('category', 'jobType', 'Select a job type.');
    }

    if (['sell', 'rent'].includes(draft.type) && !draft.subType && !draft.itemCategory) {
        return validationError('category', 'itemCategory', 'Select an item category.');
    }

    return null;
};

const validateDetails = (draft) => {
    const title = (draft.title || '').trim();
    const description = (draft.description || '').trim();

    if (!title) return validationError('details', 'title', 'Add a title so people know what this post is about.');
    if (title.length > TITLE_MAX_LENGTH) {
        return validationError('details', 'title', `Title must be ${TITLE_MAX_LENGTH} characters or fewer.`);
    }
    if (!description) return validationError('details', 'description', 'Add a description with the important details.');
    if (description.length > DESCRIPTION_MAX_LENGTH) {
        return validationError('details', 'description', `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`);
    }

    return null;
};

const validateLocation = (draft) => {
    const latitude = parseNumber(draft.latitude);
    const longitude = parseNumber(draft.longitude);

    if (draft.locationSource !== undefined) {
        if (!draft.locationSource || !LOCATION_SOURCES.includes(draft.locationSource)) {
            return validationError('location', 'location', 'Confirm a location using one option: detect GPS or pin on the map.');
        }
    }

    if (latitude === null || longitude === null) {
        return validationError('location', 'location', 'Detect your location or pin a spot on the map.');
    }

    if (!(draft.location || '').trim()) {
        return validationError('location', 'location', 'Confirm the location before continuing.');
    }

    return null;
};

const validateExchange = (draft) => {
    const priceValue = String(draft.price ?? '').trim();

    if (priceValue) {
        const price = parseNumber(priceValue);
        if (price === null || price < 0) {
            return validationError('exchange', 'price', 'Price must be a non-negative number.');
        }
    }

    if (draft.duration !== undefined && draft.duration !== '') {
        const duration = parseNumber(draft.duration);
        if (duration === null || duration <= 0) {
            return validationError('exchange', 'duration', 'Choose a valid duration.');
        }
    }

    return null;
};

export function validatePostDraft(section, draft) {
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
