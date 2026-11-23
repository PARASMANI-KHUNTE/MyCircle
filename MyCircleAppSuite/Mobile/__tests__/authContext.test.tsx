jest.mock('../src/services/api', () => ({
    __esModule: true,
    default: { get: jest.fn() },
    setUnauthorizedHandler: jest.fn(),
}));

jest.mock('../src/utils/alert', () => ({
    Alert: { alert: jest.fn() },
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import * as Keychain from 'react-native-keychain';
import api from '../src/services/api';
import { Alert } from '../src/utils/alert';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

const flush = () => new Promise<void>((resolve) => setImmediate(() => resolve()));

const keychainGet = Keychain.getGenericPassword as jest.Mock;
const keychainSet = Keychain.setGenericPassword as jest.Mock;
const keychainReset = Keychain.resetGenericPassword as jest.Mock;
const apiGet = api.get as jest.Mock;
const alertMock = Alert.alert as jest.Mock;

let auth: any;

const Probe = () => {
    auth = useAuth();
    return null;
};

const mount = async () => {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
        tree = ReactTestRenderer.create(
            <AuthProvider>
                <Probe />
            </AuthProvider>
        );
        await flush();
    });
    return tree;
};

const loginWithProfile = async (profile: any) => {
    let resolveProfile!: (value: any) => void;
    apiGet.mockReturnValueOnce(new Promise((resolve) => { resolveProfile = resolve; }));

    await ReactTestRenderer.act(async () => {
        await auth.login('token-1');
        await flush();
    });

    await ReactTestRenderer.act(async () => {
        resolveProfile({ data: profile });
        await flush();
    });
};

describe('AuthContext', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        keychainGet.mockResolvedValue(false);
        keychainSet.mockResolvedValue(false);
        keychainReset.mockResolvedValue(true);
        apiGet.mockResolvedValue({ data: { _id: 'user-1', role: 'member' } });
        auth = undefined;
    });

    it('does not report a successful login when the token cannot be stored', async () => {
        await mount();
        expect(auth.isLoading).toBe(false);

        keychainSet.mockRejectedValueOnce(new Error('storage unavailable'));
        await ReactTestRenderer.act(async () => {
            await expect(auth.login('new-token')).rejects.toThrow('could not save your session');
        });

        expect(auth.token).toBeNull();
        expect(auth.isAuthenticated).toBe(false);
        expect(apiGet).not.toHaveBeenCalled();
    });

    it('keeps the app loading until the profile resolves and exposes admin access', async () => {
        await mount();
        let resolveProfile!: (value: any) => void;
        apiGet.mockReturnValueOnce(new Promise((resolve) => { resolveProfile = resolve; }));

        await ReactTestRenderer.act(async () => {
            await auth.login('admin-token');
            await flush();
        });

        expect(auth.token).toBe('admin-token');
        expect(auth.isLoading).toBe(true);
        expect(apiGet).toHaveBeenCalledWith('/user/profile');

        await ReactTestRenderer.act(async () => {
            resolveProfile({ data: { _id: 'user-1', role: 'admin' } });
            await flush();
        });

        expect(auth.isLoading).toBe(false);
        expect(auth.isAdmin).toBe(true);
    });

    it('clears local auth state even when keychain logout fails', async () => {
        await mount();
        await loginWithProfile({ _id: 'user-1', role: 'member' });
        expect(auth.isAuthenticated).toBe(true);

        keychainReset.mockRejectedValueOnce(new Error('keychain locked'));
        await ReactTestRenderer.act(async () => {
            await auth.logout();
            await flush();
        });

        expect(auth.token).toBeNull();
        expect(auth.user).toBeNull();
        expect(auth.isLoading).toBe(false);
        expect(alertMock).toHaveBeenCalledWith('Sign Out Issue', expect.stringContaining('storage'));
    });

    it('alerts before clearing state when the stored profile is missing', async () => {
        keychainGet.mockResolvedValue({ username: 'token', password: 'stored-token' });
        apiGet.mockRejectedValueOnce({ response: { status: 404 } });

        await mount();

        expect(auth.token).toBe('stored-token');
        expect(auth.isLoading).toBe(false);
        expect(alertMock).toHaveBeenCalledWith(
            'Account Not Found',
            expect.any(String),
            expect.arrayContaining([expect.objectContaining({ text: 'OK' })])
        );

        const buttons = alertMock.mock.calls[0][2];
        await ReactTestRenderer.act(async () => {
            buttons[0].onPress();
            await flush();
        });

        expect(auth.token).toBeNull();
        expect(auth.user).toBeNull();
    });
});
