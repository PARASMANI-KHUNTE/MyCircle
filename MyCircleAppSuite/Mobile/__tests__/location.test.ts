import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform } from 'react-native';
import * as LocationEnabler from 'react-native-android-location-enabler';
import {
    clearLocationWatch,
    getCurrentLocation,
    watchLocation,
} from '../src/utils/location';

describe('location utilities', () => {
    const originalOS = Platform.OS;

    beforeEach(() => {
        jest.clearAllMocks();
        (Platform as any).OS = 'android';
        (PermissionsAndroid.check as jest.Mock).mockResolvedValue(true);
        (PermissionsAndroid.request as jest.Mock).mockResolvedValue(
            PermissionsAndroid.RESULTS.GRANTED
        );
        (LocationEnabler.isLocationEnabled as jest.Mock).mockResolvedValue(true);
        (LocationEnabler.promptForEnableLocationIfNeeded as jest.Mock).mockResolvedValue(
            'already-enabled'
        );
        (globalThis as any).fetch = jest.fn().mockRejectedValue(new Error('offline'));
    });

    afterEach(() => {
        (Platform as any).OS = originalOS;
    });

    it('returns a device fix with a coordinate address fallback', async () => {
        (Geolocation.getCurrentPosition as jest.Mock).mockImplementation((success, _error, options) => {
            if (options.enableHighAccuracy) {
                success({ coords: { latitude: 28.6139, longitude: 77.209 } });
            }
        });

        const result = await getCurrentLocation();

        expect(result).toEqual({
            latitude: 28.6139,
            longitude: 77.209,
            address: '28.6139, 77.2090',
        });
        expect(Geolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
    });

    it('falls back to low accuracy when high accuracy fails', async () => {
        (Geolocation.getCurrentPosition as jest.Mock).mockImplementation((success, error, options) => {
            if (options.enableHighAccuracy) {
                error({ code: 2, message: 'high accuracy unavailable' });
            } else {
                success({ coords: { latitude: 19.076, longitude: 72.8777 } });
            }
        });

        const result = await getCurrentLocation();

        expect(result?.latitude).toBe(19.076);
        expect(result?.longitude).toBe(72.8777);
        expect(Geolocation.getCurrentPosition).toHaveBeenCalledTimes(2);
    });

    it('accepts approximate location when precise permission is declined', async () => {
        (PermissionsAndroid.check as jest.Mock).mockImplementation((permission: string) =>
            Promise.resolve(permission === PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION)
        );
        (PermissionsAndroid.request as jest.Mock).mockResolvedValue(
            PermissionsAndroid.RESULTS.DENIED
        );
        (Geolocation.getCurrentPosition as jest.Mock).mockImplementation((success, _error, options) => {
            if (options.enableHighAccuracy) {
                success({ coords: { latitude: 28.6139, longitude: 77.209 } });
            }
        });

        const result = await getCurrentLocation();

        expect(result?.latitude).toBe(28.6139);
        expect(Geolocation.getCurrentPosition).toHaveBeenCalled();
    });

    it('does not ask the device for a position when permission is denied', async () => {
        (PermissionsAndroid.check as jest.Mock).mockResolvedValue(false);
        (PermissionsAndroid.request as jest.Mock).mockResolvedValue(
            PermissionsAndroid.RESULTS.DENIED
        );

        const result = await getCurrentLocation();

        expect(result).toBeNull();
        expect(Geolocation.getCurrentPosition).not.toHaveBeenCalled();
    });

    it('registers and clears position watchers', () => {
        const onChange = jest.fn();
        const watchId = watchLocation(onChange);

        expect(watchId).toBe(1);
        expect(Geolocation.watchPosition).toHaveBeenCalledTimes(1);

        clearLocationWatch(watchId);
        expect(Geolocation.clearWatch).toHaveBeenCalledWith(1);
    });
});
