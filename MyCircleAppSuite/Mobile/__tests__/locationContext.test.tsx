const mockRequestLocationAccess = jest.fn((..._args: any[]): any => undefined);
const mockGetCurrentLocation = jest.fn((..._args: any[]): any => undefined);
const mockWatchLocation = jest.fn((..._args: any[]): any => 7);
const mockClearLocationWatch = jest.fn((..._args: any[]): any => undefined);
const mockIsLocationPermissionGranted = jest.fn((..._args: any[]): any => false);
const mockOpenLocationSettings = jest.fn((..._args: any[]): any => undefined);

jest.mock('../src/utils/location', () => ({
    requestLocationAccess: (...args: any[]) => mockRequestLocationAccess(...args),
    getCurrentLocation: (...args: any[]) => mockGetCurrentLocation(...args),
    watchLocation: (...args: any[]) => mockWatchLocation(...args),
    clearLocationWatch: (watchId: number) => mockClearLocationWatch(watchId),
    isLocationPermissionGranted: (...args: any[]) => mockIsLocationPermissionGranted(...args),
    openLocationSettings: (...args: any[]) => mockOpenLocationSettings(...args),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationProvider, useLocation } from '../src/context/LocationContext';

const ASKED_KEY = '@mycircle:location_permission_asked_v1';
const flush = () => new Promise<void>((resolve) => setImmediate(() => resolve()));

let latest: ReturnType<typeof useLocation>;
const Consumer = () => {
    latest = useLocation();
    return null;
};

const renderProvider = async () => {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
        tree = ReactTestRenderer.create(
            <LocationProvider>
                <Consumer />
            </LocationProvider>
        );
        await flush();
    });
    return tree;
};

describe('LocationProvider permission handling', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        await AsyncStorage.removeItem(ASKED_KEY);
        mockIsLocationPermissionGranted.mockResolvedValue(false);
        mockRequestLocationAccess.mockResolvedValue('denied');
        mockGetCurrentLocation.mockResolvedValue(null);
    });

    it('records the asked flag only after the prompt settles and keeps a normal denial', async () => {
        let resolvePrompt!: (result: string) => void;
        mockRequestLocationAccess.mockImplementation(() => new Promise((resolve) => {
            resolvePrompt = resolve;
        }));

        const tree = await renderProvider();

        expect(mockRequestLocationAccess).toHaveBeenCalledTimes(1);
        expect(AsyncStorage.setItem).not.toHaveBeenCalled();

        await ReactTestRenderer.act(async () => {
            resolvePrompt('denied');
            await flush();
        });

        expect(latest.permissionStatus).toBe('denied');
        expect(latest.error).toContain('required for nearby posts');
        expect(latest.error).not.toContain('blocked');
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(ASKED_KEY, 'true');

        await ReactTestRenderer.act(async () => {
            tree.unmount();
        });
    });

    it('shows the blocked-settings message only for a permanent block', async () => {
        mockRequestLocationAccess.mockResolvedValue('never_ask_again');

        const tree = await renderProvider();

        expect(latest.permissionStatus).toBe('never_ask_again');
        expect(latest.error).toContain('device settings');

        await ReactTestRenderer.act(async () => {
            tree.unmount();
        });
    });

    it('resolves access once per explicit request and skips the duplicate permission check', async () => {
        await AsyncStorage.setItem(ASKED_KEY, 'true');
        mockRequestLocationAccess.mockResolvedValue('granted');
        mockGetCurrentLocation.mockResolvedValue({
            latitude: 0,
            longitude: 0,
            address: '0.0000, 0.0000',
        });

        const tree = await renderProvider();

        await ReactTestRenderer.act(async () => {
            await latest.requestLocation();
            await flush();
        });

        expect(mockRequestLocationAccess).toHaveBeenCalledTimes(1);
        expect(mockGetCurrentLocation).toHaveBeenCalledWith({ skipPermissionCheck: true });
        expect(latest.location).toEqual({ lat: 0, lng: 0 });

        await ReactTestRenderer.act(async () => {
            tree.unmount();
        });
    });
});
