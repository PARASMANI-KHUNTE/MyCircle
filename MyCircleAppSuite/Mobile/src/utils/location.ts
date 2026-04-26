import { PermissionsAndroid, Platform } from 'react-native';
import { Alert } from './alert';
import Geolocation from '@react-native-community/geolocation';

export interface LocationObject {
    address: string;
    latitude: number;
    longitude: number;
}

export const getCurrentLocation = async (): Promise<LocationObject | null> => {
    if (Platform.OS === 'android') {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: "Location Permission",
                    message: "MyCircle needs access to your location to tag your posts.",
                    buttonNeutral: "Ask Me Later",
                    buttonNegative: "Cancel",
                    buttonPositive: "OK"
                }
            );
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                Alert.alert('Permission Denied', 'Location permission is required to fetch your location.');
                return null;
            }
        } catch (err) {
            console.warn("Permission request failed:", err);
            return null;
        }
    }

    return new Promise((resolve) => {
        // Primary attempt - fast low accuracy
        const attemptLocation = (attempt: number = 1) => {
            const options = {
                enableHighAccuracy: false,
                timeout: 10000, // 10 seconds max
                maximumAge: 300000 // Allow cached location up to 5 minutes
            };

            Geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        let address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

                        // Quick geocoding attempt
                        try {
                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), 3000);
                            
                            const response = await fetch(
                                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
                                {
                                    headers: { 'User-Agent': 'MyCircleApp/1.0' },
                                    signal: controller.signal
                                }
                            );
                            clearTimeout(timeoutId);
                            
                            const data = await response.json();
                            if (data && data.address) {
                                const suburb = data.address.suburb || data.address.neighbourhood || data.address.residential;
                                const city = data.address.city || data.address.town || data.address.village || data.address.state_district;
                                const state = data.address.state;

                                let parts = [];
                                if (suburb) parts.push(suburb);
                                if (city) parts.push(city);
                                if (state && state !== city) parts.push(state);

                                address = parts.join(', ') || address;
                            }
                        } catch (error) {
                            console.log('Geocoding failed, using coordinates');
                        }

                        resolve({ address, latitude, longitude });
                    } catch (error) {
                        console.error('Location processing error:', error);
                        resolve({ address: "Current Location", latitude: position.coords.latitude, longitude: position.coords.longitude });
                    }
                },
                (error) => {
                    console.warn(`Location attempt ${attempt} failed:`, error.code, error.message);
                    
                    // Retry once with very relaxed settings
                    if (attempt === 1) {
                        console.log('Retrying location with relaxed settings...');
                        setTimeout(() => attemptLocation(2), 500);
                    } else {
                        // Silent fail - return null without alerts
                        console.log('Location failed after retries, returning null');
                        resolve(null);
                    }
                },
                options
            );
        };

        attemptLocation(1);
    });
};
