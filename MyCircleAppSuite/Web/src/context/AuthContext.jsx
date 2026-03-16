import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import axios from 'axios';

const isProduction = import.meta.env.PROD;
const apiURL = isProduction
    ? (import.meta.env.VITE_API_URL || '')
    : (import.meta.env.VITE_API_URL_DEV || '');

if (isProduction && !apiURL) {
    throw new Error('VITE_API_URL is not set. Please configure it in your web .env file.');
}

if (!isProduction && !apiURL) {
    throw new Error('VITE_API_URL_DEV is not set. Please configure it in your web .env file.');
}

const AuthContext = createContext();

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
            // Check for token in URL hash fragment (new method) or query params (legacy)
            let tokenFromUrl = null;
            
            // Check hash fragment first (new method - token not sent to server)
            const hash = window.location.hash;
            if (hash && hash.includes('token=')) {
                tokenFromUrl = hash.split('token=')[1];
            } else {
                // Fallback to query params for backward compatibility
                const params = new URLSearchParams(window.location.search);
                tokenFromUrl = params.get('token');
            }

            if (tokenFromUrl) {
                if (!tokenFromUrl || tokenFromUrl.length < 10) {
                    window.history.replaceState({}, document.title, window.location.pathname);
                    setLoading(false);
                    return;
                }
                localStorage.setItem('token', tokenFromUrl);
                setToken(tokenFromUrl);
                window.history.replaceState({}, document.title, window.location.pathname);
                const userData = await fetchUserProfile();
                if (userData) {
                    navigate('/feed', { replace: true });
                }
            } else {
                const storedToken = localStorage.getItem('token');
                if (storedToken) {
                    setToken(storedToken);
                    await fetchUserProfile();
                } else {
                    setLoading(false);
                }
            }
        };

        checkAuth();

        const handleStorage = (e) => {
            if (e.key === 'token') {
                setToken(e.newValue);
                if (e.newValue) checkAuth();
                else setUser(null);
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [fetchUserProfile, navigate]);

    const login = useCallback(async (tokenOrEmail, isEmail = false) => {
        if (isEmail) {
            try {
                const res = await axios.post(`${apiURL}/auth/dev-login`, { email: tokenOrEmail });
                localStorage.setItem('token', res.data.token);
                setToken(res.data.token);
                await fetchUserProfile();
            } catch (err) {
                console.error("Dev login failed:", err.message);
                throw err;
            }
        } else if (tokenOrEmail) {
            localStorage.setItem('token', tokenOrEmail);
            setToken(tokenOrEmail);
            await fetchUserProfile();
        } else {
            window.location.href = `${apiURL}/auth/google`;
        }
    }, [fetchUserProfile]);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    }, []);

    const value = useMemo(() => ({
        user,
        login,
        logout,
        refreshUser: fetchUserProfile,
        loading,
        isAuthenticated: !!user,
        token
    }), [user, login, logout, fetchUserProfile, loading, token]);

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
