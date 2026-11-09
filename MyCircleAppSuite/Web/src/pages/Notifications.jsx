import React from 'react';
import { Bell, CheckCircle2, MessageCircle, Info, Trash2, Heart, BellOff } from 'lucide-react';
import Button from '../components/ui/Button';
import api from '../utils/api';
import { useToast } from '../components/ui/Toast';
import { useNotifications } from '../context/NotificationContext';
import { generateAvatar, getAvatarUrl } from '../utils/avatar';
import { getNotificationCopy } from '../utils/notificationMessage';
import { cn } from '../utils/cn';

const typeConfig = {
    request: { icon: MessageCircle, className: 'text-info bg-info/10 border-info/20' },
    approval: { icon: CheckCircle2, className: 'text-success bg-success/10 border-success/20' },
    like: { icon: Heart, className: 'text-primary bg-primary/10 border-primary/20' },
    comment: { icon: MessageCircle, className: 'text-primary bg-primary/10 border-primary/20' },
    info: { icon: Info, className: 'text-primary bg-primary/10 border-primary/20' },
};

const getTypeConfig = (type) =>
    typeConfig[type] || { icon: Bell, className: 'text-foreground-muted bg-background-secondary border-card-border' };

const formatDate = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
};

const Notifications = () => {
    const { notifications, markAsRead, markAllRead, clearAll, refresh, loading, handleNotificationClick } =
        useNotifications();
    const { error: showError } = useToast();

    const handleDelete = async (id) => {
        try {
            await api.delete(`/notifications/${id}`);
            refresh();
        } catch {
            showError('Failed to delete notification');
        }
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
            <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">Notifications</h1>
                    <p className="mt-1 text-sm text-foreground-muted">
                        {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {unreadCount > 0 && (
                        <Button variant="outline" size="sm" onClick={markAllRead}>
                            Mark all read
                        </Button>
                    )}
                    {notifications.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAll}
                            className="text-error hover:bg-error/10 hover:text-error"
                        >
                            Clear all
                        </Button>
                    )}
                </div>
            </header>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="flex gap-3 rounded-2xl border border-card-border bg-card p-4"
                        >
                            <div className="skeleton h-10 w-10 shrink-0 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <div className="skeleton h-4 w-2/3 rounded-lg" />
                                <div className="skeleton h-3 w-4/5 rounded-lg" />
                                <div className="skeleton h-3 w-1/3 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-card-border px-6 py-20 text-center">
                    <BellOff className="mb-3 h-8 w-8 text-foreground-muted/50" />
                    <p className="text-sm font-medium text-foreground">No notifications</p>
                    <p className="mt-1 max-w-xs text-sm text-foreground-muted">
                        Activity about your posts and requests will appear here.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map((n) => {
                        const copy = getNotificationCopy(n);
                        const config = getTypeConfig(n.type);
                        const TypeIcon = config.icon;

                        return (
                            <article
                                key={n._id}
                                onClick={() => handleNotificationClick(n)}
                                className={cn(
                                    'relative flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors',
                                    n.read
                                        ? 'border-card-border bg-card opacity-70 hover:border-card-border-hover'
                                        : 'border-primary/20 bg-card hover:border-primary/40'
                                )}
                            >
                                {!n.read && (
                                    <span className="absolute bottom-4 left-0 top-4 w-0.5 rounded-r-full bg-primary" />
                                )}

                                <div className="relative shrink-0">
                                    <img
                                        src={getAvatarUrl(n.sender)}
                                        alt=""
                                        aria-hidden="true"
                                        className="h-10 w-10 rounded-full border border-card-border object-cover"
                                        onError={(e) => {
                                            const target = e.currentTarget;
                                            target.onerror = null;
                                            const seed = n?.sender?.displayName || n?.sender?.email || 'User';
                                            target.src = generateAvatar(seed, 96);
                                        }}
                                    />
                                    <span
                                        className={cn(
                                            'absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card',
                                            config.className
                                        )}
                                    >
                                        <TypeIcon className="h-2.5 w-2.5" />
                                    </span>
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <h2
                                            className={cn(
                                                'text-sm font-semibold leading-snug',
                                                n.read ? 'text-foreground-secondary' : 'text-foreground'
                                            )}
                                        >
                                            {copy.title}
                                        </h2>
                                        <time className="mt-0.5 shrink-0 text-[11px] text-foreground-muted">
                                            {formatDate(n.createdAt)}
                                        </time>
                                    </div>
                                    <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-foreground-muted">
                                        {copy.message}
                                    </p>

                                    <div className="mt-2 flex items-center gap-2">
                                        {!n.read && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markAsRead(n._id);
                                                }}
                                                className="text-xs font-medium text-primary hover:underline"
                                            >
                                                Mark as read
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(n._id);
                                            }}
                                            aria-label="Delete notification"
                                            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-error/10 hover:text-error"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Notifications;
