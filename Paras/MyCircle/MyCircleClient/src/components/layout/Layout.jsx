import React from 'react';
import Navbar from './Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
    const location = useLocation();
    const isHome = location.pathname === '/';
    const isFeed = location.pathname === '/feed';
    const isPostDetails = location.pathname.startsWith('/post/');
    const isDashboard = location.pathname === '/dashboard';

    if (isHome || isPostDetails || isDashboard) {
        return children;
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Background Gradients */}
            <div className="fixed top-[-20%] right-[-10%] w-[500px] h-[500px] bg-primary/20 blur-[128px] rounded-full pointer-events-none" />
            <div className="fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-accent/10 blur-[128px] rounded-full pointer-events-none" />

            <Navbar />

            <main className="pt-24 min-h-[calc(100vh-6rem)]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="container mx-auto px-6 pb-12"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default Layout;
