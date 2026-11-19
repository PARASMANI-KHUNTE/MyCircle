/**
 * Utility to convert raw exceptions, Axios errors, and technical backend/database
 * error messages into clear, friendly, human-readable text for end users.
 */
export const formatErrorMessage = (error: any, fallback = 'Something went wrong. Please try again.'): string => {
    if (!error) return fallback;

    let raw = '';
    if (typeof error === 'string') {
        raw = error;
    } else if (error?.response?.data?.msg && typeof error.response.data.msg === 'string') {
        raw = error.response.data.msg;
    } else if (error?.response?.data?.message && typeof error.response.data.message === 'string') {
        raw = error.response.data.message;
    } else if (error?.response?.data?.error && typeof error.response.data.error === 'string') {
        raw = error.response.data.error;
    } else if (Array.isArray(error?.response?.data?.errors) && error.response.data.errors.length > 0) {
        const first = error.response.data.errors[0];
        raw = typeof first === 'string' ? first : (first?.msg || first?.message || '');
    } else if (error?.message && typeof error.message === 'string') {
        raw = error.message;
    } else if (error?.code && typeof error.code === 'string') {
        raw = error.code;
    } else {
        try {
            raw = String(error);
        } catch {
            raw = '';
        }
    }

    raw = raw.trim();
    if (!raw || raw === '[object Object]') return fallback;

    const lower = raw.toLowerCase();

    // Network / Offline errors
    if (
        lower.includes('network error') ||
        lower.includes('econnrefused') ||
        lower.includes('econnreset') ||
        lower.includes('etimedout') ||
        lower.includes('enotfound') ||
        lower.includes('timeout')
    ) {
        return 'Unable to connect to the server. Please check your internet connection.';
    }

    // Google Sign-In errors
    if (lower.includes('developer_error')) {
        return 'Google Sign-In configuration error. Please try again or use email sign-in.';
    }
    if (lower.includes('sign_in_cancelled') || lower.includes('cancelled') || lower.includes('12501')) {
        return 'Google Sign-In was cancelled.';
    }
    if (lower.includes('play_services_not_available')) {
        return 'Google Play Services is unavailable on this device.';
    }

    // JWT / Session expired
    if (
        lower.includes('jwt') ||
        lower.includes('token expired') ||
        lower.includes('unauthorized') ||
        lower.includes('status code 401')
    ) {
        return 'Your session has expired. Please sign in again to continue.';
    }

    // Permission / Forbidden
    if (lower.includes('status code 403') || lower.includes('forbidden') || lower.includes('permission denied')) {
        return 'You do not have permission to perform this action.';
    }

    // Not found
    if (lower.includes('status code 404') || lower.includes('not found') || lower.includes('cast to objectid failed')) {
        return 'The requested item could not be found.';
    }

    // Conflict / Duplicate
    if (lower.includes('status code 409') || lower.includes('e11000') || lower.includes('already exists')) {
        return 'An account or record with this information already exists.';
    }

    // Rate limited
    if (lower.includes('status code 429') || lower.includes('too many requests')) {
        return 'Too many requests. Please wait a moment before trying again.';
    }

    // Server errors (500, 502, 503, 504)
    if (
        lower.includes('status code 5') ||
        lower.includes('internal server error') ||
        lower.includes('bad gateway') ||
        lower.includes('service unavailable') ||
        lower.includes('mongo') ||
        lower.includes('syntaxerror')
    ) {
        return 'Something went wrong on our end. Please try again in a moment.';
    }

    // Generic AxiosError wrapper
    if (lower.startsWith('request failed with status code')) {
        return fallback;
    }

    // Technical JavaScript stack trace / error objects
    if (
        lower.includes('at ') ||
        lower.includes('cannot read propert') ||
        lower.includes('typeerror') ||
        lower.includes('referenceerror') ||
        lower.includes('uncaught exception')
    ) {
        return fallback;
    }

    return raw;
};
