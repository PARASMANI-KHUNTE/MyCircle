import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, PlusCircle, MessageCircle, Sun, Moon, Bell } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Button from '../ui/Button';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';
import { getAvatarUrl } from '../../utils/avatar';
import { useNotifications } from '../../context/NotificationContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../utils/api';
import ChatDrawer from '../chat/ChatDrawer';

const Navbar = () => {
    const { user, isAuthenticated } = useAuth();
    const { toggleTheme, isDark } = useTheme();
    const { unreadCount } = useNotifications();
    const [unreadMsgCount, setUnreadMsgCount] = useState(0);
    const { socket } = useSocket();

    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
    const location = useLocation();

    // @ts-ignore
    const isProduction = import.meta.env.PROD;
    const apiURL = isProduction
        // @ts-ignore
        ? (import.meta.env.VITE_API_URL || '')
        // @ts-ignore
        : (import.meta.env.VITE_API_URL_DEV || '');

    const handleGoogleLogin = () => {
        window.location.href = `${apiURL}/auth/google`;
    };

    const fetchUnreadMsgCount = async () => {
        try {
            const res = await api.get('/chat/unread/count');
            setUnreadMsgCount(res.data.count);
        } catch {
            // Silent fail keeps current badge state
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchUnreadMsgCount();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (!socket || !isAuthenticated) return;

        const handleUpdate = () => {
            fetchUnreadMsgCount();
        };

        const handleNewMessage = () => {
            fetchUnreadMsgCount();
        };

        socket.on('receive_message', handleNewMessage);
        socket.on('messages_read', handleUpdate);
        socket.on('unread_count_update', handleUpdate);

        return () => {
            socket.off('receive_message', handleNewMessage);
            socket.off('messages_read', handleUpdate);
            socket.off('unread_count_update', handleUpdate);
        };
    }, [socket, isAuthenticated]);

    const navLinks = [
        { name: 'Feed', path: '/feed', public: true },
        { name: 'My Posts', path: '/my-posts', public: false },
        { name: 'Requests', path: '/requests', public: false },
    ];

    const visibleLinks = navLinks.filter(link => link.public || !!user);

    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={cn(
                'fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6',
                isScrolled ? 'bg-card/80 backdrop-blur-md py-3 shadow-sm' : 'bg-transparent py-6'
            )}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <span className="text-xl font-bold tracking-tight text-secondary">
                        My<span className="text-primary">Circle</span>
                    </span>
                </Link>

                {/* Right Aligned Links & Actions */}
                <div className="hidden md:flex items-center gap-8">
                    <div className="flex items-center gap-6 mr-4">
                        {visibleLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={cn(
                                    'text-[15px] font-medium transition-all relative py-1',
                                    location.pathname === link.path ? 'text-secondary font-semibold' : 'text-text-muted hover:text-secondary'
                                )}
                            >
                                {link.name}
                                {location.pathname === link.path && (
                                    <motion.div
                                        layoutId="nav-underline"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                                    />
                                )}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 border-l border-card-border pl-6">
                        {isAuthenticated ? (
                            <>
                                <button
                                    onClick={() => setIsChatDrawerOpen(true)}
                                    className="p-2 text-text-muted hover:text-secondary hover:bg-hover-bg rounded-full transition-colors relative"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    {unreadMsgCount > 0 && (
                                        <span className="absolute top-1 right-1 bg-primary text-primary-foreground text-[10px] font-bold px-1 rounded-full min-w-[16px] text-center border border-card">
                                            {unreadMsgCount > 99 ? '99+' : unreadMsgCount}
                                        </span>
                                    )}
                                </button>

                                <Link to="/notifications" className="p-2 text-text-muted hover:text-secondary hover:bg-hover-bg rounded-full transition-colors relative">
                                    <Bell className="w-5 h-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 bg-primary text-primary-foreground text-[10px] font-bold px-1 rounded-full min-w-[16px] text-center border border-card">
                                            {unreadCount}
                                        </span>
                                    )}
                                </Link>

                                <button
                                    onClick={toggleTheme}
                                    className="p-2 text-text-muted hover:text-secondary hover:bg-hover-bg rounded-full transition-colors"
                                >
                                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                </button>

                                <Link to="/profile">
                                    <div className="w-9 h-9 rounded-full bg-background border border-card-border p-0.5 hover:border-primary transition-colors">
                                        <img
                                            src={getAvatarUrl(user)}
                                            alt={user.displayName}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    </div>
                                </Link>

                                <Link to="/create-post">
                                    <Button variant="primary" className="py-2.5 px-5">
                                        <PlusCircle className="w-4 h-4" />
                                        <span>Create Post</span>
                                    </Button>
                                </Link>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={toggleTheme}
                                    className="p-2 text-text-muted hover:text-secondary hover:bg-hover-bg rounded-full transition-colors"
                                >
                                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                </button>
                                <Button variant="primary" className="text-[14px]" onClick={handleGoogleLogin}>
                                    Sign in
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden p-2 text-secondary"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="md:hidden absolute top-full left-0 right-0 bg-card border-b border-card-border shadow-lg"
                    >
                        <div className="flex flex-col p-6 gap-4">
                            {visibleLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-text-body hover:text-primary font-medium transition-colors"
                                >
                                    {link.name}
                                </Link>
                            ))}
                            {!isAuthenticated && (
                                <Button
                                    variant="primary"
                                    className="w-full justify-center mt-2"
                                    onClick={handleGoogleLogin}
                                >
                                    Sign in with Google
                                </Button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Drawer */}
            <ChatDrawer isOpen={isChatDrawerOpen} onClose={() => setIsChatDrawerOpen(false)} />
        </motion.nav>
    );
};

export default Navbar;
