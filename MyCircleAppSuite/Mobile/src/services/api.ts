import axios from 'axios';
import { NativeModules, Platform } from 'react-native';
import { API_URL, DEV_API_URL } from '@env';
import {
    clearTokens,
    getAccessToken,
    getRefreshToken,
    saveTokens,
} from './tokenStorage';

type UnauthorizedHandler = () => void;

type RetriableRequestConfig = {
    url?: string;
    method?: string;
    baseURL?: string;
    headers?: Record<string, any>;
    _retry?: boolean;
    _retriedNetwork?: boolean;
    _startedAt?: number;
};

let unauthorizedHandler: UnauthorizedHandler | null = null;
let lastUnauthorizedAt = 0;

const DEFAULT_PROD_API_URL = 'https://mycircle-71hh.onrender.com/api';
const DEV_API_PORT = 5000;
const PROBE_PATH = '/health/live';
const PROBE_TIMEOUT_MS = 1500;
const BASE_URL_CACHE_MS = 30_000;

// Auth endpoints must never trigger the "refresh token" flow. A 401 from the
// login endpoint means "wrong credentials", not "expired session".
const AUTH_ENDPOINTS_WITHOUT_REFRESH = [
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
    '/auth/logout',
    '/auth/google-mobile',
    '/auth/dev-login',
];

export const setUnauthorizedHandler = (handler: UnauthorizedHandler | null) => {
    unauthorizedHandler = handler;
};

const notifyUnauthorized = () => {
    if (!unauthorizedHandler) {
        return;
    }

    const now = Date.now();
    if (now - lastUnauthorizedAt <= 3000) {
        return;
    }

    lastUnauthorizedAt = now;
    try {
        unauthorizedHandler();
    } catch (error) {
        console.error('Unauthorized handler failed:', error);
    }
};

const normalizeBaseUrl = (value?: string) => {
    if (!value) {
        return '';
    }

    const trimmed = value.trim().replace(/\/+$/, '');
    if (!trimmed) {
        return '';
    }

    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const getMetroHost = (): string | null => {
    const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL;
    if (!scriptURL) {
        return null;
    }

    const match = scriptURL.match(/^https?:\/\/(\[[^\]]+\]|[^/:]+)/i);
    return match?.[1] || null;
};

/**
 * Build the list of hosts that can serve the API in development.
 *
 * A single hard-coded DEV_API_URL breaks as soon as the machine gets a new
 * LAN IP, the developer switches networks, or an Android emulator is used
 * (10.0.2.2 is the host alias there). The Metro bundle URL tells us which
 * machine the app is actually talking to, so its host is a reliable fallback.
 */
const buildDevCandidates = (): string[] => {
    const candidates: string[] = [];

    const add = (value?: string | null) => {
        const normalized = normalizeBaseUrl(value || undefined);
        if (normalized && !candidates.includes(normalized)) {
            candidates.push(normalized);
        }
    };

    // Explicit override always wins when it is reachable.
    add(DEV_API_URL);

    const metroHost = getMetroHost();
    if (metroHost) {
        add(`http://${metroHost}:${DEV_API_PORT}/api`);

        // When Metro is reached through `adb reverse`, its host is localhost.
        // On an emulator the API itself still lives behind 10.0.2.2.
        if (Platform.OS === 'android' && (metroHost === 'localhost' || metroHost === '127.0.0.1')) {
            add(`http://10.0.2.2:${DEV_API_PORT}/api`);
        }
    }

    if (Platform.OS === 'android') {
        add(`http://10.0.2.2:${DEV_API_PORT}/api`);
    }
    add(`http://localhost:${DEV_API_PORT}/api`);

    return candidates;
};

const selectDevBaseUrl = async (): Promise<string> => {
    const candidates = buildDevCandidates();

    for (const candidate of candidates) {
        try {
            await axios.get(`${candidate}${PROBE_PATH}`, {
                timeout: PROBE_TIMEOUT_MS,
                validateStatus: (status) => status === 200,
            });
            return candidate;
        } catch {
            // Host is not reachable; try the next candidate.
        }
    }

    return candidates[0] || `http://10.0.2.2:${DEV_API_PORT}/api`;
};

let activeBaseUrl = __DEV__
    ? (buildDevCandidates()[0] || `http://10.0.2.2:${DEV_API_PORT}/api`)
    : (normalizeBaseUrl(API_URL) || DEFAULT_PROD_API_URL);

const api = axios.create({
    baseURL: activeBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

const setActiveBaseUrl = (baseUrl: string) => {
    activeBaseUrl = baseUrl;
    api.defaults.baseURL = baseUrl;
};

export const getApiBaseUrl = () => activeBaseUrl;

let resolvePromise: Promise<string> | null = null;
let resolvedAt = 0;

/**
 * Resolve (and cache) the API host. In development this probes every
 * candidate so a stale `.env` IP or a network switch no longer results in
 * "Network Error" with no recovery.
 */
export const resolveApiBaseUrl = async (forceRefresh = false): Promise<string> => {
    if (!__DEV__) {
        const productionUrl = normalizeBaseUrl(API_URL) || DEFAULT_PROD_API_URL;
        if (activeBaseUrl !== productionUrl) {
            setActiveBaseUrl(productionUrl);
        }
        return productionUrl;
    }

    const now = Date.now();
    if (forceRefresh || !resolvePromise || now - resolvedAt > BASE_URL_CACHE_MS) {
        resolvedAt = now;
        resolvePromise = selectDevBaseUrl().then((baseUrl) => {
            setActiveBaseUrl(baseUrl);
            return baseUrl;
        });
    }

    return resolvePromise;
};

const isAuthEndpoint = (url?: string) => {
    if (!url) {
        return false;
    }

    const path = url.split('?')[0];
    return AUTH_ENDPOINTS_WITHOUT_REFRESH.some((endpoint) => path.endsWith(endpoint));
};

let refreshPromise: Promise<string> | null = null;

const requestNewAccessToken = async (): Promise<string> => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
        throw new Error('No refresh token available');
    }

    const baseURL = await resolveApiBaseUrl();
    const response = await axios.post(
        `${baseURL}/auth/refresh`,
        { refreshToken },
        { timeout: 20000 },
    );

    const { accessToken, refreshToken: newRefreshToken } = response.data || {};
    if (!accessToken || !newRefreshToken) {
        throw new Error('Invalid token refresh response');
    }

    await saveTokens(accessToken, newRefreshToken);
    return accessToken;
};

/**
 * Share a single refresh request between all concurrent 401s and make sure
 * waiting requests are rejected if the refresh fails (previously they could
 * wait forever, which looked like an API request that never responds).
 */
const getRefreshedAccessToken = () => {
    if (!refreshPromise) {
        refreshPromise = requestNewAccessToken().finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
};

const attachNetworkErrorDetails = (error: any) => {
    if (!error || error.response) {
        return error;
    }

    const baseUrl = error.config?.baseURL || activeBaseUrl;
    error.isNetworkError = true;
    error.friendlyMessage = error.code === 'ECONNABORTED'
        ? `The request to ${baseUrl} timed out. Please check your connection and try again.`
        : `Cannot reach the MyCircle API at ${baseUrl}. Check your internet connection and make sure the server is running.`;

    return error;
};

// Request interceptor - resolve the API host and add auth token
api.interceptors.request.use(
    async (config) => {
        try {
            config.baseURL = await resolveApiBaseUrl();
        } catch {
            config.baseURL = activeBaseUrl;
        }

        try {
            const accessToken = await getAccessToken();
            if (accessToken) {
                config.headers['x-auth-token'] = accessToken;
            }
        } catch (error) {
            console.warn('Unable to read the access token', error);
        }

        const retriableConfig = config as RetriableRequestConfig;
        retriableConfig._startedAt = Date.now();

        if (__DEV__) {
            console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    },
);

// Response interceptor - handle errors and auto-refresh
api.interceptors.response.use(
    (response) => {
        if (__DEV__) {
            console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config as RetriableRequestConfig | undefined;
        const status = error?.response?.status;
        const hadAccessToken = Boolean(originalRequest?.headers?.['x-auth-token']);

        // Handle 401 with automatic token refresh
        if (
            status === 401
            && hadAccessToken
            && originalRequest
            && !originalRequest._retry
            && !isAuthEndpoint(originalRequest.url)
        ) {
            originalRequest._retry = true;

            try {
                const newAccessToken = await getRefreshedAccessToken();
                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers['x-auth-token'] = newAccessToken;
                return api(originalRequest);
            } catch (refreshError) {
                await clearTokens();
                notifyUnauthorized();
                return Promise.reject(refreshError);
            }
        }

        // Retry idempotent requests that fail immediately. This usually means
        // the selected dev host was wrong (e.g. localhost vs 10.0.2.2), so
        // re-probe before giving up.
        if (!error.response && originalRequest && !originalRequest._retriedNetwork) {
            const method = (originalRequest.method || 'get').toLowerCase();
            const elapsed = typeof originalRequest._startedAt === 'number'
                ? Date.now() - originalRequest._startedAt
                : Number.POSITIVE_INFINITY;

            if ((method === 'get' || method === 'head') && elapsed < 5000) {
                originalRequest._retriedNetwork = true;
                try {
                    originalRequest.baseURL = await resolveApiBaseUrl(true);
                    return await api(originalRequest);
                } catch (retryError) {
                    error = retryError;
                }
            }
        }

        if (status === 401 && hadAccessToken && !isAuthEndpoint(originalRequest?.url)) {
            notifyUnauthorized();
        }

        // Log errors
        if (error.response) {
            if (error.response.status === 400) {
                console.warn('API 400 Error (Bad Request):', {
                    url: error.config?.url,
                    data: error.response.data,
                });
            } else {
                console.error('API Error Response:', {
                    status: error.response.status,
                    url: error.config?.url,
                    data: error.response.data,
                });
            }
        } else if (error.request) {
            console.error('API No Response:', error.message, '->', error.config?.baseURL || activeBaseUrl);
        } else {
            console.error('API Request Setup Error:', error.message);
        }

        return Promise.reject(attachNetworkErrorDetails(error));
    },
);

/**
 * Wake the API and resolve the dev host while the splash screen is visible.
 * Helps with free-tier hosts (Render) that spin down after inactivity.
 */
let warmUpPromise: Promise<void> | null = null;

export const warmUpApi = (): Promise<void> => {
    if (warmUpPromise) {
        return warmUpPromise;
    }

    warmUpPromise = (async () => {
        try {
            const baseUrl = await resolveApiBaseUrl(true);
            await axios.get(`${baseUrl}${PROBE_PATH}`, {
                timeout: __DEV__ ? 4000 : 45000,
            });
            if (__DEV__) {
                console.log(`API ready at ${baseUrl}`);
            }
        } catch (error) {
            if (__DEV__) {
                console.warn(
                    `API warm-up failed for ${activeBaseUrl}:`,
                    error instanceof Error ? error.message : error,
                );
            }
        }
    })();

    return warmUpPromise;
};

export default api;
