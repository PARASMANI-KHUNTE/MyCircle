import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, PlusSquare, Bell, MessageCircle, Wallet } from 'lucide-react';
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
        { path: '/', icon: Home, label: 'Home' },
        { path: '/wallet', icon: Wallet, label: 'Wallet' },
        { path: '/create-post', icon: PlusSquare, label: 'Create' },
        { path: '/notifications', icon: Bell, label: 'Alerts', badge: unreadCount },
        { path: '/chat', icon: MessageCircle, label: 'Chat', badge: unreadMsgCount },
    ];

    const hideOnRoutes = ['/create-post', '/edit-post', '/settings', '/edit-profile', '/chat'];
    if (hideOnRoutes.some((route) => location.pathname.startsWith(route))) {
        return null;
    }

    return (
        <nav
            className="fixed inset-x-0 bottom-0 z-40 border-t border-card-border bg-card lg:hidden"
            aria-label="Mobile navigation"
        >
            <div
                className="mx-auto flex h-14 max-w-xl items-center justify-around px-2"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0.25rem)' }}
            >
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            aria-label={item.label}
                            className={({ isActive }) =>
                                cn(
                                    'flex min-h-[44px] w-14 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-medium transition-colors',
                                    isActive ? 'text-primary' : 'text-foreground-muted hover:text-foreground'
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span className="relative">
                                        <Icon className="h-5 w-5" />
                                        {item.badge > 0 && (
                                            <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground">
                                                {item.badge > 9 ? '9+' : item.badge}
                                            </span>
                                        )}
                                    </span>
                                    <span>{item.label}</span>
                                    <span
                                        className={cn(
                                            'h-0.5 w-4 rounded-full transition-colors',
                                            isActive ? 'bg-primary' : 'bg-transparent'
                                        )}
                                    />
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
