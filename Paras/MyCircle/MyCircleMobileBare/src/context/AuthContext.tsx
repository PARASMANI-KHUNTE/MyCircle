import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Keychain from 'react-native-keychain';
import api from '../services/api';

interface AuthContextType {
    token: string | null;
    user: any | null;
    isLoading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadAuth = async () => {
            try {
                const credentials = await Keychain.getGenericPassword();
                if (credentials) {
                    setToken(credentials.password);
                }
            } catch (e) {
                console.error('Failed to load credentials', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadAuth();
    }, []);

    useEffect(() => {
        if (token) {
            api.get('/user/profile')
                .then(res => setUser(res.data))
                .catch(err => {
                    console.error('Failed to fetch user profile', err);
                    if (err.response?.status === 401) {
                        logout();
                    }
                });
        } else {
            setUser(null);
        }
    }, [token]);

    const login = async (newToken: string) => {
        try {
            await Keychain.setGenericPassword('token', newToken);
            setToken(newToken);
        } catch (e) {
            console.error('Failed to save credentials', e);
        }
    };

    const logout = async () => {
        try {
            await Keychain.resetGenericPassword();
            setToken(null);
            setUser(null);
        } catch (e) {
            console.error('Failed to clear credentials', e);
        }
    };

    return (
        <AuthContext.Provider value={{
            token,
            user,
            isLoading,
            login,
            logout,
            isAuthenticated: !!token
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
