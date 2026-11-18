import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert } from '../utils/alert';
import api from '../services/api';
import { setUnauthorizedHandler } from '../services/api';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from '../services/tokenStorage';

interface AuthContextType {
    accessToken: string | null;
    refreshToken: string | null;
    user: any | null;
    isLoading: boolean;
    login: (accessToken: string, refreshToken: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    refreshAccessToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const [user, setUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        setUnauthorizedHandler(() => {
            Alert.alert(
                'Session Expired',
                'Your session has expired. Please log in again.',
                [{ text: 'OK', onPress: () => logout() }]
            );
        });

        return () => {
            setUnauthorizedHandler(null);
        };
    }, []);

    useEffect(() => {
        const loadAuth = async () => {
            try {
                const [storedAccessToken, storedRefreshToken] = await Promise.all([
                    getAccessToken(),
                    getRefreshToken(),
                ]);
                if (storedAccessToken) {
                    setAccessToken(storedAccessToken);
                }
                if (storedRefreshToken) {
                    setRefreshToken(storedRefreshToken);
                }
            } catch (e) {
                console.error('Failed to load credentials', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadAuth();
    }, []);

    const refreshAccessToken = useCallback(async (): Promise<boolean> => {
        if (!refreshToken || isRefreshing) {
            return false;
        }

        setIsRefreshing(true);
        try {
            const res = await api.post('/auth/refresh', { refreshToken });
            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = res.data;

            await saveTokens(newAccessToken, newRefreshToken);

            setAccessToken(newAccessToken);
            setRefreshToken(newRefreshToken);
            return true;
        } catch (e) {
            console.error('Failed to refresh access token', e);
            // Refresh token is invalid/expired - clear everything
            await logout();
            return false;
        } finally {
            setIsRefreshing(false);
        }
    }, [refreshToken, isRefreshing]);

    useEffect(() => {
        if (accessToken) {
            api.get('/user/profile')
                .then(res => setUser(res.data))
                .catch(err => {
                    console.error('Failed to fetch user profile', err);
                    if (err.response?.status === 404) {
                        logout();
                    }
                });
        } else {
            setUser(null);
        }
    }, [accessToken]);

    const login = async (newAccessToken: string, newRefreshToken: string) => {
        try {
            await saveTokens(newAccessToken, newRefreshToken);
            setAccessToken(newAccessToken);
            setRefreshToken(newRefreshToken);
        } catch (e) {
            console.error('Failed to save credentials', e);
        }
    };

    const logout = async () => {
        try {
            // Call server logout to revoke refresh token
            if (refreshToken) {
                try {
                    await api.post('/auth/logout');
                } catch (e) {
                    console.warn('Server logout failed, clearing local tokens anyway', e);
                }
            }
            await clearTokens();
            setAccessToken(null);
            setRefreshToken(null);
            setUser(null);
        } catch (e) {
            console.error('Failed to clear credentials', e);
        }
    };

    return (
        <AuthContext.Provider value={{
            accessToken,
            refreshToken,
            user,
            isLoading,
            login,
            logout,
            isAuthenticated: !!accessToken,
            refreshAccessToken,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};