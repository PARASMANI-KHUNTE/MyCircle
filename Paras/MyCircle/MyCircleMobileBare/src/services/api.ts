import axios from 'axios';
import * as Keychain from 'react-native-keychain';
import { API_URL, DEV_API_URL } from '@env';

import { Platform } from 'react-native';

export const BASE_URL = __DEV__ ? DEV_API_URL : API_URL;

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 second timeout for AI operations
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
            if (error.response.status === 400) {
                console.warn('API 400 Error (Bad Request):', {
                    url: error.config?.url,
                    data: error.response.data
                });
            } else {
                console.error('API Error Response:', {
                    status: error.response.status,
                    url: error.config?.url,
                    data: error.response.data
                });
            }
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
