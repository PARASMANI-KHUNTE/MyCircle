import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Rocket, PlusCircle } from 'lucide-react';
import Button from '../ui/Button';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {

    const { user, login, isAuthenticated } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <Rocket className="text-white w-5 h-5 group-hover:animate-pulse" />
                    </div>
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
                                'text-sm font-medium transition-colors hover:text-primary',
                                location.pathname === link.path ? 'text-white' : 'text-gray-400'
                            )}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-4">
                    {isAuthenticated ? (
                        <>
                            <Link to="/create-post">
                                <Button variant="primary" className="pl-3 pr-4">
                                    <PlusCircle className="w-4 h-4" />
                                    <span>Post</span>
                                </Button>
                            </Link>
                            <Link to="/profile">
                                <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden border border-white/10 hover:border-primary transition-colors cursor-pointer">
                                    <img
                                        src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
                                        alt="User"
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
        </motion.nav>
    );
};

export default Navbar;
