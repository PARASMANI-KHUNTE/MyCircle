import React from 'react';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

const Layout = () => {
    const location = useLocation();
    const isExplorePage = location.pathname === '/' || location.pathname === '/explore';

    return (
        <div className="min-h-screen bg-background relative overflow-x-clip">
            <main className="min-h-screen relative pt-16 md:pt-20 overflow-x-clip">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial="initial"
                        animate="in"
                        exit="out"
                        variants={{
                            initial: { opacity: 0, y: 20 },
                            in: { opacity: 1, y: 0 },
                            out: { opacity: 0, y: -20 },
                        }}
                        className={cn(
                            'container mx-auto px-0 sm:px-6 lg:px-8 pb-0',
                            !isExplorePage && 'pt-0 md:pt-8'
                        )}
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>

            <Navbar />

            <BottomNav />
        </div>
    );
};

export default Layout;
