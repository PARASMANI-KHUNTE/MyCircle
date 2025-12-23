import { PermissionsAndroid, Platform, Alert } from 'react-native';
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

    return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                let address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
                        {
                            headers: {
                                'User-Agent': 'MyCircleApp/1.0'
                            }
                        }
                    );
                    const data = await response.json();

                    if (data && data.address) {
                        const suburb = data.address.suburb || data.address.neighbourhood || data.address.residential;
                        const city = data.address.city || data.address.town || data.address.village || data.address.state_district;
                        const state = data.address.state;

                        let parts = [];
                        if (suburb) parts.push(suburb);
                        if (city) parts.push(city);
                        if (state && state !== city) parts.push(state);

                        // "Mangla, Bilaspur, CG" format logic
                        address = parts.join(', ');
                    }
                } catch (error) {
                    console.error('Reverse geocoding error:', error);
                }

                resolve({ address, latitude, longitude });
            },
            (error) => {
                console.error('Location error:', error);
                if (error.code === 2) {
                    Alert.alert('Location Services Disabled', 'Please turn on GPS/Location services on your device.');
                } else {
                    Alert.alert('Error', 'Failed to get current location.');
                }
                resolve(null);
            },
            { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
        );
    });
};
