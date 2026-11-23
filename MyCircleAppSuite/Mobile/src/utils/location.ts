import { Linking, PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import * as LocationEnabler from 'react-native-android-location-enabler';

export interface LocationObject {
    address: string;
    latitude: number;
    longitude: number;
}

export type LocationAccessResult =
    | 'granted'
    | 'denied'
    | 'never_ask_again'
    | 'service_disabled';

interface PositionFix {
    latitude: number;
    longitude: number;
}

try {
    // We handle permission requests ourselves so the native layer never
    // silently triggers a prompt before the app is ready to explain why.
    Geolocation.setRNConfiguration({
        skipPermissionRequests: true,
        locationProvider: 'auto',
    });
} catch {
    // Ignore configuration errors in test environments.
}

const FINE_PERMISSION = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
const COARSE_PERMISSION = PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;

const PERMISSION_DIALOG = {
    title: 'Location access',
    message: 'MyCircle uses your location to show nearby posts and to set a location when you create a post.',
    buttonNeutral: 'Ask me later',
    buttonNegative: 'Deny',
    buttonPositive: 'Allow',
};

export const isLocationPermissionGranted = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
        // iOS does not expose an authorization-status check in this library.
        // Callers treat this as "already asked" and rely on watchPosition errors.
        return true;
    }

    try {
        const fine = await PermissionsAndroid.check(FINE_PERMISSION);
        const coarse = await PermissionsAndroid.check(COARSE_PERMISSION);
        return fine || coarse;
    } catch {
        return false;
    }
};

export const isLocationServicesEnabled = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    try {
        return await LocationEnabler.isLocationEnabled();
    } catch {
        return true;
    }
};

export const promptEnableLocationServices = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    try {
        await LocationEnabler.promptForEnableLocationIfNeeded({
            interval: 10000,
            waitForAccurate: false,
        });
        return await LocationEnabler.isLocationEnabled();
    } catch {
        return false;
    }
};

/**
 * Requests the permission (only when needed) and makes sure device location
 * services are enabled. Returns a result instead of throwing so callers can
 * show an appropriate message or open Settings.
 */
export const requestLocationAccess = async (): Promise<LocationAccessResult> => {
    try {
        if (Platform.OS === 'ios') {
            await new Promise<void>((resolve, reject) => {
                Geolocation.requestAuthorization(resolve, () => reject(new Error('Location authorization denied')));
            });
        } else if (!(await isLocationPermissionGranted())) {
            const result = await PermissionsAndroid.request(FINE_PERMISSION, PERMISSION_DIALOG);

            // Preserve the platform's "don't ask again" answer so callers can
            // distinguish an ordinary denial from a permanently blocked app.
            if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
                return 'never_ask_again';
            }

            if (result !== PermissionsAndroid.RESULTS.GRANTED) {
                // Android 12+ can grant approximate location instead of precise.
                const hasCoarse = await PermissionsAndroid.check(COARSE_PERMISSION);
                if (!hasCoarse) return 'denied';
            }
        }

        if (!(await isLocationServicesEnabled())) {
            const enabled = await promptEnableLocationServices();
            if (!enabled) return 'service_disabled';
        }

        return 'granted';
    } catch (error) {
        console.warn('Location access request failed:', error);
        return 'denied';
    }
};

export const openLocationSettings = (): void => {
    Linking.openSettings().catch(() => {
        // Ignore when Settings cannot be opened (e.g. in tests).
    });
};

const getPosition = (enableHighAccuracy: boolean, timeout: number): Promise<PositionFix> => {
    return new Promise((resolve, reject) => {
        let settled = false;
        let safetyTimer: ReturnType<typeof setTimeout>;

        const finishResolve = (position: PositionFix) => {
            if (settled) return;
            settled = true;
            clearTimeout(safetyTimer);
            resolve(position);
        };

        const finishReject = (error: unknown) => {
            if (settled) return;
            settled = true;
            clearTimeout(safetyTimer);
            reject(error);
        };

        // The library timeout usually calls the error callback, but this guard
        // guarantees the promise settles even if a native implementation stalls.
        safetyTimer = setTimeout(() => {
            finishReject(new Error('Location request timed out'));
        }, timeout + 2000);

        Geolocation.getCurrentPosition(
            (position) => {
                finishResolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            finishReject,
            {
                enableHighAccuracy,
                timeout,
                maximumAge: enableHighAccuracy ? 10000 : 120000,
            }
        );
    });
};

const resolveAddress = async (latitude: number, longitude: number): Promise<string> => {
    const fallback = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
            {
                headers: { 'User-Agent': 'MyCircleApp/1.0' },
                signal: controller.signal,
            }
        );
        clearTimeout(timeoutId);

        const data = await response.json();
        if (data && data.address) {
            const suburb = data.address.suburb || data.address.neighbourhood || data.address.residential;
            const city = data.address.city || data.address.town || data.address.village || data.address.state_district;
            const state = data.address.state;

            const parts = [];
            if (suburb) parts.push(suburb);
            if (city) parts.push(city);
            if (state && state !== city) parts.push(state);

            if (parts.length > 0) return parts.join(', ');
        }
    } catch {
        // Fall back to coordinates.
    }

    return fallback;
};

interface GetCurrentLocationOptions {
    /** Skip the permission/service check when the caller already resolved it. */
    skipPermissionCheck?: boolean;
}

/**
 * Gets one device fix. Permission and device-services checks are included so
 * every caller (feed, post creation, map modal) behaves consistently. Callers
 * that just resolved access themselves can skip the duplicate check/prompt.
 */
export const getCurrentLocation = async (
    options: GetCurrentLocationOptions = {}
): Promise<LocationObject | null> => {
    if (!options.skipPermissionCheck) {
        const access = await requestLocationAccess();
        if (access !== 'granted') return null;
    }

    let fix: PositionFix | null = null;
    try {
        fix = await getPosition(true, 8000);
    } catch {
        try {
            fix = await getPosition(false, 10000);
        } catch {
            fix = null;
        }
    }

    if (!fix) return null;

    return {
        latitude: fix.latitude,
        longitude: fix.longitude,
        address: await resolveAddress(fix.latitude, fix.longitude),
    };
};

export const watchLocation = (
    onChange: (position: PositionFix) => void,
    onError?: (error: any) => void
): number => {
    return Geolocation.watchPosition(
        (position) => {
            onChange({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            });
        },
        onError,
        {
            enableHighAccuracy: true,
            distanceFilter: 10,
            interval: 10000,
            timeout: 10000,
            maximumAge: 10000,
        }
    );
};

export const clearLocationWatch = (watchId: number): void => {
    try {
        Geolocation.clearWatch(watchId);
    } catch {
        // Ignore cleanup errors.
    }
};
