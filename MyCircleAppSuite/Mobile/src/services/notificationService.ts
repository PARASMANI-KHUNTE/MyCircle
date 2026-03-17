import messaging, { AuthorizationStatus } from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import { Alert } from 'react-native';

const isFirebaseMessagingConfigured = () => {
    if (Platform.OS === 'ios') {
        return true;
    }

    // Android Firebase Messaging requires google-services.json at build time.
    return typeof messaging === 'function';
};

export const requestUserPermission = async () => {
    if (!isFirebaseMessagingConfigured()) {
        console.warn('Firebase messaging is not configured for this build.');
        return false;
    }

    if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Notification permission denied');
            return false;
        }
    }

    const authStatus = await messaging().requestPermission();
    const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

    if (enabled) {
        console.log('Authorization status:', authStatus);
        return true;
    }
    return false;
};

export const getFCMToken = async () => {
    if (!isFirebaseMessagingConfigured()) {
        return null;
    }

    try {
        const token = await messaging().getToken();
        console.log('FCM Token:', token);
        return token;
    } catch (error) {
        console.error('Failed to get FCM token:', error);
        return null;
    }
};

export const notificationListener = () => {
    if (!isFirebaseMessagingConfigured()) {
        return () => undefined;
    }

    // Assume a message-notification contains a "type" property in data payload of screen to open

    const unsubscribeOpened = messaging().onNotificationOpenedApp(remoteMessage => {
        console.log(
            'Notification caused app to open from background state:',
            remoteMessage.notification,
        );
        // Navigation logic could go here later
    });

    // Check whether an initial notification is available
    messaging().getInitialNotification().then(remoteMessage => {
        if (remoteMessage) {
            console.log(
                'Notification caused app to open from quit state:',
                remoteMessage.notification,
            );
        }
    });

    // Foreground messages
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
        Alert.alert(
            remoteMessage.notification?.title || 'New Notification',
            remoteMessage.notification?.body || ''
        );
    });

    return () => {
        unsubscribeOpened();
        unsubscribeForeground();
    };
};
const initialize = async () => {
    const hasPermission = await requestUserPermission();
    if (hasPermission) {
        notificationListener();
    }
};

export default {
    requestUserPermission,
    getFCMToken,
    notificationListener,
    initialize,
};
