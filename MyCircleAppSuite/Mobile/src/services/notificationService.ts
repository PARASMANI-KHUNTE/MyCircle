import {
    getMessaging,
    requestPermission,
    getToken,
    onMessage,
    onNotificationOpenedApp,
    getInitialNotification,
    AuthorizationStatus,
    type RemoteMessage,
} from '@react-native-firebase/messaging';
import { getApp, getApps } from '@react-native-firebase/app';
import { PermissionsAndroid, Platform } from 'react-native';
import { Alert } from '../utils/alert';

const getMessagingInstance = () => {
    try {
        if (getApps().length === 0) {
            return null;
        }
        return getMessaging(getApp());
    } catch {
        return null;
    }
};

export const isFirebaseMessagingConfigured = () => {
    return !!getMessagingInstance();
};

export const requestUserPermission = async () => {
    const messaging = getMessagingInstance();
    if (!messaging) {
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

    const authStatus = await requestPermission(messaging);
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
    const messaging = getMessagingInstance();
    if (!messaging) {
        return null;
    }

    try {
        const token = await getToken(messaging);
        console.log('FCM Token:', token);
        return token;
    } catch (error) {
        console.error('Failed to get FCM token:', error);
        return null;
    }
};

export const notificationListener = () => {
    const messaging = getMessagingInstance();
    if (!messaging) {
        return () => undefined;
    }

    // Assume a message-notification contains a "type" property in data payload of screen to open
    const unsubscribeOpened = onNotificationOpenedApp(messaging, (remoteMessage: RemoteMessage) => {
        console.log(
            'Notification caused app to open from background state:',
            remoteMessage.notification,
        );
        // Navigation logic could go here later
    });

    // Check whether an initial notification is available
    getInitialNotification(messaging).then((remoteMessage: RemoteMessage | null) => {
        if (remoteMessage) {
            console.log(
                'Notification caused app to open from quit state:',
                remoteMessage.notification,
            );
        }
    });

    // Foreground messages
    const unsubscribeForeground = onMessage(messaging, async (remoteMessage: RemoteMessage) => {
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
    isFirebaseMessagingConfigured,
    requestUserPermission,
    getFCMToken,
    notificationListener,
    initialize,
};
