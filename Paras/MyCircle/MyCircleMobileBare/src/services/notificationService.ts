import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import Sound from 'react-native-sound';

class NotificationService {
    private notificationSound: Sound | null = null;

    async initialize() {
        // Create notification channel for Android
        await notifee.createChannel({
            id: 'mycircle_channel_v1',
            name: 'MyCircle Notifications',
            importance: AndroidImportance.HIGH,
            sound: 'default',
            vibration: true,
            vibrationPattern: [300, 500],
        });

        await notifee.createChannel({
            id: 'mycircle_requests_v1',
            name: 'Contact Requests',
            importance: AndroidImportance.HIGH,
            sound: 'default',
            vibration: true,
            vibrationPattern: [300, 500],
        });

        // Load notification sound
        this.notificationSound = new Sound('notification.mp3', Sound.MAIN_BUNDLE, (error) => {
            if (error) {
                console.log('Failed to load notification sound', error);
            }
        });

        // Handle notification interactions
        notifee.onForegroundEvent(({ type, detail }) => {
            if (type === EventType.PRESS) {
                console.log('Notification pressed:', detail.notification);
            }
        });
    }

    async showNotification(title: string, body: string, type: string = 'default', data?: any) {
        // Play sound
        if (this.notificationSound) {
            this.notificationSound.play();
        }

        // Determine channel based on type
        const channelId = type === 'request' ? 'mycircle_requests_v1' : 'mycircle_channel_v1';

        // Convert data to string values (notifee requirement)
        const notificationData: Record<string, string> = {};
        if (data) {
            Object.keys(data).forEach(key => {
                notificationData[key] = String(data[key]);
            });
        }

        // Display notification
        await notifee.displayNotification({
            title,
            body,
            android: {
                channelId,
                importance: AndroidImportance.HIGH,
                sound: 'default',
                vibrationPattern: [300, 500], // Must be even number of values
                pressAction: {
                    id: 'default',
                },
                smallIcon: 'ic_launcher',
                color: '#8b5cf6',
            },
            data: notificationData,
        });
    }

    async showRequestNotification(senderName: string, postTitle: string, requestId: string) {
        await this.showNotification(
            '🔔 New Contact Request',
            `${senderName} wants to connect about "${postTitle}"`,
            'request',
            { type: 'request', requestId }
        );
    }

    async showMessageNotification(senderName: string, message: string, conversationId: string) {
        await this.showNotification(
            `💬 ${senderName}`,
            message,
            'message',
            { type: 'message', conversationId }
        );
    }

    async cancelAll() {
        await notifee.cancelAllNotifications();
    }
}

export default new NotificationService();
