import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import notificationService from '../services/notificationService';
import { getNotificationRoute } from '../utils/notificationRouting';
import { usePagedList } from '../hooks/usePagedList';

interface Notification {
    _id: string;
    title: string;
    message: string;
    type: string;
    event?: string;
    link?: string;
    postId?: string;
    conversationId?: string;
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
    loadMore: () => Promise<void>;
    hasMore: boolean;
    loadingMore: boolean;
    loadMoreError: string | null;
    handleNotificationClick: (notification: Notification, navigation: any) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within NotificationProvider');
    return context;
};

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const {
        items: notifications,
        setItems: setNotifications,
        loading,
        loadingMore,
        error: loadMoreError,
        hasMore,
        refresh: refreshNotifications,
        loadMore,
    } = usePagedList<Notification>({
        endpoint: '/notifications',
        limit: 30,
        errorLabel: 'Failed to load notifications',
        getItemId: (notification) => String(notification._id),
    });
    const [unreadCount, setUnreadCount] = useState(0);
    const seenIdsRef = useRef<Set<string>>(new Set());
    const wasAuthenticatedRef = useRef(false);
    const { socket } = useSocket();
    const { isAuthenticated, isLoading } = useAuth();

    const fetchUnreadCount = useCallback(async () => {
        try {
            const res = await api.get('/notifications/unread-count');
            setUnreadCount(typeof res.data?.count === 'number' ? res.data.count : 0);
        } catch (err) {
            console.error('Failed to fetch unread notification count:', err);
        }
    }, []);

    const refresh = useCallback(async () => {
        await refreshNotifications();
        await fetchUnreadCount();
    }, [fetchUnreadCount, refreshNotifications]);

    const loadMoreNotifications = useCallback(async () => {
        await loadMore();
    }, [loadMore]);

    // Keep the socket dedupe set in sync with every page, not just page one.
    useEffect(() => {
        notifications.forEach((notification) => seenIdsRef.current.add(String(notification._id)));
    }, [notifications]);

    useEffect(() => {
        notificationService.initialize();
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            refresh();
        } else {
            seenIdsRef.current.clear();
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [isAuthenticated, refresh, setNotifications]);

    useEffect(() => {
        if (isLoading) return;

        if (isAuthenticated) {
            wasAuthenticatedRef.current = true;
            notificationService.registerDeviceToken();
        } else if (wasAuthenticatedRef.current) {
            wasAuthenticatedRef.current = false;
            notificationService.unregisterDeviceToken();
        }
    }, [isAuthenticated, isLoading]);

    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (notification: Notification) => {
            const id = notification?._id ? String(notification._id) : null;
            if (id && seenIdsRef.current.has(id)) return;
            if (id) seenIdsRef.current.add(id);

            setNotifications(prev => id
                ? [notification, ...prev.filter(n => String(n._id) !== id)]
                : [notification, ...prev]);
            // The server count is authoritative even if this event raced a reconnect refetch.
            fetchUnreadCount();
        };

        const handleConnect = () => {
            // Reconnect catch-up: socket events can be missed while offline.
            refresh();
        };

        socket.on('new_notification', handleNewNotification);
        socket.on('connect', handleConnect);

        return () => {
            socket.off('new_notification', handleNewNotification);
            socket.off('connect', handleConnect);
        };
    }, [socket, refresh, fetchUnreadCount, setNotifications]);

    const markAsRead = async (id: string) => {
        try {
            await api.put(`/notifications/${id}/read`);
            const wasUnread = notifications.some(n => n._id === id && !n.read);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            if (wasUnread) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
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
        const route = getNotificationRoute(notification);
        if (!route) return;

        if (!notification.read) {
            markAsRead(notification._id);
        }

        navigation.navigate(route.name, route.params);
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            markAsRead,
            markAllRead,
            refresh,
            loadMore: loadMoreNotifications,
            hasMore,
            loadingMore,
            loadMoreError,
            handleNotificationClick
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
