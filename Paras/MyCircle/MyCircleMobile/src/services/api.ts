import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// NOTE: Uses localhost for Android Emulator (10.0.2.2) or local IP for physical device
// NOTE: Uses localhost for Android Emulator (10.0.2.2) or local IP for physical device
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.10:5000/api';
const AUTH_URL = `${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.10:5000'}/auth`;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const saveToken = async (token: string) => {
    await SecureStore.setItemAsync('token', token);
};

export const getToken = async () => {
    return await SecureStore.getItemAsync('token');
};

export const removeToken = async () => {
    await SecureStore.deleteItemAsync('token');
};

export { API_URL, AUTH_URL };
export default api;
