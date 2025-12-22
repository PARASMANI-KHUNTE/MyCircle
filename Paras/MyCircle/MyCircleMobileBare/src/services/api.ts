import axios from 'axios';
import * as Keychain from 'react-native-keychain';
import { API_URL } from '@env';

export const BASE_URL = API_URL || 'http://10.0.2.2:5000/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (config) => {
        const credentials = await Keychain.getGenericPassword();
        if (credentials) {
            config.headers['x-auth-token'] = credentials.password;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
