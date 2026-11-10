import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { 
    X, 
    Menu, 
    User, 
    Settings, 
    LogOut, 
    Sun, 
    Moon, 
    Plus, 
    MessageCircle, 
    Bell, 
    Wallet,
    Compass,
    Sparkles,
    FileText,
    Inbox
} from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getAvatarUrl } from '../../utils/avatar';
import { useNotifications } from '../../context/NotificationContext';

const Navbar = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const { toggleTheme, isDark } = useTheme();
    const { unreadCount = 0 } = useNotifications() || {};
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();

    // Close any open menus when navigating
    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsProfileDropdownOpen(false);
    }, [location.pathname]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsProfileDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navLinks = [
        { name: 'Explore', path: '/explore', icon: Compass },
        { name: 'Requests', path: '/requests', icon: Inbox, auth: true },
        { name: 'My Posts', path: '/my-posts', icon: FileText, auth: true },
        { name: 'Wallet & Orders', path: '/wallet', icon: Wallet, auth: true },
    ];

    const visibleLinks = navLinks.filter((link) => !link.auth || !!user);

    const mobileDrawer = (
        <div
            id="mobile-nav-drawer"
            className="fixed top-0 left-0 bottom-0 z-[1210] w-[min(84vw,19rem)] md:hidden bg-card border-r border-card-border shadow-2xl flex flex-col"
        >
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-card-border">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs tracking-wider">
                        C
                    </div>
                    <span className="text-base font-semibold tracking-tight font-display text-foreground">
                        MyCircle
                    </span>
                </Link>
                <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="icon-btn -mr-1"
                    aria-label="Close navigation"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
                {visibleLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.path || (link.path === '/explore' && location.pathname === '/');
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors',
                                isActive
                                    ? 'bg-secondary text-foreground font-semibold'
                                    : 'text-foreground-muted hover:text-foreground hover:bg-card-hover'
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {link.name}
                        </Link>
                    );
                })}

                {isAuthenticated && (
                    <>
                        <div className="pt-2 pb-1 px-3.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">Account</span>
                        </div>
                        <Link
                            to="/chat"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-foreground-muted hover:text-foreground hover:bg-card-hover"
                        >
                            <MessageCircle className="w-4 h-4" />
                            Messages
                        </Link>
                        <Link
                            to="/notifications"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-foreground-muted hover:text-foreground hover:bg-card-hover"
                        >
                            <div className="flex items-center gap-3">
                                <Bell className="w-4 h-4" />
                                Notifications
                            </div>
                            {unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                                    {unreadCount}
                                </span>
                            )}
                        </Link>
                        <Link
                            to="/profile"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-foreground-muted hover:text-foreground hover:bg-card-hover"
                        >
                            <User className="w-4 h-4" />
                            Profile
                        </Link>
                        <Link
                            to="/settings"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-foreground-muted hover:text-foreground hover:bg-card-hover"
                        >
                            <Settings className="w-4 h-4" />
                            Settings
                        </Link>
                    </>
                )}
            </div>

            {/* Mobile Footer */}
            <div className="p-3 border-t border-card-border space-y-2">
                <div className="flex items-center justify-between px-2">
                    <span className="text-xs text-foreground-muted font-medium">Theme</span>
                    <button
                        onClick={toggleTheme}
                        className="p-1.5 rounded-lg border border-card-border bg-card hover:bg-card-hover text-foreground-muted hover:text-foreground"
                    >
                        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                </div>

                {isAuthenticated ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setIsMobileMenuOpen(false);
                            logout();
                        }}
                        className="w-full justify-start text-xs text-error hover:bg-error/10 hover:text-error"
                    >
                        <LogOut className="w-3.5 h-3.5 mr-2" />
                        Sign Out
                    </Button>
                ) : (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                        <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
                            Sign In
                        </Button>
                        <Button size="sm" onClick={() => navigate('/register')}>
                            Get Started
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <>
            <nav className="fixed inset-x-0 top-0 z-[1100] h-14 border-b border-card-border/80 bg-background/85 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
                    {/* Left: Brand & Mobile Trigger */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="icon-btn md:hidden"
                            aria-label="Toggle menu"
                        >
                            <Menu className="w-4 h-4" />
                        </button>

                        <Link to="/" className="flex items-center gap-2.5 group">
                            <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs tracking-wider transition-transform group-hover:scale-105">
                                C
                            </div>
                            <span className="text-base font-semibold tracking-tight font-display text-foreground hidden sm:block">
                                MyCircle
                            </span>
                        </Link>
                    </div>

                    {/* Center: Desktop Navigation Segment */}
                    <div className="hidden md:flex items-center gap-1 bg-secondary/60 border border-card-border/60 p-1 rounded-xl">
                        {visibleLinks.map((link) => {
                            const isActive = location.pathname === link.path || (link.path === '/explore' && location.pathname === '/');
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={cn(
                                        'px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                                        isActive
                                            ? 'bg-card text-foreground font-semibold shadow-sm border border-card-border/80'
                                            : 'text-foreground-muted hover:text-foreground hover:bg-card/40'
                                    )}
                                >
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5">
                        {isAuthenticated ? (
                            <>
                                <Link
                                    to="/chat"
                                    className="icon-btn relative hidden sm:inline-flex"
                                    aria-label="Messages"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                </Link>

                                <Link
                                    to="/notifications"
                                    className="icon-btn relative hidden sm:inline-flex"
                                    aria-label="Notifications"
                                >
                                    <Bell className="w-4 h-4" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-background" />
                                    )}
                                </Link>

                                <button
                                    onClick={toggleTheme}
                                    className="icon-btn hidden sm:inline-flex"
                                    aria-label="Toggle theme"
                                >
                                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                </button>

                                <Link to="/create-post" className="hidden sm:block ml-1">
                                    <Button size="sm" className="gap-1.5 text-xs font-semibold">
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Create</span>
                                    </Button>
                                </Link>

                                {/* Profile Dropdown */}
                                <div className="relative ml-1" ref={dropdownRef}>
                                    <button
                                        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                        className="rounded-full ring-1 ring-card-border p-0.5 hover:ring-primary/40 transition-all"
                                        aria-label="User menu"
                                    >
                                        <img
                                            src={getAvatarUrl(user)}
                                            alt={user?.displayName || 'User'}
                                            className="w-7 h-7 rounded-full object-cover"
                                        />
                                    </button>

                                    {isProfileDropdownOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-56 bg-card rounded-2xl border border-card-border shadow-xl overflow-hidden py-1 z-50">
                                            <div className="px-3.5 py-2.5 border-b border-card-border">
                                                <p className="text-xs font-semibold text-foreground truncate">{user?.displayName}</p>
                                                <p className="text-[11px] text-foreground-muted truncate">{user?.email}</p>
                                            </div>
                                            <div className="p-1 space-y-0.5">
                                                <Link
                                                    to="/profile"
                                                    onClick={() => setIsProfileDropdownOpen(false)}
                                                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-foreground-muted hover:text-foreground hover:bg-card-hover transition-colors"
                                                >
                                                    <User className="w-3.5 h-3.5" />
                                                    <span>Profile</span>
                                                </Link>
                                                <Link
                                                    to="/wallet"
                                                    onClick={() => setIsProfileDropdownOpen(false)}
                                                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-foreground-muted hover:text-foreground hover:bg-card-hover transition-colors"
                                                >
                                                    <Wallet className="w-3.5 h-3.5" />
                                                    <span>Wallet &amp; Orders</span>
                                                </Link>
                                                <Link
                                                    to="/settings"
                                                    onClick={() => setIsProfileDropdownOpen(false)}
                                                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-foreground-muted hover:text-foreground hover:bg-card-hover transition-colors"
                                                >
                                                    <Settings className="w-3.5 h-3.5" />
                                                    <span>Settings</span>
                                                </Link>
                                            </div>
                                            <div className="p-1 border-t border-card-border">
                                                <button
                                                    onClick={() => {
                                                        setIsProfileDropdownOpen(false);
                                                        logout();
                                                    }}
                                                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-error hover:bg-error/10 transition-colors w-full"
                                                >
                                                    <LogOut className="w-3.5 h-3.5" />
                                                    <span>Sign out</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={toggleTheme}
                                    className="icon-btn"
                                    aria-label="Toggle theme"
                                >
                                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                </button>
                                <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="text-xs">
                                    Sign In
                                </Button>
                                <Button size="sm" onClick={() => navigate('/register')} className="text-xs">
                                    Get Started
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {isMobileMenuOpen && typeof document !== 'undefined'
                ? createPortal(
                    <>
                        <button
                            type="button"
                            aria-label="Close menu"
                            className="fixed inset-0 z-[1200] bg-black/40 backdrop-blur-xs md:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        {mobileDrawer}
                    </>,
                    document.body
                )
                : null}
        </>
    );
};

export default Navbar;
