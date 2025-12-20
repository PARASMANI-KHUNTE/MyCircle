import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, MessageCircle, Info, Trash2 } from 'lucide-react';
import Button from '../components/ui/Button';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock notifications
        const fetchNotifications = async () => {
            setTimeout(() => {
                setNotifications([
                    {
                        id: 1,
                        type: 'request',
                        title: 'New Contact Request',
                        message: 'John Doe wants to help with your Garden Trimming task.',
                        time: '2 hours ago',
                        read: false,
                        icon: <MessageCircle className="w-5 h-5 text-blue-400" />
                    },
                    {
                        id: 2,
                        type: 'approval',
                        title: 'Request Approved!',
                        message: 'Alice approved your request for the Vintage Bicycle.',
                        time: '5 hours ago',
                        read: true,
                        icon: <CheckCircle className="w-5 h-5 text-green-400" />
                    },
                    {
                        id: 3,
                        type: 'info',
                        title: 'Welcome to MyCircle',
                        message: 'Start exploring your neighborhood and help your community.',
                        time: '1 day ago',
                        read: true,
                        icon: <Info className="w-5 h-5 text-purple-400" />
                    }
                ]);
                setLoading(false);
            }, 800);
        };
        fetchNotifications();
    }, []);

    const markAsRead = (id) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const deleteNotification = (id) => {
        setNotifications(notifications.filter(n => n.id !== id));
    };

    return (
        <div className="container mx-auto px-6 py-24 max-w-3xl min-h-screen">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                        <Bell className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-bold text-white font-display">Notifications</h1>
                </div>
                <Button variant="ghost" className="text-gray-400 text-sm hover:text-white" onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}>
                    Mark all as read
                </Button>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-white text-center py-20">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="glass p-12 rounded-3xl text-center">
                        <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">All caught up! No new notifications.</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {notifications.map((n) => (
                            <motion.div
                                key={n.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className={`glass p-6 rounded-2xl relative border-l-4 transition-all ${n.read ? 'border-transparent opacity-70' : 'border-primary shadow-lg shadow-primary/5'}`}
                            >
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 mt-1">
                                        {n.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className={`font-bold ${n.read ? 'text-gray-400' : 'text-white'}`}>{n.title}</h3>
                                            <span className="text-xs text-gray-500">{n.time}</span>
                                        </div>
                                        <p className="text-gray-400 text-sm mt-1">{n.message}</p>

                                        <div className="flex gap-3 mt-4">
                                            {!n.read && (
                                                <Button variant="outline" className="text-xs py-1.5 h-auto" onClick={() => markAsRead(n.id)}>
                                                    Mark as read
                                                </Button>
                                            )}
                                            <button className="p-2 text-gray-600 hover:text-red-400 transition-colors" onClick={() => deleteNotification(n.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

export default Notifications;
