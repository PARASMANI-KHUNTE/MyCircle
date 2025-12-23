import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { useToast } from '../components/ui/Toast';
import notificationService from '../services/notificationService';

interface Notification {
    _id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    relatedId?: string;
    createdAt: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    markAsRead: (id: string) => Promise<void>;
    markAllRead: () => Promise<void>;
    refresh: () => Promise<void>;
    handleNotificationClick: (notification: Notification, navigation: any) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within NotificationProvider');
    return context;
};

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket();
    const { isAuthenticated } = useAuth();
    const { info } = useToast();

    useEffect(() => {
        // Initialize notification service
        notificationService.initialize();
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = async (notification: Notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Show toast
            info(notification.title || notification.message);

            // Show push notification with sound
            if (notification.type === 'request') {
                await notificationService.showRequestNotification(
                    notification.title,
                    notification.message,
                    notification.relatedId || ''
                );
            } else if (notification.type === 'message') {
                await notificationService.showMessageNotification(
                    notification.title,
                    notification.message,
                    notification.relatedId || ''
                );
            } else {
                await notificationService.showNotification(
                    notification.title,
                    notification.message,
                    notification.type,
                    { relatedId: notification.relatedId }
                );
            }
        };

        socket.on('new_notification', handleNewNotification);

        return () => {
            socket.off('new_notification', handleNewNotification);
        };
    }, [socket]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
            setUnreadCount(res.data.filter((n: any) => !n.read).length);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error(err);
        }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
        }
    };

    const handleNotificationClick = (notification: Notification, navigation: any) => {
        if (!notification.read) {
            markAsRead(notification._id);
        }

        if (notification.relatedId) {
            if (notification.type === 'like' || notification.type === 'comment' || notification.type === 'reply') {
                navigation.navigate('PostDetails', { id: notification.relatedId });
            } else if (notification.type === 'message') {
                // Navigate to the specific chat window with the conversation ID
                navigation.navigate('ChatWindow', { id: notification.relatedId });
            } else if (notification.type === 'request') {
                navigation.navigate('Requests');
            }
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            markAsRead,
            markAllRead,
            refresh: fetchNotifications,
            handleNotificationClick
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
