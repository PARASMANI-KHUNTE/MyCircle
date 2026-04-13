import React from 'react';
import Navbar from './Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const pageVariants = {
    initial: {
        opacity: 0,
        y: 20,
    },
    in: {
        opacity: 1,
        y: 0,
    },
    out: {
        opacity: 0,
        y: -20,
    },
};

const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.4,
};

const Layout = ({ children }) => {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-background relative">
            {/* Background Gradient Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute top-1/3 -right-40 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
            </div>

            {/* Top Accent Line */}
            <div className="fixed top-0 left-0 right-0 h-1 z-[60]">
                <div className="h-full bg-gradient-to-r from-primary via-secondary to-accent" />
            </div>

            <Navbar />

            <main className="pt-16 md:pt-20 min-h-screen relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial="initial"
                        animate="in"
                        exit="out"
                        variants={pageVariants}
                        transition={pageTransition}
                        className="container mx-auto px-4 sm:px-6 lg:px-8 pb-20"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default Layout;
