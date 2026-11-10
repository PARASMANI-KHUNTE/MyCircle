import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Compass, Plus, Bell, MessageCircle, Wallet } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useNotifications } from '../../context/NotificationContext';
import { cn } from '../../utils/cn';
import api from '../../utils/api';

const BottomNav = () => {
    const location = useLocation();
    const { socket } = useSocket();
    const { unreadCount = 0 } = useNotifications() || {};
    const [unreadMsgCount, setUnreadMsgCount] = useState(0);
    const inFlightRef = useRef(false);
    const queuedRef = useRef(false);
    const timeoutRef = useRef(null);

    useEffect(() => {
        const fetchCount = async () => {
            if (inFlightRef.current) {
                queuedRef.current = true;
                return;
            }
            inFlightRef.current = true;
            try {
                const res = await api.get('/chat/unread/count');
                setUnreadMsgCount(res.data?.count || 0);
            } catch {
                /* silent */
            } finally {
                inFlightRef.current = false;
                if (queuedRef.current) {
                    queuedRef.current = false;
                    window.clearTimeout(timeoutRef.current);
                    timeoutRef.current = window.setTimeout(() => void fetchCount(), 150);
                }
            }
        };

        void fetchCount();

        if (!socket) return;

        const handle = () => {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = window.setTimeout(() => void fetchCount(), 150);
        };

        socket.on('receive_message', handle);
        socket.on('messages_read', handle);
        socket.on('unread_count_update', handle);

        return () => {
            window.clearTimeout(timeoutRef.current);
            socket.off('receive_message', handle);
            socket.off('messages_read', handle);
            socket.off('unread_count_update', handle);
        };
    }, [socket]);

    const navItems = [
        { path: '/', icon: Compass, label: 'Explore' },
        { path: '/wallet', icon: Wallet, label: 'Wallet' },
        { path: '/create-post', icon: Plus, label: 'Post', isPrimary: true },
        { path: '/chat', icon: MessageCircle, label: 'Chat', badge: unreadMsgCount },
        { path: '/notifications', icon: Bell, label: 'Alerts', badge: unreadCount },
    ];

    const hideOnRoutes = ['/create-post', '/edit-post', '/settings', '/edit-profile', '/chat'];
    if (hideOnRoutes.some((route) => location.pathname.startsWith(route))) {
        return null;
    }

    return (
        <nav
            className="fixed inset-x-0 bottom-0 z-40 border-t border-card-border/80 bg-background/90 backdrop-blur-md md:hidden"
            aria-label="Mobile navigation"
        >
            <div
                className="mx-auto flex h-14 max-w-md items-center justify-around px-2"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0.25rem)' }}
            >
                {navItems.map((item) => {
                    const Icon = item.icon;
                    if (item.isPrimary) {
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                aria-label="Create Listing"
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm active:scale-95 transition-transform"
                            >
                                <Icon className="h-5 w-5" />
                            </NavLink>
                        );
                    }

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            aria-label={item.label}
                            className={({ isActive }) =>
                                cn(
                                    'flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-medium transition-colors select-none',
                                    isActive ? 'text-primary font-semibold' : 'text-foreground-muted hover:text-foreground'
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span className="relative">
                                        <Icon className="h-4 w-4" />
                                        {item.badge > 0 && (
                                            <span className="absolute -top-1 -right-1.5 h-3.5 min-w-[14px] px-0.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                                                {item.badge > 9 ? '9+' : item.badge}
                                            </span>
                                        )}
                                    </span>
                                    <span>{item.label}</span>
                                    {isActive && (
                                        <span className="w-1 h-1 rounded-full bg-primary" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
