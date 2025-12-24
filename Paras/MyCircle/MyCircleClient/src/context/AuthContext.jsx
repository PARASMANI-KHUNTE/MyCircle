import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import axios from 'axios';

const isProduction = import.meta.env.PROD;
const apiURL = isProduction
    ? (import.meta.env.VITE_API_URL || '')
    : (import.meta.env.VITE_API_URL_DEV || 'http://localhost:5000');

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    const fetchUserProfile = async () => {
        try {
            const res = await api.get('/user/profile');
            setUser(res.data);
            return res.data; // Return user data for conditional redirects
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
                const userData = await fetchUserProfile();
                if (userData) {
                    navigate('/dashboard');
                }
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
                const res = await axios.post(`${apiURL}/auth/dev-login`, { email: tokenOrEmail });
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
            window.location.href = `${apiURL}/auth/google`;
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
