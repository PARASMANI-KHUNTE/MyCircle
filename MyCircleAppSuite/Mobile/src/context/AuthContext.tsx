import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Alert } from '../utils/alert';
import * as Keychain from 'react-native-keychain';
import api from '../services/api';
import { setUnauthorizedHandler } from '../services/api';
import { isAdminUser } from '../utils/adminAccess';

interface AuthContextType {
    token: string | null;
    user: any | null;
    isLoading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const logout = useCallback(async () => {
        try {
            await Keychain.resetGenericPassword();
        } catch (e) {
            console.error('Failed to clear credentials', e);
            Alert.alert(
                'Sign Out Issue',
                'Your session will be cleared on this device, but secure storage could not be updated.'
            );
        } finally {
            // Never leave private/admin state active just because storage failed.
            setToken(null);
            setUser(null);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        setUnauthorizedHandler(() => {
            Alert.alert(
                'Session Expired',
                'Your session has expired. Please log in again.',
                [{ text: 'OK', onPress: () => { void logout(); } }]
            );
        });

        return () => {
            setUnauthorizedHandler(null);
        };
    }, [logout]);

    useEffect(() => {
        let active = true;
        let hasCredentials = false;

        const loadAuth = async () => {
            try {
                const credentials = await Keychain.getGenericPassword();
                if (credentials) {
                    hasCredentials = true;
                    if (active) setToken(credentials.password);
                }
            } catch (e) {
                console.error('Failed to load credentials', e);
                if (active) {
                    Alert.alert('Session Unavailable', 'We could not read your saved session. Please sign in again.');
                }
            } finally {
                if (active && !hasCredentials) setIsLoading(false);
            }
        };
        loadAuth();

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;

        if (!token) {
            setUser(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        api.get('/user/profile')
            .then(res => {
                if (active) setUser(res.data);
            })
            .catch(err => {
                if (!active) return;
                console.error('Failed to fetch user profile', err);
                if (err.response?.status === 404) {
                    Alert.alert(
                        'Account Not Found',
                        'Your account no longer exists, so you will be signed out.',
                        [{ text: 'OK', onPress: () => { void logout(); } }]
                    );
                }
            })
            .finally(() => {
                if (active) setIsLoading(false);
            });

        return () => {
            active = false;
        };
    }, [token, logout]);

    const login = useCallback(async (newToken: string) => {
        if (!newToken) {
            throw new Error('A session token is required');
        }

        try {
            await Keychain.setGenericPassword('token', newToken);
        } catch (e) {
            console.error('Failed to save credentials', e);
            // Callers own the user-facing alert; throwing prevents a false successful login.
            throw new Error(
                'We could not save your session on this device. Please check your device storage settings and try again.'
            );
        }
        setToken(newToken);
    }, []);

    return (
        <AuthContext.Provider value={{
            token,
            user,
            isLoading,
            login,
            logout,
            isAuthenticated: !!token,
            isAdmin: isAdminUser(user)
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
