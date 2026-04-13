import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, PlusCircle, MessageCircle, Sun, Moon, Bell, Search, Settings, LogOut, User, Zap, Compass, Home } from 'lucide-react';
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
    const { user, isAuthenticated, logout } = useAuth();
    const { toggleTheme, isDark } = useTheme();
    const { unreadCount } = useNotifications();
    const { socket } = useSocket();
    const [unreadMsgCount, setUnreadMsgCount] = useState(0);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const location = useLocation();

    const apiURL = import.meta.env.VITE_API_URL_DEV || import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const handleGoogleLogin = () => {
        window.location.href = `${apiURL}/auth/google`;
    };

    const fetchUnreadMsgCount = async () => {
        try {
            const res = await api.get('/chat/unread/count');
            setUnreadMsgCount(res.data.count);
        } catch {
            // Silent fail
        }
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

        const handleUpdate = () => fetchUnreadMsgCount();
        
        socket.on('receive_message', handleUpdate);
        socket.on('messages_read', handleUpdate);
        socket.on('unread_count_update', handleUpdate);

        return () => {
            socket.off('receive_message', handleUpdate);
            socket.off('messages_read', handleUpdate);
            socket.off('unread_count_update', handleUpdate);
        };
    }, [socket, isAuthenticated]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsProfileDropdownOpen(false);
    }, [location.pathname]);

    const navLinks = [
        { name: 'Feed', path: '/feed', icon: Home },
        { name: 'Explore', path: '/explore', icon: Compass },
        { name: 'My Posts', path: '/my-posts', icon: User, auth: true },
    ];

    const visibleLinks = navLinks.filter(link => !link.auth || !!user);

    const totalUnread = unreadCount + unreadMsgCount;

    return (
        <>
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={cn(
                    'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
                    isScrolled 
                        ? 'bg-background/80 backdrop-blur-xl border-b border-card-border shadow-sm' 
                        : 'bg-transparent'
                )}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 md:h-20">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-all duration-300">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-tight hidden sm:block">
                                My<span className="gradient-text">Circle</span>
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-1">
                            {visibleLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={cn(
                                        'relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                                        location.pathname === link.path 
                                            ? 'text-primary bg-primary/10' 
                                            : 'text-foreground-muted hover:text-foreground hover:bg-card-hover'
                                    )}
                                >
                                    {link.icon && <link.icon className="w-4 h-4" />}
                                    {link.name}
                                    {location.pathname === link.path && (
                                        <motion.div
                                            layoutId="navbar-indicator"
                                            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full"
                                        />
                                    )}
                                </Link>
                            ))}
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-2">
                            {isAuthenticated ? (
                                <>
                                    {/* Search Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="icon-btn"
                                    >
                                        <Search className="w-5 h-5" />
                                    </motion.button>

                                    {/* Messages */}
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setIsChatDrawerOpen(true)}
                                        className="icon-btn relative"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        {unreadMsgCount > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                                                {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
                                            </span>
                                        )}
                                    </motion.button>

                                    {/* Notifications */}
                                    <Link to="/notifications" className="icon-btn relative">
                                        <Bell className="w-5 h-5" />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </Link>

                                    {/* Theme Toggle */}
                                    <button onClick={toggleTheme} className="icon-btn">
                                        {isDark ? (
                                            <Sun className="w-5 h-5" />
                                        ) : (
                                            <Moon className="w-5 h-5" />
                                        )}
                                    </button>

                                    {/* Create Post Button */}
                                    <Link to="/create-post">
                                        <Button size="sm" className="gap-2">
                                            <PlusCircle className="w-4 h-4" />
                                            <span className="hidden sm:inline">Create</span>
                                        </Button>
                                    </Link>

                                    {/* Profile Dropdown */}
                                    <div className="relative" ref={dropdownRef}>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                            className="ml-2 rounded-full avatar-ring"
                                        >
                                            <img
                                                src={getAvatarUrl(user)}
                                                alt={user?.displayName || 'Profile'}
                                                className="w-9 h-9 rounded-full object-cover"
                                            />
                                        </motion.button>

                                        <AnimatePresence>
                                            {isProfileDropdownOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="absolute right-0 top-full mt-2 w-64 bg-card rounded-2xl border border-card-border shadow-xl overflow-hidden"
                                                >
                                                    <div className="p-4 border-b border-card-border">
                                                        <p className="font-semibold text-foreground">{user?.displayName}</p>
                                                        <p className="text-sm text-foreground-muted truncate">{user?.email}</p>
                                                    </div>
                                                    <div className="p-2">
                                                        <Link to="/profile" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-card-hover transition-colors">
                                                            <User className="w-4 h-4 text-foreground-muted" />
                                                            <span className="text-sm font-medium">Profile</span>
                                                        </Link>
                                                        <Link to="/settings" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-card-hover transition-colors">
                                                            <Settings className="w-4 h-4 text-foreground-muted" />
                                                            <span className="text-sm font-medium">Settings</span>
                                                        </Link>
                                                    </div>
                                                    <div className="p-2 border-t border-card-border">
                                                        <button
                                                            onClick={logout}
                                                            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-error/10 text-error transition-colors w-full"
                                                        >
                                                            <LogOut className="w-4 h-4" />
                                                            <span className="text-sm font-medium">Sign out</span>
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <button onClick={toggleTheme} className="icon-btn">
                                        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                    </button>
                                    <Button variant="outline" size="sm" onClick={handleGoogleLogin}>
                                        Sign in
                                    </Button>
                                </>
                            )}

                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden icon-btn"
                            >
                                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-card border-t border-card-border"
                        >
                            <div className="px-4 py-4 space-y-1">
                                {visibleLinks.map((link) => (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={cn(
                                            'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                                            location.pathname === link.path
                                                ? 'text-primary bg-primary/10'
                                                : 'text-foreground-muted hover:text-foreground hover:bg-card-hover'
                                        )}
                                    >
                                        {link.icon && <link.icon className="w-5 h-5" />}
                                        {link.name}
                                    </Link>
                                ))}
                                {!isAuthenticated && (
                                    <Button className="w-full mt-4" onClick={handleGoogleLogin}>
                                        Sign in with Google
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.nav>

            {/* Chat Drawer */}
            <ChatDrawer isOpen={isChatDrawerOpen} onClose={() => setIsChatDrawerOpen(false)} />
        </>
    );
};

export default Navbar;
