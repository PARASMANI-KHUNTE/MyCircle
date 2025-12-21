import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, PlusCircle, MessageCircle } from 'lucide-react';
import Button from '../ui/Button';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';
import { getAvatarUrl } from '../../utils/avatar';
import { useNotifications } from '../../context/NotificationContext';
import ChatDrawer from '../chat/ChatDrawer';

const Navbar = () => {

    const { user, login, isAuthenticated } = useAuth();
    const { unreadCount } = useNotifications();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
    const location = useLocation();

    // Google OAuth Login Handler
    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:5000/auth/google';
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
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
                    <span className="text-xl font-bold font-display tracking-tight text-white group-hover:text-primary transition-colors">
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
                                location.pathname === link.path ? 'text-white' : 'text-gray-400'
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
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors relative"
                                title="Messages"
                            >
                                <MessageCircle className="w-5 h-5" />
                                {/* Optional: Add unread message badge here if available */}
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
                                    className="text-gray-300 hover:text-white py-2 flex items-center gap-2"
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
