import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { useToast } from '../components/ui/Toast';
import { getNotificationCopy, getToastMessageFromNotification } from '../utils/notificationMessage';

const noopAsync = async () => {};
const noop = () => {};

const defaultNotificationContext = {
    notifications: [],
    unreadCount: 0,
    loading: false,
    markAsRead: noopAsync,
    markAllRead: noopAsync,
    clearAll: noopAsync,
    refresh: noopAsync,
    handleNotificationClick: noop,
};

const NotificationContext = createContext(defaultNotificationContext);

export const useNotifications = () => useContext(NotificationContext) || defaultNotificationContext;

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/notifications');
            const notificationList = Array.isArray(res.data)
                ? res.data
                : Array.isArray(res.data?.notifications)
                    ? res.data.notifications
                    : [];
            const normalizedNotifications = notificationList.map((notification) => {
                const copy = getNotificationCopy(notification);
                return {
                    ...notification,
                    title: copy.title,
                    message: copy.message,
                };
            });

            setNotifications(normalizedNotifications);
            setUnreadCount(normalizedNotifications.filter((n) => !n?.read).length);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const playNotificationSound = useCallback(() => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch {
            // Audio may be unavailable or blocked
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            void fetchNotifications();
        } else {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
        }
    }, [fetchNotifications, isAuthenticated]);

    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (notification) => {
            const copy = getNotificationCopy(notification);
            const normalizedNotification = {
                ...notification,
                title: copy.title,
                message: copy.message,
            };

            setNotifications((prev) => {
                const existing = prev.find((item) => item._id === normalizedNotification._id);
                const filtered = prev.filter((item) => item._id !== normalizedNotification._id);
                if (!normalizedNotification.read && (!existing || existing.read)) {
                    setUnreadCount((count) => count + 1);
                }
                return [normalizedNotification, ...filtered];
            });

            // Play notification sound
            playNotificationSound();

            // Show toast with specific type
            const toastType = ['message', 'like', 'request'].includes(notification.type) ? notification.type : 'info';
            toast(getToastMessageFromNotification(normalizedNotification), toastType);
        };

        socket.on('new_notification', handleNewNotification);

        return () => {
            socket.off('new_notification', handleNewNotification);
        };
    }, [playNotificationSound, socket, toast]);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            const wasUnread = notifications.some((n) => n._id === id && !n.read);
            setNotifications(prev => prev.map((n) => {
                if (n._id !== id) return n;
                return { ...n, read: true };
            }));
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

    const clearAll = async () => {
        try {
            await api.delete('/notifications/delete-all');
            setNotifications([]);
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
        }
    };

    const handleNotificationClick = (notification) => {
        // Mark as read
        if (!notification.read) {
            markAsRead(notification._id);
        }

        // Navigate based on notification type
        if (notification.type === 'approval' && notification.conversationId) {
            navigate(`/chat?conversationId=${notification.conversationId}`);
            return;
        }

        if (notification.type === 'message') {
            navigate(notification.conversationId ? `/chat?conversationId=${notification.conversationId}` : '/chat');
            return;
        }

        if (notification.relatedId) {
            if (notification.type === 'like') {
                navigate(`/post/${notification.relatedId}`);
            } else if (notification.type === 'comment' || notification.type === 'reply') {
                navigate(`/post/${notification.relatedId}#comments`);
            } else if (notification.type === 'request' || notification.type === 'approval' || notification.type === 'info') {
                navigate('/requests');
            }
            return;
        }

        if (notification.link) {
            navigate(notification.link);
        }
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                loading,
                markAsRead,
                markAllRead,
                clearAll,
                refresh: fetchNotifications,
                handleNotificationClick,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};
