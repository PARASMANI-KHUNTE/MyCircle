import axios from 'axios';

const normalizeBaseUrl = (value) => {
    if (!value) return '';

    let normalized = value.trim();
    if (normalized.startsWith(':')) {
        normalized = `http://${normalized}`;
    }
    if (!normalized.startsWith('http')) {
        normalized = `http://${normalized}`;
    }

    return normalized.replace(/\/api\/?$/, '');
};

const isProduction = import.meta.env.PROD;
let rawApiURL = isProduction
    ? import.meta.env.VITE_API_URL
    : (import.meta.env.VITE_API_URL_DEV || 'http://localhost:5000');

const apiURL = normalizeBaseUrl(rawApiURL);

if (isProduction && !apiURL) {
    throw new Error('VITE_API_URL is not set. Please configure it in your web .env file.');
}

const api = axios.create({
    baseURL: `${apiURL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

export const getSocketBaseUrl = () => apiURL;

/**
 * Create a payment intent for purchasing a post.
 * The backend resolves the seller/price from the post id.
 * Returns a normalized payload: { orderId, clientSecret, amount, ... }
 */
const createPaymentIntent = async (postId, sellerId, itemTitle, amount, currency = 'INR') => {
    const res = await api.post('/payments/create-intent', {
        postId,
        sellerId,
        itemTitle,
        amount,
        currency,
    });

    const data = res.data || {};
    return {
        ...data,
        orderId: data.orderId || data.escrowId || data.id || null,
    };
};

export { createPaymentIntent };

// Helper: generate request ID for tracing (UUID v4 format using crypto API)
// Falls back to a timestamp-based ID if crypto is unavailable.
const generateRequestId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback: deterministic-ish ID using timestamp + random
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper: map backend identity-boundary error codes to structured messages.
// Expected error shape from identity boundary:
//   { statusCode: number, error: string, message: string, path: string, timestamp: string }
const mapIdentityError = (err) => {
    const data = err?.response?.data || {};

    // If the backend already provides structured identity-boundary fields, use them
    if (data?.statusCode !== undefined) {
        const code = data.statusCode;
        const msg = data?.message || data?.error || 'An unexpected error occurred';
        return {
            code,
            message: msg,
            // Preserve any extra context the backend may have supplied
            ...data,
        };
    }

    // Fallback: deduce structure from common HTTP status patterns
    const status = err?.response?.status;
    switch (status) {
        case 400:
            return {
                code: 'BAD_REQUEST',
                message: data?.msg || data?.error || 'Bad request',
            };
        case 401:
            return {
                code: 'UNAUTHORIZED',
                message: data?.msg || data?.error || 'Unauthorized',
            };
        case 403:
            return {
                code: 'FORBIDDEN',
                message: data?.msg || data?.error || 'Forbidden',
            };
        case 404:
            return {
                code: 'NOT_FOUND',
                message: data?.msg || data?.error || 'Not found',
            };
        case 409:
            return {
                code: 'CONFLICT',
                message: data?.msg || data?.error || 'Conflict',
            };
        case 422:
            return {
                code: 'UNPROCESSABLE_ENTITY',
                message: data?.msg || data?.error || 'Unprocessable entity',
            };
        case 429:
            return {
                code: 'TOO_MANY_REQUESTS',
                message: data?.msg || data?.error || 'Too many requests',
            };
        case 500:
            return {
                code: 'INTERNAL_SERVER_ERROR',
                message: data?.msg || data?.error || 'Internal server error',
            };
        case 502:
        case 503:
        case 504:
            return {
                code: 'SERVICE_UNAVAILABLE',
                message: data?.msg || data?.error || 'Service unavailable',
            };
        default:
            return {
                code: 'UNKNOWN_ERROR',
                message: data?.msg || data?.error || 'An unexpected error occurred',
            };
    }
};

// Add a request interceptor to include the auth token and x-request-id
api.interceptors.request.use(
    (config) => {
        const isFormData = typeof FormData !== 'undefined' && config?.data instanceof FormData;
        if (isFormData && config.headers) {
            // Let the browser set the correct multipart boundary.
            try {
                if (typeof config.headers.delete === 'function') {
                    config.headers.delete('Content-Type');
                    config.headers.delete('content-type');
                }
            } catch {
                // ignore
            }
            try {
                delete config.headers['Content-Type'];
                delete config.headers['content-type'];
            } catch {
                // ignore
            }
        }

        const token = localStorage.getItem('token');
        if (token) {
            config.headers['x-auth-token'] = token;
        }

        // Inject standard x-request-id header for tracing
        if (!config.headers?.['x-request-id']) {
            config.headers['x-request-id'] = generateRequestId();
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Add a response interceptor to handle auth expiry and structured identity-boundary errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Map structured error codes from the identity boundary
        const structuredError = mapIdentityError(error);

        // Handle auth expiry using either the mapped code or the raw status
        if (
            structuredError.code === 'UNAUTHORIZED' ||
            structuredError.code === 'TOKEN_EXPIRED' ||
            structuredError.code === 401
        ) {
            try {
                localStorage.removeItem('token');
            } catch {
                // localStorage unavailable (private browsing, etc.)
            }

            // Simple notification or redirect
            if (typeof window !== 'undefined' && window.location?.pathname !== '/login') {
                window.location.href = '/login?expired=true';
            }
        }

        // Enhance error for downstream consumers by attaching structured metadata
        error.response = {
            ...error.response,
            ...structuredError,
            // Ensure the original data is preserved
            data: error.response?.data,
        };

        // Reject with the enriched error
        return Promise.reject(error);
    }
);

export default api;
