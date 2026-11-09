import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { CircleDot, X, Menu, User, Settings, LogOut, Sun, Moon, PlusCircle, MessageCircle, Bell } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getAvatarUrl } from '../../utils/avatar';
import { useNotifications } from '../../context/NotificationContext';

const Navbar = () => {
    const { user, isAuthenticated, logout, login } = useAuth();
    const { toggleTheme, isDark } = useTheme();
    const { unreadCount = 0 } = useNotifications() || {};
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const location = useLocation();

    const handleGoogleLogin = () => {
        login();
    };

    const navLinks = [
        { name: 'Requests', path: '/requests', auth: true },
        { name: 'My Posts', path: '/my-posts', auth: true },
    ];

    const visibleLinks = navLinks.filter((link) => !link.auth || !!user);

    const mobileDrawer = (
        <div
            id="mobile-nav-drawer"
            className="fixed top-0 left-0 bottom-0 z-[1210] w-[min(84vw,20rem)] md:hidden bg-background border-r border-card-border"
        >
            <div className="flex h-full flex-col">
                <div className="flex items-center justify-between px-4 py-4 border-b border-card-border">
                    <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 group">
                        <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
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
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                            location.pathname === '/' ? 'text-foreground bg-card border border-card-border' : 'text-foreground-muted hover:text-foreground hover:bg-card-hover'
                        )}
                    >
                        <CircleDot className="w-5 h-5" />
                        Home
                    </Link>

                    {visibleLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                                location.pathname === link.path
                                    ? 'text-foreground bg-card border border-card-border'
                                    : 'text-foreground-muted hover:text-foreground hover:bg-card-hover'
                            )}
                        >
                            {link.name}
                        </Link>
                    ))}

                    {isAuthenticated ? (
                        <>
                            <Link
                                to="/chat"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-card-hover transition-colors"
                            >
                                <MessageCircle className="w-5 h-5" />
                                Messages
                            </Link>
                            <Link
                                to="/notifications"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-card-hover transition-colors"
                            >
                                <Bell className="w-5 h-5" />
                                Notifications
                                {unreadCount > 0 && (
                                    <span className="ml-auto min-w-[20px] h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center px-1.5">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </Link>
                            <Link
                                to="/profile"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-card-hover transition-colors"
                            >
                                <User className="w-5 h-5" />
                                Profile
                            </Link>
                            <Link
                                to="/settings"
                                onClick={() => setIsMobileMenuOpen(false)}
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
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    logout();
                                }}
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
        </div>
    );

    return (
        <>
            <nav
                className="fixed top-0 left-0 right-0 z-[1100] transition-all duration-300 bg-background/70 border-b border-transparent backdrop-blur-md"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="icon-btn md:hidden"
                                aria-label="Toggle navigation menu"
                            >
                                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>

                            <Link to="/" className="hidden md:flex items-center gap-3 group">
                                <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
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
                                        'relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                                        location.pathname === link.path
                                            ? 'text-primary bg-primary/10 border border-primary/20'
                                            : 'text-foreground-muted hover:text-foreground hover:bg-card-hover'
                                    )}
                                >
                                    {link.name}
                                    {location.pathname === link.path && (
                                        <span
                                            className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 w-7 h-0.5 bg-primary rounded-full"
                                        />
                                    )}
                                </Link>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            {isAuthenticated ? (
                                <>
                                    <Link
                                        to="/chat"
                                        className="icon-btn relative hidden lg:inline-flex"
                                        aria-label="Open messages"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                    </Link>

                                    <Link
                                        to="/notifications"
                                        className="icon-btn relative hidden lg:inline-flex"
                                        aria-label="Notifications"
                                    >
                                        <Bell className="w-5 h-5" />
                                        {unreadCount > 0 && (
                                            <span
                                                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-0.5"
                                            >
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </Link>

                                    <button onClick={toggleTheme} className="icon-btn hidden md:inline-flex">
                                        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                    </button>

                                    <Link to="/create-post" className="hidden lg:block">
                                        <Button size="sm" className="gap-2">
                                            <PlusCircle className="w-4 h-4" />
                                            <span>Create</span>
                                        </Button>
                                    </Link>

                                    <div className="relative" ref={dropdownRef}>
                                        <button
                                            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                            className="rounded-full avatar-ring"
                                        >
                                            <img
                                                src={getAvatarUrl(user)}
                                                alt={user?.displayName || 'Profile'}
                                                className="w-9 h-9 rounded-full object-cover"
                                            />
                                        </button>

                                        {isProfileDropdownOpen && (
                                            <div
                                                className="absolute right-0 top-full mt-2 w-64 bg-card rounded-2xl border border-card-border overflow-hidden shadow-lg"
                                            >
                                                <div className="p-4 border-b border-card-border">
                                                    <p className="font-semibold text-foreground">{user?.displayName}</p>
                                                    <p className="text-sm text-foreground-muted truncate">{user?.email}</p>
                                                </div>
                                                <div className="p-2">
                                                    <Link
                                                        to="/profile"
                                                        onClick={() => setIsProfileDropdownOpen(false)}
                                                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-card-hover transition-colors"
                                                    >
                                                        <User className="w-4 h-4 text-foreground-muted" />
                                                        <span className="text-sm font-medium">Profile</span>
                                                    </Link>
                                                    <Link
                                                        to="/settings"
                                                        onClick={() => setIsProfileDropdownOpen(false)}
                                                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-card-hover transition-colors"
                                                    >
                                                        <Settings className="w-4 h-4 text-foreground-muted" />
                                                        <span className="text-sm font-medium">Settings</span>
                                                    </Link>
                                                </div>
                                                <div className="p-2 border-t border-card-border">
                                                    <button
                                                        onClick={() => {
                                                            setIsProfileDropdownOpen(false);
                                                            logout();
                                                        }}
                                                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-error/10 text-error transition-colors w-full"
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        <span className="text-sm font-medium">Sign out</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
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
            </nav>

            {typeof document !== 'undefined' ? createPortal(mobileDrawer, document.body) : null}
        </>
    );
};

export default Navbar;
