import axios from 'axios';
import * as Keychain from 'react-native-keychain';
import { API_URL, DEV_API_URL } from '@env';

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;
let lastUnauthorizedAt = 0;
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

export const setUnauthorizedHandler = (handler: UnauthorizedHandler | null) => {
    unauthorizedHandler = handler;
};

const subscribeTokenRefresh = (callback: (token: string) => void) => {
    refreshSubscribers.push(callback);
};

const onRefreshed = (token: string) => {
    refreshSubscribers.forEach(callback => callback(token));
    refreshSubscribers = [];
};

const normalizeBaseUrl = (value?: string) => {
    if (!value) return '';
    return value.endsWith('/api') ? value : `${value.replace(/\/$/, '')}/api`;
};

export const BASE_URL = __DEV__
    ? (normalizeBaseUrl(DEV_API_URL) || normalizeBaseUrl(API_URL) || 'http://10.0.2.2:5000/api')
    : (normalizeBaseUrl(API_URL) || 'https://mycircle-71hh.onrender.com/api');

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Request interceptor - Add auth token
api.interceptors.request.use(
    async (config) => {
        const credentials = await Keychain.getGenericPassword({ service: 'access_token' });
        if (credentials) {
            config.headers['x-auth-token'] = credentials.password;
        }

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

// Response interceptor - Handle errors and auto-refresh
api.interceptors.response.use(
    (response) => {
        if (__DEV__) {
            console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        const status = error?.response?.status;

        // Handle 401 with automatic token refresh
        if (status === 401 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;

            if (!isRefreshing) {
                isRefreshing = true;
                try {
                    const refreshCreds = await Keychain.getGenericPassword({ service: 'refresh_token' });
                    if (!refreshCreds) {
                        throw new Error('No refresh token available');
                    }

                    const res = await axios.post(`${BASE_URL}/auth/refresh`, {
                        refreshToken: refreshCreds.password,
                    });

                    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = res.data;

                    await Promise.all([
                        Keychain.setGenericPassword('access_token', newAccessToken),
                        Keychain.setGenericPassword('refresh_token', newRefreshToken),
                    ]);

                    // Update axios default header
                    api.defaults.headers.common['x-auth-token'] = newAccessToken;
                    originalRequest.headers['x-auth-token'] = newAccessToken;

                    onRefreshed(newAccessToken);
                    isRefreshing = false;

                    return api(originalRequest);
                } catch (refreshError) {
                    isRefreshing = false;
                    refreshSubscribers = [];

                    // Clear tokens on refresh failure
                    await Promise.all([
                        Keychain.resetGenericPassword({ service: 'access_token' }),
                        Keychain.resetGenericPassword({ service: 'refresh_token' }),
                    ]).catch(() => {});

                    if (unauthorizedHandler) {
                        const now = Date.now();
                        if (now - lastUnauthorizedAt > 3000) {
                            lastUnauthorizedAt = now;
                            try {
                                unauthorizedHandler();
                            } catch (e) {
                                console.error('Unauthorized handler failed:', e);
                            }
                        }
                    }

                    return Promise.reject(refreshError);
                }
            } else {
                // Wait for the token refresh to complete
                return new Promise((resolve, reject) => {
                    subscribeTokenRefresh((token: string) => {
                        originalRequest.headers['x-auth-token'] = token;
                        resolve(api(originalRequest));
                    });
                });
            }
        }

        if (status === 401 && unauthorizedHandler) {
            const now = Date.now();
            if (now - lastUnauthorizedAt > 3000) {
                lastUnauthorizedAt = now;
                try {
                    unauthorizedHandler();
                } catch (e) {
                    console.error('Unauthorized handler failed:', e);
                }
            }
        }

        // Log errors
        if (error.response) {
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
            console.error('API No Response:', error.message);
        } else {
            console.error('API Request Setup Error:', error.message);
        }

        return Promise.reject(error);
    }
);

export default api;