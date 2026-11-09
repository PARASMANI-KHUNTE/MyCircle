import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getSocketBaseUrl } from '../utils/api';
import Loading from '../components/ui/Loading';
import axios from 'axios';

const AuthContext = createContext();

const authBaseUrl = getSocketBaseUrl();

const stripAuthFromUrl = () => {
    try {
        const url = new URL(window.location.href);
        const params = new URLSearchParams(url.search);
        params.delete('token');
        url.search = params.toString() ? `?${params.toString()}` : '';

        if (url.hash && url.hash.includes('token=')) {
            url.hash = '';
        }

        window.history.replaceState({}, document.title, url.pathname + url.search);
    } catch {
        // ignore URL parsing errors
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(() => localStorage.getItem('token'));

    const navigate = useNavigate();

    const fetchUserProfile = useCallback(async () => {
        try {
            const res = await api.get('/user/profile');
            setUser(res.data);
            return res.data;
        } catch (err) {
            const status = err?.response?.status;
            if (status === 401 || status === 403) {
                localStorage.removeItem('token');
                setToken(null);
                setUser(null);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                let tokenFromUrl = null;

                const hash = window.location.hash;
                if (hash && hash.includes('token=')) {
                    const tokenPart = hash.split('token=')[1]?.split('&')[0];
                    if (tokenPart && tokenPart.length >= 50) {
                        tokenFromUrl = tokenPart;
                    }
                } else {
                    const params = new URLSearchParams(window.location.search);
                    const queryToken = params.get('token');
                    if (queryToken && queryToken.length >= 50) {
                        tokenFromUrl = queryToken;
                    }
                }

                if (tokenFromUrl) {
                    localStorage.setItem('token', tokenFromUrl);
                    setToken(tokenFromUrl);
                    stripAuthFromUrl();
                    try {
                        const userData = await fetchUserProfile();
                        if (userData) {
                            navigate('/', { replace: true });
                        } else {
                            localStorage.removeItem('token');
                            setToken(null);
                        }
                    } catch {
                        localStorage.removeItem('token');
                        setToken(null);
                    }
                } else {
                    const storedToken = localStorage.getItem('token');
                    if (storedToken) {
                        setToken(storedToken);
                        await fetchUserProfile();
                    }
                }
            } catch (error) {
                console.error('Auth check failed:', error);
            } finally {
                setLoading(false);
            }
        };

        void checkAuth();

        const timeoutId = setTimeout(() => {
            setLoading(false);
        }, 10000);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [fetchUserProfile, navigate]);

    const login = useCallback(async (tokenOrEmail, isEmail = false) => {
        if (isEmail) {
            try {
                const res = await axios.post(`${authBaseUrl}/auth/dev-login`, { email: tokenOrEmail });
                localStorage.setItem('token', res.data.token);
                setToken(res.data.token);
                await fetchUserProfile();
            } catch (err) {
                console.error('Dev login failed:', err.message);
                throw err;
            }
        } else if (tokenOrEmail) {
            localStorage.setItem('token', tokenOrEmail);
            setToken(tokenOrEmail);
            await fetchUserProfile();
        } else {
            const returnTo = encodeURIComponent(window.location.origin);
            window.location.href = `${authBaseUrl}/auth/google?returnTo=${returnTo}`;
        }
    }, [fetchUserProfile]);

    const persistSession = useCallback(async (newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        await fetchUserProfile();
    }, [fetchUserProfile]);

    const loginWithPassword = useCallback(async (email, password) => {
        const res = await axios.post(`${authBaseUrl}/auth/login`, { email, password });
        await persistSession(res.data.token);
    }, [persistSession]);

    const registerUser = useCallback(async (displayName, email, password) => {
        const res = await axios.post(`${authBaseUrl}/auth/register`, { displayName, email, password });
        await persistSession(res.data.token);
    }, [persistSession]);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    }, []);

    const value = useMemo(() => ({
        user,
        login,
        loginWithPassword,
        registerUser,
        logout,
        refreshUser: fetchUserProfile,
        loading,
        isAuthenticated: !!user,
        token
    }), [user, login, loginWithPassword, registerUser, logout, fetchUserProfile, loading, token]);

    return (
        <AuthContext.Provider value={value}>
            {loading ? <Loading fullscreen text="Loading..." /> : children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
