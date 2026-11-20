import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    clearLocationWatch,
    getCurrentLocation,
    isLocationPermissionGranted,
    openLocationSettings,
    requestLocationAccess,
    watchLocation,
    LocationAccessResult,
} from '../utils/location';

const LOCATION_ASKED_KEY = '@mycircle:location_permission_asked_v1';

export interface DeviceCoordinates {
    lat: number;
    lng: number;
}

interface LocationContextValue {
    location: DeviceCoordinates | null;
    permissionStatus: LocationAccessResult | 'unknown';
    isRequesting: boolean;
    isTracking: boolean;
    error: string | null;
    requestLocation: () => Promise<DeviceCoordinates | null>;
    startTracking: () => Promise<void>;
    stopTracking: () => void;
    openSettings: () => void;
}

const ERROR_MESSAGES: Record<LocationAccessResult, string> = {
    granted: '',
    denied: 'Location permission is required for nearby posts and maps.',
    never_ask_again: 'Location access is blocked. Enable it in your device settings.',
    service_disabled: 'Device location services are turned off.',
};

const LocationContext = createContext<LocationContextValue | null>(null);

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
    const [location, setLocation] = useState<DeviceCoordinates | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<LocationAccessResult | 'unknown'>('unknown');
    const [isRequesting, setIsRequesting] = useState(false);
    const [isTracking, setIsTracking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const watchIdRef = useRef<number | null>(null);
    const statusRef = useRef<LocationAccessResult | 'unknown'>('unknown');
    const askedRef = useRef(false);

    const updateStatus = useCallback((status: LocationAccessResult | 'unknown') => {
        statusRef.current = status;
        setPermissionStatus(status);
    }, []);

    const beginWatching = useCallback(() => {
        if (watchIdRef.current !== null) return;

        watchIdRef.current = watchLocation(
            (position) => {
                setLocation({ lat: position.latitude, lng: position.longitude });
                setError(null);
            },
            (watchError) => {
                if (watchError?.code === 1) {
                    updateStatus('denied');
                    setError(ERROR_MESSAGES.denied);
                } else {
                    setError('Location updates are unavailable right now.');
                }
            }
        );
        setIsTracking(true);
    }, [updateStatus]);

    const stopTracking = useCallback(() => {
        if (watchIdRef.current !== null) {
            clearLocationWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setIsTracking(false);
    }, []);

    const ensureAccess = useCallback(async (): Promise<LocationAccessResult> => {
        if (statusRef.current === 'granted') return 'granted';

        const result = await requestLocationAccess();
        const mapped: LocationAccessResult =
            result === 'denied' && askedRef.current ? 'never_ask_again' : result;

        updateStatus(mapped);
        setError(mapped === 'granted' ? null : ERROR_MESSAGES[mapped]);
        return mapped;
    }, [updateStatus]);

    const startTracking = useCallback(async () => {
        const access = await ensureAccess();
        if (access === 'granted') beginWatching();
    }, [beginWatching, ensureAccess]);

    const requestLocation = useCallback(async (): Promise<DeviceCoordinates | null> => {
        setIsRequesting(true);
        try {
            const access = await ensureAccess();
            if (access !== 'granted') return null;

            beginWatching();

            const fix = await getCurrentLocation();
            if (!fix) return null;

            const coords = { lat: fix.latitude, lng: fix.longitude };
            setLocation(coords);
            setError(null);
            return coords;
        } finally {
            setIsRequesting(false);
        }
    }, [beginWatching, ensureAccess]);

    const openSettings = useCallback(() => {
        openLocationSettings();
    }, []);

    // Ask once on app launch, then silently reuse the granted permission on
    // later launches. The "asked once" flag prevents prompt loops.
    useEffect(() => {
        let cancelled = false;

        const bootstrap = async () => {
            try {
                const stored = await AsyncStorage.getItem(LOCATION_ASKED_KEY);
                askedRef.current = stored === 'true';

                if (!askedRef.current) {
                    await AsyncStorage.setItem(LOCATION_ASKED_KEY, 'true');
                    askedRef.current = true;
                    if (!cancelled) await startTracking();
                    return;
                }

                if (await isLocationPermissionGranted()) {
                    updateStatus('granted');
                    if (!cancelled) beginWatching();
                }
            } catch (bootstrapError) {
                console.warn('Location bootstrap failed:', bootstrapError);
            }
        };

        bootstrap();

        return () => {
            cancelled = true;
        };
    }, [beginWatching, startTracking, updateStatus]);

    // Resume tracking when the app comes back to the foreground if it was
    // stopped by the OS or the user changed settings while away.
    useEffect(() => {
        const subscription = AppState.addEventListener('change', async (nextState) => {
            if (nextState !== 'active') return;

            if (statusRef.current === 'granted' && watchIdRef.current === null) {
                beginWatching();
                return;
            }

            // The user may have enabled location from device Settings while
            // the app was in the background.
            if (statusRef.current !== 'granted' && await isLocationPermissionGranted()) {
                updateStatus('granted');
                setError(null);
                beginWatching();
            }
        });

        return () => subscription.remove();
    }, [beginWatching, updateStatus]);

    useEffect(() => {
        return () => {
            if (watchIdRef.current !== null) {
                clearLocationWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        };
    }, []);

    return (
        <LocationContext.Provider
            value={{
                location,
                permissionStatus,
                isRequesting,
                isTracking,
                error,
                requestLocation,
                startTracking,
                stopTracking,
                openSettings,
            }}
        >
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = (): LocationContextValue => {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
};
