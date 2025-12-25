import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { useAuth } from './AuthContext';
import { BASE_URL } from '../services/api';
import { Platform } from 'react-native';
import { navigate } from '../services/navigationService';

// Derive socket URL from BASE_URL (strip /api)
const SOCKET_URL = BASE_URL.replace('/api', '');

interface SocketContextType {
    socket: Socket | null;
    connected: boolean;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) throw new Error('useSocket must be used within SocketProvider');
    return context;
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);


    useEffect(() => {
        async function setupNotifications() {
            await notifee.requestPermission();

            // Create a channel (required for Android)
            await notifee.createChannel({
                id: 'default',
                name: 'Default Channel',
                importance: AndroidImportance.HIGH,
                sound: 'default',
            });
        }
        setupNotifications();

        // Foreground Event Listener
        const unsubscribeForeground = notifee.onForegroundEvent(({ type, detail }) => {
            if (type === EventType.PRESS) {
                handleNotificationPress(detail.notification?.data);
            }
        });

        // Background Event Listener (must be at module level for full support, but this helps)
        notifee.onBackgroundEvent(async ({ type, detail }) => {
            if (type === EventType.PRESS) {
                handleNotificationPress(detail.notification?.data);
            }
        });

        return unsubscribeForeground;
    }, []);

    // Check for initial notification (App opened from quit state)
    useEffect(() => {
        async function checkInitialNotification() {
            const initialNotification = await notifee.getInitialNotification();
            if (initialNotification) {
                handleNotificationPress(initialNotification.notification.data);
            }
        }
        checkInitialNotification();
    }, []);

    const handleNotificationPress = (data: any) => {
        if (!data) return;

        console.log("Notification Pressed:", data);

        if (data.type === 'request' || data.type === 'info' || data.type === 'request_received') {
            navigate('Requests');
        } else if (data.type === 'approval' || data.type === 'request_approved') {
            if (data.conversationId) {
                navigate('ChatWindow', { id: data.conversationId });
            } else {
                navigate('Requests');
            }
        } else if (data.type === 'message') {
            // For messages, we need conversation ID. 
            // If data contains conversationId, navigate to ChatWindow
            if (data.conversationId) {
                navigate('ChatWindow', { id: data.conversationId });
            } else {
                navigate('ChatList');
            }
        } else if (data.type === 'comment' || data.type === 'like') {
            if (data.postId) {
                navigate('PostDetails', { id: data.postId });
            }
        }
    };

    useEffect(() => {
        if (!user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setConnected(false);
            }
            return;
        }

        console.log('Connecting to socket at:', SOCKET_URL);
        const newSocket = io(SOCKET_URL, {
            transports: ['websocket'],
            forceNew: true,
        });

        newSocket.on('connect', () => {
            console.log('Socket connected mobile:', newSocket.id);
            setConnected(true);
            newSocket.emit('join', user._id || user.id);
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected mobile');
            setConnected(false);
        });

        newSocket.on('connect_error', (err) => {
            console.log('Socket connection error mobile:', err.message);
        });

        // Listen for new notifications
        newSocket.on('new_notification', async (data: any) => {
            try {
                // Ensure channel exists (use new ID to escape immutable bad config)
                const channelId = await notifee.createChannel({
                    id: 'mycircle_channel_v1',
                    name: 'MyCircle Notifications',
                    importance: AndroidImportance.HIGH,
                    sound: 'default',
                    vibration: true,
                    vibrationPattern: [300, 500],
                });

                // Sanitize data for Notifee (must be flat object with strings)
                const notifeeData: any = {
                    type: String(data.type || ''),
                };
                if (data.postId) notifeeData.postId = String(data.postId);
                if (data.conversationId) notifeeData.conversationId = String(data.conversationId);
                if (data.relatedId) notifeeData.relatedId = String(data.relatedId);
                if (data.link) notifeeData.link = String(data.link);

                // Display a notification
                await notifee.displayNotification({
                    title: data.title || getNotificationTitle(data.type),
                    body: data.message || generateNotificationBody(data),
                    data: notifeeData,
                    android: {
                        channelId,
                        pressAction: {
                            id: 'default',
                        },
                        vibrationPattern: [300, 500],
                        smallIcon: 'ic_launcher', // Uses the app launcher icon
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
            } catch (err) {
                console.error('Notification error:', err);
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user]);

    const getNotificationTitle = (type: string) => {
        switch (type) {
            case 'request': return 'New Request';
            case 'approval': return 'Request Approved';
            case 'info': return 'Update';
            case 'request_received': return 'New Request';
            case 'request_approved': return 'Request Approved';
            case 'request_rejected': return 'Request Rejected';
            case 'like': return 'New Like';
            case 'comment': return 'New Comment';
            default: return 'New Notification';
        }
    };

    const generateNotificationBody = (data: any) => {
        if (data.type === 'request' || data.type === 'request_received') return data.message || 'Someone sent you a request.';
        if (data.type === 'approval' || data.type === 'request_approved') return data.message || 'Your request was approved.';
        if (data.type === 'like') return data.message || 'Someone liked your post.';
        if (data.type === 'comment') return data.message || 'Someone commented on your post.';
        return data.message || 'You have a new update.';
    };

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
        </SocketContext.Provider>
    );
};
