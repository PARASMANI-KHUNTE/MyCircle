import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, PlusCircle, MessageCircle, Sun, Moon } from 'lucide-react';
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

    const { user, login, isAuthenticated } = useAuth();
    const { theme, toggleTheme, isDark } = useTheme();
    const { unreadCount } = useNotifications();
    const [unreadMsgCount, setUnreadMsgCount] = useState(0);
    const { socket } = useSocket();

    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
    const location = useLocation();

    const isProduction = import.meta.env.PROD;
    const apiURL = isProduction
        ? (import.meta.env.VITE_API_URL || '')
        : (import.meta.env.VITE_API_URL_DEV || 'http://localhost:5000');

    // Google OAuth Login Handler
    const handleGoogleLogin = () => {
        window.location.href = `${apiURL}/auth/google`;
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
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
            try {
                const audio = new Audio('/notification.mp3');
                audio.play().catch(e => console.log('Audio play failed - user interaction needed first?', e));
            } catch (error) {
                console.error("Error playing sound:", error);
            }
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

    const fetchUnreadMsgCount = async () => {
        try {
            const res = await api.get('/chat/unread/count');
            setUnreadMsgCount(res.data.count);
        } catch (err) {
            console.error(err);
        }
    };

    // ... existing scroll effect ...

    const navLinks = [
        { name: 'Feed', path: '/feed', public: true },
        { name: 'My Posts', path: '/my-posts', public: false },
        { name: 'My Requests', path: '/requests', public: false },
        { name: 'Notifications', path: '/notifications', public: false },
    ];

    const visibleLinks = navLinks.filter(link => link.public || !!user);

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={cn(
                'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
                isScrolled ? 'glass py-3' : 'bg-transparent py-5'
            )}
        >
            <div className="container mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <img src="/logo.png" alt="MyCircle" className="w-10 h-10 object-contain group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-xl font-bold font-display tracking-tight text-foreground group-hover:text-primary transition-colors">
                        MyCircle
                    </span>
                </Link>

                <div className="hidden md:flex items-center gap-8">
                    {visibleLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={cn(
                                'text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5',
                                location.pathname === link.path ? 'text-primary font-semibold' : 'text-muted-foreground'
                            )}
                        >
                            {link.name}
                            {link.name === 'Notifications' && unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-lg shadow-red-500/20">
                                    {unreadCount}
                                </span>
                            )}
                        </Link>
                    ))}
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-4">
                    {isAuthenticated ? (
                        <>
                            <button
                                onClick={() => setIsChatDrawerOpen(true)}
                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-foreground/10 rounded-full transition-colors relative"
                                title="Messages"
                            >
                                <MessageCircle className="w-5 h-5" />
                                {unreadMsgCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-lg shadow-red-500/20 border-2 border-background">
                                        {unreadMsgCount > 99 ? '99+' : unreadMsgCount}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={toggleTheme}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                            >
                                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>

                            <Link to="/create-post">
                                <Button variant="primary" className="pl-3 pr-4">
                                    <PlusCircle className="w-4 h-4" />
                                    <span>Post</span>
                                </Button>
                            </Link>
                            <Link to="/profile">
                                <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden border border-white/10 hover:border-primary transition-colors cursor-pointer">
                                    <img
                                        src={getAvatarUrl(user)}
                                        alt={user.displayName}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </Link>
                        </>
                    ) : (
                        <Button variant="outline" className="text-sm" onClick={handleGoogleLogin}>
                            Sign in with Google
                        </Button>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden text-white"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden glass border-t border-white/5 overflow-hidden"
                    >
                        <div className="flex flex-col p-6 gap-4">
                            {visibleLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-gray-300 hover:text-white py-2"
                                >
                                    {link.name}
                                </Link>
                            ))}
                            {isAuthenticated && (
                                <button
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        setIsChatDrawerOpen(true);
                                    }}
                                    className="text-muted-foreground hover:text-foreground py-2 flex items-center gap-2"
                                >
                                    Messages
                                </button>
                            )}
                            <div className="h-px bg-white/10 my-2" />
                            {!isAuthenticated && (
                                <Button
                                    variant="primary"
                                    className="w-full justify-center"
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
