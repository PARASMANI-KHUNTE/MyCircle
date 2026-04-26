import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, PlusSquare, Bell, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSocket } from '../../context/SocketContext';
import { useNotifications } from '../../context/NotificationContext';
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
            if (inFlightRef.current) { queuedRef.current = true; return; }
            inFlightRef.current = true;
            try {
                const res = await api.get('/chat/unread/count');
                setUnreadMsgCount(res.data.count || 0);
            } catch { /* silent */ } finally {
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
        { path: '/create-post', icon: PlusSquare, label: 'Create', highlight: true },
        { path: '/notifications', icon: Bell, label: 'Alerts', badge: unreadCount },
        { path: '/chat', icon: MessageCircle, label: 'Chat', badge: unreadMsgCount },
    ];

    // Hide on routes with their own full-screen layout
    const hideOnRoutes = [
        '/create-post',
        '/edit-post', 
        '/settings',
        '/edit-profile',
        '/chat',
    ];
    
    // Hide if current route matches any hide route
    const shouldHide = hideOnRoutes.some(route => location.pathname.startsWith(route));
    
    if (shouldHide) {
        return null;
    }

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-[var(--z-sticky)] bg-card/95 backdrop-blur-xl border-t border-card-border lg:hidden"
            aria-label="Mobile navigation"
        >
            {/* Safe-area inset for notched devices */}
            <div
                className="flex items-center justify-around h-16 px-2 max-w-xl mx-auto"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0.5rem)' }}
            >
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            aria-label={item.label}
                            aria-current={isActive ? 'page' : undefined}
                            className="relative flex flex-col items-center justify-center w-14 min-h-[44px] gap-0.5 rounded-xl transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 outline-none"
                        >
                            {/* Highlight pill for Create */}
                            {item.highlight ? (
                                <motion.div
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.93 }}
                                    className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center -translate-y-4 shadow-lg"
                                    style={{ boxShadow: '0 4px 20px rgb(245 158 11 / 0.4)' }}
                                >
                                    <Icon className="w-6 h-6 text-primary-foreground" />
                                </motion.div>
                            ) : (
                                <>
                                    <div className="relative">
                                        <Icon
                                            className={`w-5 h-5 transition-colors duration-200 ${
                                                isActive ? 'text-primary' : 'text-foreground-muted'
                                            }`}
                                        />
                                        {item.badge > 0 && (
                                            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                                                {item.badge > 9 ? '9+' : item.badge}
                                            </span>
                                        )}
                                    </div>
                                    <span
                                        className={`text-[10px] font-medium transition-colors duration-200 ${
                                            isActive ? 'text-primary' : 'text-foreground-muted'
                                        }`}
                                    >
                                        {item.label}
                                    </span>

                                    {/* Active indicator dot */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="bottom-nav-dot"
                                            className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary"
                                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                        />
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
