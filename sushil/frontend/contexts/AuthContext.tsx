import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';

const STORAGE_KEY = 'mc_auth_token';

interface AuthContextValue {
  token: string | null;
  currentUser: User | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: (overrideToken?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const applyToken = useCallback((value: string | null) => {
    setToken(value);
    if (value) {
      localStorage.setItem(STORAGE_KEY, value);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const refreshUser = useCallback(async (overrideToken?: string) => {
    const activeToken = overrideToken ?? token;
    if (!activeToken) {
      setCurrentUser(null);
      return;
    }
    setLoading(true);
    try {
      const profile = await api.getCurrentUser(activeToken);
      setCurrentUser(profile);
    } catch (err) {
      console.error('Failed to fetch current user', err);
      applyToken(null);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, [token, applyToken]);

  const login = useCallback(async (email: string) => {
    setLoading(true);
    try {
      const { token: issuedToken } = await api.devLogin(email);
      applyToken(issuedToken);
      await refreshUser(issuedToken);
    } finally {
      setLoading(false);
    }
  }, [applyToken, refreshUser]);

  const loginWithToken = useCallback(
    async (issuedToken: string) => {
      applyToken(issuedToken);
      await refreshUser(issuedToken);
    },
    [applyToken, refreshUser]
  );

  const logout = useCallback(() => {
    applyToken(null);
    setCurrentUser(null);
  }, [applyToken]);

  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEY);
    if (storedToken) {
      setToken(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      refreshUser();
    }
  }, [token, refreshUser]);

  const value = useMemo<AuthContextValue>(() => ({
    token,
    currentUser,
    loading,
    login: async (email: string) => {
      await login(email);
      await refreshUser();
    },
    loginWithToken,
    logout,
    refreshUser,
  }), [token, currentUser, loading, login, logout, refreshUser, loginWithToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
