import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

interface AuthContextType {
    token: string | null;
    user: any | null;
    isLoading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const loadAuth = async () => {
            const storedToken = await SecureStore.getItemAsync('token');
            if (storedToken) {
                setToken(storedToken);
                // Fetch user profile if token exists
                try {
                    // Import api here or use fetch to avoid circular dependency
                    // For now, let's assume we fetch it
                } catch (e) {
                    console.error('Failed to load user', e);
                }
            }
            setIsLoading(false);
        };
        loadAuth();
    }, []);

    // Also fetch user whenever token changes (e.g. after login)
    useEffect(() => {
        if (token) {
            import('../services/api').then(module => {
                module.default.get('/user/profile')
                    .then(res => setUser(res.data))
                    .catch(err => console.error(err));
            });
        } else {
            setUser(null);
        }
    }, [token]);

    const login = async (newToken: string) => {
        await SecureStore.setItemAsync('token', newToken);
        setToken(newToken);
        router.replace('/(tabs)');
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync('token');
        setToken(null);
        setUser(null);
        router.replace('/');
    };

    return (
        <AuthContext.Provider value={{ token, user, isLoading, login, logout }}>
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
