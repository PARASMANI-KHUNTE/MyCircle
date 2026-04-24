import axios from 'axios';

const normalizeBaseUrl = (value) => {
    if (!value) return 'http://localhost:5000';

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
    ? (import.meta.env.VITE_API_URL || '')
    : (import.meta.env.VITE_API_URL_DEV || 'http://localhost:5000');

const apiURL = normalizeBaseUrl(rawApiURL);

const api = axios.create({
    baseURL: `${apiURL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
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
            if (typeof window !== 'undefined' && window.location?.pathname !== '/login') {
                window.location.href = '/login?expired=true';
            }
        }

        return Promise.reject(error);
    }
);

export default api;
