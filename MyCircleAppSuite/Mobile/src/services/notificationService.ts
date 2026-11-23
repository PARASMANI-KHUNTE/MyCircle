import notifee, { AndroidImportance } from '@notifee/react-native';
import {
    getMessaging,
    requestPermission,
    getToken,
    onMessage,
    onNotificationOpenedApp,
    getInitialNotification,
    setBackgroundMessageHandler,
    AuthorizationStatus,
    type RemoteMessage,
} from '@react-native-firebase/messaging';
import { getApp, getApps } from '@react-native-firebase/app';
import { PermissionsAndroid, Platform } from 'react-native';
import api from './api';
import { navigate } from './navigationService';
import {
    getNotificationRoute,
    getNotificationTitle,
    type NotificationPayload,
} from '../utils/notificationRouting';
import { claimForegroundDisplay, claimNotificationOpen } from '../utils/notificationDedupe';

export const NOTIFICATION_CHANNEL_ID = 'mycircle_channel_v1';

type NotificationData = Record<string, string>;

let listenerUnsubscribe: (() => void) | null = null;
let backgroundHandlerRegistered = false;
let registeredDeviceToken: string | null = null;
let pendingDeviceToken: string | null = null;
let deviceTokenPromise: Promise<boolean> | null = null;
let initialNotificationChecked = false;

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

const normalizeData = (data?: Record<string, any> | null): NotificationData => {
    const normalized: NotificationData = {};
    if (!data) return normalized;

    Object.entries(data).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        normalized[key] = typeof value === 'string' ? value : String(value);
    });
    return normalized;
};

const displayLocalNotification = async ({ title, body, data }: {
    title: string;
    body: string;
    data: NotificationData;
}) => {
    await notifee.createChannel({
        id: NOTIFICATION_CHANNEL_ID,
        name: 'MyCircle Notifications',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
        vibrationPattern: [300, 500],
    });

    await notifee.displayNotification({
        title,
        body,
        data,
        android: {
            channelId: NOTIFICATION_CHANNEL_ID,
            importance: AndroidImportance.HIGH,
            sound: 'default',
            vibrationPattern: [300, 500],
            pressAction: {
                id: 'default',
            },
            smallIcon: 'ic_launcher',
        },
        ios: {
            sound: 'default',
            foregroundPresentationOptions: {
                badge: true,
                sound: true,
                banner: true,
                list: true,
            },
        },
    });
};

const handleOpenedNotification = (remoteMessage?: RemoteMessage | null) => {
    if (!remoteMessage) return;

    const data = normalizeData(remoteMessage.data);
    if (!claimNotificationOpen(data._id)) return;

    const route = getNotificationRoute(data as NotificationPayload);
    if (route) {
        navigate(route.name, route.params);
    }
};

/** Shared foreground presenter so FCM and socket events cannot both alert. */
export const presentForegroundNotification = async ({ title, body, data }: {
    title: string;
    body: string;
    data: NotificationData;
}): Promise<boolean> => {
    if (!claimForegroundDisplay({ ...data, title, message: body })) {
        return false;
    }
    await displayLocalNotification({ title, body, data });
    return true;
};

const registerBackgroundHandler = (messaging: ReturnType<typeof getMessaging> | null) => {
    if (!messaging || backgroundHandlerRegistered) return;

    setBackgroundMessageHandler(messaging, async (remoteMessage: RemoteMessage) => {
        const data = normalizeData(remoteMessage.data);
        const payload = {
            ...data,
            title: remoteMessage.notification?.title || data.title,
        } as NotificationPayload;

        await presentForegroundNotification({
            title: getNotificationTitle(payload),
            body: remoteMessage.notification?.body || data.message || '',
            data,
        });
    });
    backgroundHandlerRegistered = true;
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

export const registerDeviceToken = async (): Promise<boolean> => {
    const hasPermission = await requestUserPermission();
    if (!hasPermission) return false;

    const token = await getFCMToken();
    if (!token) return false;
    if (registeredDeviceToken === token) return true;
    if (deviceTokenPromise && pendingDeviceToken === token) return deviceTokenPromise;

    pendingDeviceToken = token;
    deviceTokenPromise = (async () => {
        try {
            await api.post('/notifications/device-token', { token, platform: Platform.OS });
            registeredDeviceToken = token;
            return true;
        } catch (error) {
            console.error('Failed to register device token:', error);
            return false;
        } finally {
            deviceTokenPromise = null;
            pendingDeviceToken = null;
        }
    })();

    return deviceTokenPromise;
};

export const unregisterDeviceToken = async (): Promise<void> => {
    const token = registeredDeviceToken || await getFCMToken();
    registeredDeviceToken = null;
    pendingDeviceToken = null;
    deviceTokenPromise = null;

    if (!token) return;

    try {
        // Always scope the delete to this device so logging out on one phone
        // never clears tokens belonging to the user's other devices.
        await api.delete('/notifications/device-token', { data: { token } });
    } catch (error) {
        console.error('Failed to unregister device token:', error);
    }
};

export const notificationListener = () => {
    const messaging = getMessagingInstance();
    if (!messaging) {
        return () => undefined;
    }

    registerBackgroundHandler(messaging);
    if (listenerUnsubscribe) return listenerUnsubscribe;

    const unsubscribeOpened = onNotificationOpenedApp(messaging, handleOpenedNotification);

    if (!initialNotificationChecked) {
        initialNotificationChecked = true;
        getInitialNotification(messaging)
            .then(handleOpenedNotification)
            .catch(error => console.error('Failed to check initial notification:', error));
    }

    const unsubscribeForeground = onMessage(messaging, async (remoteMessage: RemoteMessage) => {
        try {
            const data = normalizeData(remoteMessage.data);
            const payload = {
                ...data,
                title: remoteMessage.notification?.title || data.title,
            } as NotificationPayload;

            await presentForegroundNotification({
                title: getNotificationTitle(payload),
                body: remoteMessage.notification?.body || data.message || '',
                data,
            });
        } catch (error) {
            console.error('Failed to display foreground notification:', error);
        }
    });

    listenerUnsubscribe = () => {
        unsubscribeOpened();
        unsubscribeForeground();
        listenerUnsubscribe = null;
    };
    return listenerUnsubscribe;
};

const initialize = async () => {
    registerBackgroundHandler(getMessagingInstance());
    const hasPermission = await requestUserPermission();
    if (hasPermission) {
        notificationListener();
    }
};

export default {
    NOTIFICATION_CHANNEL_ID,
    isFirebaseMessagingConfigured,
    requestUserPermission,
    getFCMToken,
    registerDeviceToken,
    unregisterDeviceToken,
    notificationListener,
    initialize,
};
