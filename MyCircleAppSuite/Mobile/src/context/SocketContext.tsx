import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { useAuth } from './AuthContext';
import { BASE_URL } from '../services/api';
import { navigate } from '../services/navigationService';

const getSocketUrl = () => {
    if (!BASE_URL) {
        throw new Error('BASE_URL is not configured. Check DEV_API_URL/API_URL in mobile env.');
    }
    return BASE_URL.replace(/\/api\/?$/, '');
};

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
    const { user, token } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    const handleNotificationPress = useCallback((data: any) => {
        if (!data) return;

        console.log("Notification Pressed:", data);
        const postId = data.postId || data.relatedId;

        if (data.type === 'request' || data.type === 'info' || data.type === 'request_received') {
            navigate('Requests');
        } else if (data.type === 'approval' || data.type === 'request_approved') {
            if (data.conversationId) {
                navigate('ChatWindow', { id: data.conversationId });
            } else {
                navigate('Requests');
            }
        } else if (data.type === 'message') {
            if (data.conversationId) {
                navigate('ChatWindow', { id: data.conversationId });
            } else {
                navigate('ChatList');
            }
        } else if (data.type === 'comment' || data.type === 'like') {
            if (postId) {
                navigate('PostDetails', { id: postId });
            }
        }
    }, []);

    const getNotificationTitle = useCallback((type: string) => {
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
    }, []);

    const generateNotificationBody = useCallback((data: any) => {
        if (data.type === 'request' || data.type === 'request_received') return data.message || 'Someone sent you a request.';
        if (data.type === 'approval' || data.type === 'request_approved') return data.message || 'Your request was approved.';
        if (data.type === 'like') return data.message || 'Someone liked your post.';
        if (data.type === 'comment') return data.message || 'Someone commented on your post.';
        return data.message || 'You have a new update.';
    }, []);

    useEffect(() => {
        async function setupNotifications() {
            try {
                await notifee.requestPermission();
                await notifee.createChannel({
                    id: 'default',
                    name: 'Default Channel',
                    importance: AndroidImportance.HIGH,
                    sound: 'default',
                });
            } catch (error) {
                console.error('Failed to setup notifications:', error);
            }
        }
        setupNotifications();

        const unsubscribeForeground = notifee.onForegroundEvent(({ type, detail }) => {
            if (type === EventType.PRESS) {
                handleNotificationPress(detail.notification?.data);
            }
        });

        notifee.onBackgroundEvent(async ({ type, detail }) => {
            if (type === EventType.PRESS) {
                handleNotificationPress(detail.notification?.data);
            }
        });

        return unsubscribeForeground;
    }, [handleNotificationPress]);

    useEffect(() => {
        async function checkInitialNotification() {
            try {
                const initialNotification = await notifee.getInitialNotification();
                if (initialNotification) {
                    handleNotificationPress(initialNotification.notification.data);
                }
            } catch (error) {
                console.error('Failed to check initial notification:', error);
            }
        }
        checkInitialNotification();
    }, [handleNotificationPress, user]);

    useEffect(() => {
        if (!user?.id || !token) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
                setConnected(false);
            }
            return;
        }

        const socketUrl = getSocketUrl();
        console.log('Connecting to socket at:', socketUrl);
        
        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        const newSocket = io(socketUrl, {
            transports: ['websocket'],
            forceNew: true,
            auth: {
                token
            }
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Socket connected mobile:', newSocket.id);
            setConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected mobile');
            setConnected(false);
        });

        newSocket.on('connect_error', (err) => {
            console.log('Socket connection error mobile:', err.message);
            setConnected(false);
        });

        newSocket.on('new_notification', async (data: any) => {
            try {
                const channelId = await notifee.createChannel({
                    id: 'mycircle_channel_v1',
                    name: 'MyCircle Notifications',
                    importance: AndroidImportance.HIGH,
                    sound: 'default',
                    vibration: true,
                    vibrationPattern: [300, 500],
                });

                const notifeeData: any = {
                    type: String(data.type || ''),
                };
                if (data.postId || data.relatedId) notifeeData.postId = String(data.postId || data.relatedId);
                if (data.conversationId) notifeeData.conversationId = String(data.conversationId);
                if (data.relatedId) notifeeData.relatedId = String(data.relatedId);
                if (data.link) notifeeData.link = String(data.link);

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
            } catch (err) {
                console.error('Notification error:', err);
            }
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [user?.id, token, getNotificationTitle, generateNotificationBody, handleNotificationPress]);

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketProvider;
