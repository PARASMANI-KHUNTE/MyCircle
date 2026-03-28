import axios from 'axios';

const normalizeBaseUrl = (value) => {
    if (!value) return '';

    let normalized = value.trim();
    if (normalized.startsWith(':')) {
        throw new Error('API URL env var must be a full URL (e.g. http://localhost:5000). Port-only values like ":5000" are not supported.');
    }
    if (!normalized.startsWith('http')) {
        normalized = `http://${normalized}`;
    }

    return normalized.replace(/\/api\/?$/, '');
};

const isProduction = import.meta.env.PROD;
let rawApiURL = isProduction
    ? (import.meta.env.VITE_API_URL || '')
    : (import.meta.env.VITE_API_URL_DEV || '');

if (isProduction && !rawApiURL) {
    throw new Error('VITE_API_URL is not set. Please configure it in your web .env file.');
}

if (!isProduction && !rawApiURL) {
    throw new Error('VITE_API_URL_DEV is not set. Please configure it in your web .env file.');
}

// Robust URL check: Ensure it has http/https. 
const apiURL = normalizeBaseUrl(rawApiURL);

const api = axios.create({
    baseURL: `${apiURL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getSocketBaseUrl = () => apiURL;

// Add a request interceptor to include the auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add a response interceptor to handle auth expiry globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;

        if (status === 401) {
            try {
                localStorage.removeItem('token');
            } catch {
                // ignore storage errors
            }

            // Simple notification or redirect
            if (typeof window !== 'undefined' && (window.location?.pathname !== '/' && window.location?.pathname !== '/login')) {
                // Redirect to landing page with a message
                window.location.href = '/?expired=true';
            }
        }

        return Promise.reject(error);
    }
);

export default api;
