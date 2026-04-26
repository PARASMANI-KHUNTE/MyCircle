import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, PlusCircle, MessageCircle, Sun, Moon, Bell, Settings, LogOut, User, CircleDot, Inbox } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Button from '../ui/Button';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';
import { getAvatarUrl } from '../../utils/avatar';
import { useNotifications } from '../../context/NotificationContext';
import { useSocket } from '../../context/SocketContext';
import api, { getSocketBaseUrl } from '../../utils/api';
import ChatDrawer from '../chat/ChatDrawer';

const Navbar = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const { toggleTheme, isDark } = useTheme();
    const { unreadCount = 0 } = useNotifications() || {};
    const { socket } = useSocket();
    const [unreadMsgCount, setUnreadMsgCount] = useState(0);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const unreadRequestInFlightRef = useRef(false);
    const unreadRefreshQueuedRef = useRef(false);
    const unreadRefreshTimeoutRef = useRef(null);
    const location = useLocation();

    const apiURL = getSocketBaseUrl();

    const handleGoogleLogin = () => {
        const returnTo = encodeURIComponent(window.location.origin);
        window.location.href = `${apiURL}/auth/google?returnTo=${returnTo}`;
    };

    const fetchUnreadMsgCount = useCallback(async () => {
        if (unreadRequestInFlightRef.current) {
            unreadRefreshQueuedRef.current = true;
            return;
        }

        unreadRequestInFlightRef.current = true;
        try {
            const res = await api.get('/chat/unread/count');
            setUnreadMsgCount(res.data.count || 0);
        } catch {
            // Silent fail
        } finally {
            unreadRequestInFlightRef.current = false;
            if (unreadRefreshQueuedRef.current) {
                unreadRefreshQueuedRef.current = false;
                window.clearTimeout(unreadRefreshTimeoutRef.current);
                unreadRefreshTimeoutRef.current = window.setTimeout(() => {
                    void fetchUnreadMsgCount();
                }, 150);
            }
        }
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.clearTimeout(unreadRefreshTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchUnreadMsgCount();
        }
    }, [fetchUnreadMsgCount, isAuthenticated]);

    useEffect(() => {
        if (!socket || !isAuthenticated) return;

        const handleUpdate = () => {
            window.clearTimeout(unreadRefreshTimeoutRef.current);
            unreadRefreshTimeoutRef.current = window.setTimeout(() => {
                void fetchUnreadMsgCount();
            }, 150);
        };
        
        socket.on('receive_message', handleUpdate);
        socket.on('messages_read', handleUpdate);
        socket.on('unread_count_update', handleUpdate);

        return () => {
            socket.off('receive_message', handleUpdate);
            socket.off('messages_read', handleUpdate);
            socket.off('unread_count_update', handleUpdate);
        };
    }, [fetchUnreadMsgCount, socket, isAuthenticated]);

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

    useEffect(() => {
        if (!isMobileMenuOpen) return undefined;

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsMobileMenuOpen(false);
            }
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isMobileMenuOpen]);

    const navLinks = [
        { name: 'Requests', path: '/requests', icon: Inbox, auth: true },
        { name: 'My Posts', path: '/my-posts', icon: User, auth: true },
    ];

    const visibleLinks = navLinks.filter(link => !link.auth || !!user);
    const mobileDrawer = (
        <AnimatePresence>
            {isMobileMenuOpen && (
                <>
                    <motion.button
                        type="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1200] bg-black/45 md:hidden"
                        aria-label="Close menu overlay"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    <motion.aside
                        id="mobile-nav-drawer"
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
                        className="fixed top-0 left-0 bottom-0 z-[1210] w-[min(84vw,20rem)] md:hidden bg-background/95 backdrop-blur-xl border-r border-card-border shadow-2xl"
                    >
                        <div className="flex h-full flex-col">
                            <div className="flex items-center justify-between px-4 py-4 border-b border-card-border">
                                <Link to="/" className="flex items-center gap-3 group">
                                    <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md" style={{ boxShadow: '0 4px 12px rgb(245 158 11 / 0.35)' }}>
                                        <CircleDot className="w-4 h-4" />
                                    </div>
                                    <span className="text-lg font-semibold tracking-tight font-display">
                                        MyCircle
                                    </span>
                                </Link>

                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="icon-btn"
                                    aria-label="Close menu"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                                <Link
                                    to="/"
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                                        location.pathname === '/'
                                            ? 'text-foreground bg-card border border-card-border'
                                            : 'text-foreground-muted hover:text-foreground hover:bg-card-hover'
                                    )}
                                >
                                    <CircleDot className="w-5 h-5" />
                                    Home
                                </Link>

                                {visibleLinks.map((link) => (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={cn(
                                            'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                                            location.pathname === link.path
                                                ? 'text-foreground bg-card border border-card-border'
                                                : 'text-foreground-muted hover:text-foreground hover:bg-card-hover'
                                        )}
                                    >
                                        {link.icon && <link.icon className="w-5 h-5" />}
                                        {link.name}
                                    </Link>
                                ))}

                                {isAuthenticated ? (
                                    <>
                                        <Link
                                            to="/profile"
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-card-hover transition-colors"
                                        >
                                            <User className="w-5 h-5" />
                                            Profile
                                        </Link>
                                        <Link
                                            to="/settings"
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-card-hover transition-colors"
                                        >
                                            <Settings className="w-5 h-5" />
                                            Settings
                                        </Link>
                                        <button
                                            onClick={toggleTheme}
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-card-hover transition-colors w-full"
                                        >
                                            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                            {isDark ? 'Light Mode' : 'Dark Mode'}
                                        </button>
                                        <button
                                            onClick={logout}
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-error hover:bg-error/10 transition-colors w-full"
                                        >
                                            <LogOut className="w-5 h-5" />
                                            Sign out
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={toggleTheme}
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-card-hover transition-colors w-full"
                                        >
                                            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                            {isDark ? 'Light Mode' : 'Dark Mode'}
                                        </button>
                                        <Button className="w-full mt-4" onClick={handleGoogleLogin}>
                                            Sign in with Google
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );

    return (
        <>
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={cn(
                    'fixed top-0 left-0 right-0 z-[1100] transition-all duration-300',
                    isScrolled 
                        ? 'bg-background/90 backdrop-blur-xl border-b border-card-border shadow-sm' 
                        : 'bg-background/70 backdrop-blur-lg border-b border-transparent'
                )}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 md:h-20">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden icon-btn"
                                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                                aria-expanded={isMobileMenuOpen}
                                aria-controls="mobile-nav-drawer"
                            >
                                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>

                            <Link to="/" className="hidden md:flex items-center gap-3 group">
                                <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center transition-all duration-300 shadow-md" style={{ boxShadow: '0 4px 12px rgb(245 158 11 / 0.35)' }}>
                                    <CircleDot className="w-4 h-4" />
                                </div>
                                <span className="text-xl font-semibold tracking-tight hidden sm:block font-display">
                                    MyCircle
                                </span>
                            </Link>
                        </div>

                        <div className="hidden md:flex items-center gap-1">
                            {visibleLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={cn(
                                        'relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 min-h-[44px]',
                                        location.pathname === link.path
                                            ? 'text-primary bg-primary/10 border border-primary/20'
                                            : 'text-foreground-muted hover:text-foreground hover:bg-card-hover'
                                    )}
                                >
                                    {link.icon && <link.icon className="w-4 h-4" />}
                                    {link.name}
                                    {location.pathname === link.path && (
                                        <motion.div
                                            layoutId="navbar-indicator"
                                            className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 w-7 h-0.5 bg-primary rounded-full"
                                        />
                                    )}
                                </Link>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            {isAuthenticated ? (
                                <>
                                    {/* Chat - hidden on mobile (BottomNav), visible lg+ */}
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setIsChatDrawerOpen(true)}
                                        className="icon-btn relative hidden lg:inline-flex"
                                        aria-label="Open messages"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        {unreadMsgCount > 0 && (
                                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                                                {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
                                            </span>
                                        )}
                                    </motion.button>

                                    {/* Notifications - hidden on mobile (BottomNav), visible lg+ */}
                                    <Link to="/notifications" className="icon-btn relative hidden lg:inline-flex" aria-label="Notifications">
                                        <Bell className="w-5 h-5" />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </Link>

                                    {/* Theme toggle - hidden on mobile, visible md+ */}
                                    <button onClick={toggleTheme} className="icon-btn hidden md:inline-flex">
                                        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                    </button>

                                    {/* Create button - hidden on mobile (BottomNav), visible lg+ */}
                                    <Link to="/create-post" className="hidden lg:block">
                                        <Button size="sm" className="gap-2 shadow-none">
                                            <PlusCircle className="w-4 h-4" />
                                            <span>Create</span>
                                        </Button>
                                    </Link>

                                    {/* Profile always visible */}
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
                                                    className="absolute right-0 top-full mt-2 w-64 bg-card rounded-2xl border border-card-border shadow-lg overflow-hidden"
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
                                    {/* Theme toggle - hidden on mobile, visible md+ */}
                                    <button onClick={toggleTheme} className="icon-btn hidden md:inline-flex">
                                        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                    </button>
                                    <Button variant="outline" size="sm" onClick={handleGoogleLogin} className="hidden md:inline-flex">
                                        Sign in
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

            </motion.nav>

            {typeof document !== 'undefined' ? createPortal(mobileDrawer, document.body) : null}
            <ChatDrawer isOpen={isChatDrawerOpen} onClose={() => setIsChatDrawerOpen(false)} />
        </>
    );
};

export default Navbar;
