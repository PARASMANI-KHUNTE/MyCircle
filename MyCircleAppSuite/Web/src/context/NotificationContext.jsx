import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { useToast } from '../components/ui/Toast';
import { getNotificationCopy, getToastMessageFromNotification } from '../utils/notificationMessage';
import { getNotificationDestination, mergeNotification } from '../utils/notificationRouting';

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
    const notificationsRef = useRef([]);
    const { socket } = useSocket();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const applyNotifications = useCallback((next) => {
        const resolved = typeof next === 'function' ? next(notificationsRef.current) : next;
        notificationsRef.current = resolved;
        setNotifications(resolved);
    }, []);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const res = await api.get('/notifications/unread-count');
            const count = Number(res.data?.count);
            if (Number.isFinite(count)) {
                setUnreadCount(Math.max(0, count));
            }
        } catch (err) {
            console.error('Failed to fetch unread notification count:', err);
        }
    }, []);

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

            applyNotifications(normalizedNotifications);
            // The server count is authoritative (the list may be paginated).
            await fetchUnreadCount();
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    }, [applyNotifications, fetchUnreadCount]);

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
            applyNotifications([]);
            setUnreadCount(0);
            setLoading(false);
        }
    }, [applyNotifications, fetchNotifications, fetchUnreadCount, isAuthenticated]);

    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (notification) => {
            const copy = getNotificationCopy(notification);
            const normalizedNotification = {
                ...notification,
                title: copy.title,
                message: copy.message,
            };

            const { notifications: nextNotifications } = mergeNotification(
                notificationsRef.current,
                normalizedNotification
            );
            applyNotifications(nextNotifications);
            // Keep the badge authoritative even if this event raced a reconnect refetch.
            void fetchUnreadCount();

            // Play notification sound
            playNotificationSound();

            // Show toast with specific type
            const toastType = ['message', 'like', 'request'].includes(normalizedNotification.type)
                ? normalizedNotification.type
                : 'info';
            toast(getToastMessageFromNotification(normalizedNotification), toastType);
        };

        const handleConnect = () => {
            // Catch up on anything emitted while the socket was disconnected.
            void fetchNotifications();
            void fetchUnreadCount();
        };

        socket.on('new_notification', handleNewNotification);
        socket.on('connect', handleConnect);

        return () => {
            socket.off('new_notification', handleNewNotification);
            socket.off('connect', handleConnect);
        };
    }, [applyNotifications, fetchNotifications, fetchUnreadCount, playNotificationSound, socket, toast]);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            const wasUnread = notificationsRef.current.some((n) => n?._id === id && !n.read);
            applyNotifications((prev) => prev.map((n) => (
                n?._id === id ? { ...n, read: true } : n
            )));
            if (wasUnread) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            applyNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
        }
    };

    const clearAll = async () => {
        try {
            await api.delete('/notifications/delete-all');
            applyNotifications([]);
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
        }
    };

    const handleNotificationClick = (notification) => {
        if (!notification?.read) {
            void markAsRead(notification?._id);
        }

        navigate(getNotificationDestination(notification));
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
