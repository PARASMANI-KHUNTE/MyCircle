import axios from 'axios';

const isProduction = import.meta.env.PROD;
let rawApiURL = isProduction
    ? (import.meta.env.VITE_API_URL || '')
    : (import.meta.env.VITE_API_URL_DEV || 'http://localhost:5000');

// Robust URL check: Ensure it has http/https. 
// If it starts with ':', assume it's a port and prepend localhost.
if (rawApiURL.startsWith(':')) {
    rawApiURL = `http://localhost${rawApiURL}`;
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

export default api;
