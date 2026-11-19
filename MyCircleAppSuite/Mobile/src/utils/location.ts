import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export interface LocationObject {
    address: string;
    latitude: number;
    longitude: number;
}

try {
    Geolocation.setRNConfiguration({
        skipPermissionRequests: false,
        locationProvider: 'auto',
    });
} catch {
    // Ignore configuration error in test environments
}

export const getCurrentLocation = async (): Promise<LocationObject | null> => {
    if (Platform.OS === 'android') {
        try {
            const hasFine = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
            const hasCoarse = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION);

            if (!hasFine && !hasCoarse) {
                const granted = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
                ]);

                const fineGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
                const coarseGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;

                if (!fineGranted && !coarseGranted) {
                    return null;
                }
            }
        } catch (err) {
            console.warn('Permission request failed:', err);
            return null;
        }
    }

    return new Promise((resolve) => {
        let settled = false;

        const finish = (result: LocationObject | null) => {
            if (!settled) {
                settled = true;
                resolve(result);
            }
        };

        const fetchPosition = (highAccuracy: boolean) => {
            Geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        let address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

                        try {
                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), 3000);

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

                                if (parts.length > 0) {
                                    address = parts.join(', ');
                                }
                            }
                        } catch {
                            // Fallback to coordinates string
                        }

                        finish({ address, latitude, longitude });
                    } catch {
                        finish({
                            address: 'Current Location',
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        });
                    }
                },
                (error) => {
                    console.warn(`Location attempt (highAccuracy=${highAccuracy}) failed:`, error?.code, error?.message);
                    if (highAccuracy) {
                        fetchPosition(false);
                    } else {
                        finish(null);
                    }
                },
                {
                    enableHighAccuracy: highAccuracy,
                    timeout: highAccuracy ? 8000 : 10000,
                    maximumAge: highAccuracy ? 10000 : 120000,
                }
            );
        };

        // Absolute safety timeout of 18 seconds so the promise never hangs
        setTimeout(() => {
            finish(null);
        }, 18000);

        fetchPosition(true);
    });
};
