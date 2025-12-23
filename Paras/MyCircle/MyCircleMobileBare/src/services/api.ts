import axios from 'axios';
import * as Keychain from 'react-native-keychain';
import { API_URL } from '@env';

export const BASE_URL = API_URL || 'https://mycircleserver.onrender.com/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
});

// Request interceptor - Add auth token
api.interceptors.request.use(
    async (config) => {
        const credentials = await Keychain.getGenericPassword();
        if (credentials) {
            config.headers['x-auth-token'] = credentials.password;
        }

        // Log requests in development
        if (__DEV__) {
            console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
    (response) => {
        // Log successful responses in development
        if (__DEV__) {
            console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
        }
        return response;
    },
    (error) => {
        // Log errors
        if (error.response) {
            // Server responded with error status
            console.error('API Error Response:', {
                status: error.response.status,
                url: error.config?.url,
                data: error.response.data
            });
        } else if (error.request) {
            // Request made but no response
            console.error('API No Response:', error.message);
        } else {
            // Error setting up request
            console.error('API Request Setup Error:', error.message);
        }

        return Promise.reject(error);
    }
);

export default api;
