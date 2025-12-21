import axios from 'axios';

const isProduction = import.meta.env.PROD;
const apiURL = isProduction
    ? (import.meta.env.VITE_API_URL || '')
    : (import.meta.env.VITE_API_URL_DEV || 'http://localhost:5000');

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
