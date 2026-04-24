import React from 'react';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';

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

const Layout = () => {
    const location = useLocation();
    const isExplorePage = location.pathname === '/' || location.pathname === '/explore';

    return (
        <div className="min-h-screen bg-background relative">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute top-1/3 -right-40 w-96 h-96 bg-foreground/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
            </div>

            <div className="fixed top-0 left-0 right-0 h-px z-[60] bg-card-border/70" />

            <div className="fixed top-0 left-0 right-0 h-16 md:h-20 z-[45] pointer-events-none">
                <div className="h-full bg-gradient-to-b from-background to-transparent" />
            </div>

            <Navbar />

            <main className="min-h-screen relative pt-16 md:pt-20">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial="initial"
                        animate="in"
                        exit="out"
                        variants={pageVariants}
                        transition={pageTransition}
                        className={cn(
                            'container mx-auto px-4 sm:px-6 lg:px-8 pb-24',
                            !isExplorePage && 'pt-3'
                        )}
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>

            <BottomNav />
        </div>
    );
};

export default Layout;
