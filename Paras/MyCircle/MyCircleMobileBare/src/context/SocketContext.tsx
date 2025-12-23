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

        // Foreground/Background Event Listener
        return notifee.onForegroundEvent(({ type, detail }) => {
            if (type === EventType.PRESS) {
                handleNotificationPress(detail.notification?.data);
            }
        });
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

        if (data.type === 'request_received' || data.type === 'request_approved' || data.type === 'request_rejected') {
            navigate('Requests');
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
                // Display a notification
                await notifee.displayNotification({
                    title: getNotificationTitle(data.type),
                    body: generateNotificationBody(data),
                    data: data, // Pass data for press handling
                    android: {
                        channelId: 'default',
                        pressAction: {
                            id: 'default',
                        },
                        // sound: 'default', // System default sound
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
            case 'request_received': return 'New Request';
            case 'request_approved': return 'Request Approved';
            case 'request_rejected': return 'Request Rejected';
            case 'like': return 'New Like';
            case 'comment': return 'New Comment';
            default: return 'New Notification';
        }
    };

    const generateNotificationBody = (data: any) => {
        if (data.type === 'request_received') return `${data.requesterName} sent you a request.`;
        if (data.type === 'request_approved') return `${data.recipientName} approved your request.`;
        if (data.type === 'like') return data.message || 'Someone liked your post.';
        if (data.type === 'comment') return data.message || 'Someone commented on your post.';
        return 'You have a new update.';
    };

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
        </SocketContext.Provider>
    );
};
