import axios from 'axios';

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
if (rawApiURL.startsWith(':')) {
    throw new Error('API URL env var must be a full URL (e.g. http://localhost:5000). Port-only values like ":5000" are not supported.');
} else if (rawApiURL && !rawApiURL.startsWith('http')) {
    rawApiURL = `http://${rawApiURL}`;
}

const apiURL = rawApiURL;

const api = axios.create({
    baseURL: `${apiURL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

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
            } catch (_) {
                // ignore storage errors
            }

            if (typeof window !== 'undefined' && window.location?.pathname !== '/') {
                window.location.href = '/';
            }
        }

        return Promise.reject(error);
    }
);

export default api;
