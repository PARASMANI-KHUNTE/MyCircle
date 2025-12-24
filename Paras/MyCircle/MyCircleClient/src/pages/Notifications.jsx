import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, MessageCircle, Info, Trash2, Heart, AlertCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../components/ui/Toast';
import { useNotifications } from '../context/NotificationContext';
import { getAvatarUrl } from '../utils/avatar';

const Notifications = () => {
    const { notifications, markAsRead, markAllRead, refresh, loading, handleNotificationClick } = useNotifications();
    const { success, error: showError } = useToast();

    const handleDelete = async (id) => {
        try {
            await api.delete(`/notifications/${id}`);
            refresh();
        } catch (err) {
            showError('Failed to delete');
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'request': return <MessageCircle className="w-5 h-5 text-blue-400" />;
            case 'approval': return <CheckCircle className="w-5 h-5 text-green-400" />;
            case 'like': return <Heart className="w-5 h-5 text-pink-500" />;
            case 'info': return <Info className="w-5 h-5 text-purple-400" />;
            default: return <Bell className="w-5 h-5 text-gray-400" />;
        }
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
                {notifications.some(n => !n.read) && (
                    <Button variant="ghost" className="text-gray-400 text-sm hover:text-white" onClick={markAllRead}>
                        Mark all as read
                    </Button>
                )}
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-white text-center py-20 flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-4"></div>
                        Loading...
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="glass p-12 rounded-3xl text-center">
                        <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">All caught up! No new notifications.</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {notifications.map((n) => (
                            <motion.div
                                key={n._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onClick={() => handleNotificationClick(n)}
                                className={`glass p-6 rounded-2xl relative border-l-4 transition-all cursor-pointer hover:scale-[1.02] ${n.read ? 'border-transparent opacity-70 bg-white/5' : 'border-primary shadow-lg shadow-primary/5 bg-white/10'}`}
                            >
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 relative">
                                        <img
                                            src={getAvatarUrl(n.sender)}
                                            alt=""
                                            className="w-12 h-12 rounded-full border border-white/10 object-cover"
                                        />
                                        <div className="absolute -bottom-1 -right-1 p-1 bg-dark rounded-full">
                                            {getIcon(n.type)}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className={`font-bold ${n.read ? 'text-gray-400' : 'text-white'}`}>{n.title}</h3>
                                            <span className="text-xs text-gray-500">
                                                {new Date(n.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                            </span>
                                        </div>
                                        <p className="text-gray-400 text-sm mt-1">{n.message}</p>

                                        <div className="flex gap-3 mt-4">
                                            {!n.read && (
                                                <Button
                                                    variant="outline"
                                                    className="text-xs py-1.5 h-auto text-primary border-primary/20 hover:bg-primary/10"
                                                    onClick={(e) => { e.stopPropagation(); markAsRead(n._id); }}
                                                >
                                                    Mark as read
                                                </Button>
                                            )}
                                            <button
                                                className="p-2 text-gray-600 hover:text-red-400 transition-colors ml-auto"
                                                onClick={(e) => { e.stopPropagation(); handleDelete(n._id); }}
                                                title="Delete"
                                            >
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
