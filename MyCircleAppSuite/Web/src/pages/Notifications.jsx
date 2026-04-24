import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle2, MessageCircle, Info, Trash2, Heart, BellOff } from 'lucide-react';
import Button from '../components/ui/Button';
import api from '../utils/api';
import { useToast } from '../components/ui/Toast';
import { useNotifications } from '../context/NotificationContext';
import { getAvatarUrl } from '../utils/avatar';
import { cn } from '../utils/cn';

/* Maps notification type → icon + color tokens */
const typeConfig = {
    request: { icon: MessageCircle, class: 'text-info bg-info/10 border-info/20' },
    approval: { icon: CheckCircle2, class: 'text-success bg-success/10 border-success/20' },
    like:     { icon: Heart,         class: 'text-pink-500 bg-pink-500/10 border-pink-500/20' },
    info:     { icon: Info,          class: 'text-primary bg-primary/10 border-primary/20' },
};

const getTypeConfig = (type) => typeConfig[type] || { icon: Bell, class: 'text-foreground-muted bg-background-secondary border-card-border' };

const formatDate = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
};

const Notifications = () => {
    const { notifications, markAsRead, markAllRead, clearAll, refresh, loading, handleNotificationClick } = useNotifications();
    const { error: showError } = useToast();

    const handleDelete = async (id) => {
        try {
            await api.delete(`/notifications/${id}`);
            refresh();
        } catch {
            showError('Failed to delete notification');
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-3xl min-h-screen">
            {/* Page header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    {unreadCount > 0 && (
                        <p className="text-sm text-foreground-muted mt-0.5">
                            {unreadCount} unread
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={markAllRead}
                        >
                            Mark all read
                        </Button>
                    )}
                    {notifications.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-error hover:bg-error/10 hover:text-error"
                            onClick={clearAll}
                        >
                            Clear all
                        </Button>
                    )}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                /* Skeleton loading state */
                <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex gap-4 p-5 rounded-2xl border border-card-border bg-card">
                            <div className="skeleton w-12 h-12 rounded-full shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="skeleton h-4 w-2/3 rounded-lg" />
                                <div className="skeleton h-3 w-4/5 rounded-lg" />
                                <div className="skeleton h-3 w-1/3 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : notifications.length === 0 ? (
                /* Empty state */
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-24 text-center"
                >
                    <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
                        <BellOff className="w-9 h-9 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold mb-2">All caught up!</h2>
                    <p className="text-sm text-foreground-muted max-w-xs">
                        You have no new notifications. When something happens, it'll appear here.
                    </p>
                </motion.div>
            ) : (
                <AnimatePresence mode="popLayout">
                    <div className="space-y-3">
                        {notifications.map((n) => {
                            const config = getTypeConfig(n.type);
                            const TypeIcon = config.icon;

                            return (
                                <motion.div
                                    key={n._id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                                    onClick={() => handleNotificationClick(n)}
                                    className={cn(
                                        'relative flex gap-4 p-5 rounded-2xl border cursor-pointer transition-all duration-200',
                                        'hover:border-card-border-hover hover:shadow-md',
                                        n.read
                                            ? 'bg-card border-card-border opacity-70'
                                            : 'bg-card border-primary/20 shadow-sm'
                                    )}
                                >
                                    {/* Unread indicator bar */}
                                    {!n.read && (
                                        <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-primary" />
                                    )}

                                    {/* Avatar with type icon badge */}
                                    <div className="relative shrink-0">
                                        <img
                                            src={getAvatarUrl(n.sender)}
                                            alt=""
                                            aria-hidden="true"
                                            className="w-12 h-12 rounded-full object-cover border-2 border-card-border"
                                        />
                                        <div className={cn(
                                            'absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-card flex items-center justify-center',
                                            config.class
                                        )}>
                                            <TypeIcon className="w-3 h-3" />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3">
                                            <h3 className={cn(
                                                'text-sm font-semibold leading-snug',
                                                n.read ? 'text-foreground-secondary' : 'text-foreground'
                                            )}>
                                                {n.title}
                                            </h3>
                                            <time className="text-[11px] text-foreground-muted shrink-0 mt-0.5">
                                                {formatDate(n.createdAt)}
                                            </time>
                                        </div>
                                        <p className="text-sm text-foreground-muted mt-0.5 leading-relaxed line-clamp-2">
                                            {n.message}
                                        </p>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 mt-3">
                                            {!n.read && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); markAsRead(n._id); }}
                                                    className="text-xs font-semibold text-primary hover:underline underline-offset-2 transition-colors"
                                                >
                                                    Mark as read
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(n._id); }}
                                                aria-label="Delete notification"
                                                className="ml-auto flex items-center justify-center w-8 h-8 rounded-lg text-foreground-muted hover:text-error hover:bg-error/10 transition-all duration-200"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </AnimatePresence>
            )}
        </div>
    );
};

export default Notifications;
