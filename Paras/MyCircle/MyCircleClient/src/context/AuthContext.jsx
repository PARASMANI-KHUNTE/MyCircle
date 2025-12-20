import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUserProfile = async () => {
        try {
            const res = await api.get('/user/profile');
            setUser(res.data);
        } catch (err) {
            console.error("Error fetching profile:", err.message);
            // If fetching profile fails, token might be invalid
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            // Check for token in URL params (Redirected from backend Google Auth)
            const params = new URLSearchParams(window.location.search);
            const tokenFromUrl = params.get('token');

            if (tokenFromUrl) {
                localStorage.setItem('token', tokenFromUrl);
                // Remove token from URL for clean state
                window.history.replaceState({}, document.title, window.location.pathname);
                await fetchUserProfile();
            } else {
                const storedToken = localStorage.getItem('token');
                if (storedToken) {
                    await fetchUserProfile();
                } else {
                    setLoading(false);
                }
            }
        };

        checkAuth();

        // Listen for storage events to sync tabs
        const handleStorage = (e) => {
            if (e.key === 'token') {
                if (e.newValue) checkAuth();
                else setUser(null);
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const login = async (tokenOrEmail, isEmail = false) => {
        if (isEmail) {
            // Dev Login via Backend
            try {
                const res = await axios.post('http://localhost:5000/auth/dev-login', { email: tokenOrEmail });
                localStorage.setItem('token', res.data.token);
                await fetchUserProfile();
            } catch (err) {
                console.error("Dev login failed:", err.message);
                throw err;
            }
        } else if (tokenOrEmail) {
            // Standard token-based login
            localStorage.setItem('token', tokenOrEmail);
            await fetchUserProfile();
        } else {
            // Redirect to backend auth (Google)
            window.location.href = 'http://localhost:5000/auth/google';
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            refreshUser: fetchUserProfile,
            loading,
            isAuthenticated: !!user,
            token: localStorage.getItem('token')
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
