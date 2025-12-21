import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { useToast } from '../components/ui/Toast';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { info, toast } = useToast();

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Play notification sound
            playNotificationSound();

            // Show toast with specific type
            const toastType = ['message', 'like', 'request'].includes(notification.type) ? notification.type : 'info';
            toast(notification.title || notification.message, toastType);
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
            setUnreadCount(res.data.filter(n => !n.read).length);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error(err);
        }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
        }
    };

    const playNotificationSound = () => {
        try {
            // Create a simple notification beep using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800; // Frequency in Hz
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            console.log('Audio not supported or blocked');
        }
    };

    const handleNotificationClick = (notification) => {
        // Mark as read
        if (!notification.read) {
            markAsRead(notification._id);
        }

        // Navigate based on notification type
        if (notification.relatedId) {
            if (notification.type === 'like') {
                navigate(`/post/${notification.relatedId}`);
            } else if (notification.type === 'comment' || notification.type === 'reply') {
                navigate(`/post/${notification.relatedId}#comments`);
            } else if (notification.type === 'message') {
                navigate('/chat');
            } else if (notification.type === 'request') {
                navigate('/requests');
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
