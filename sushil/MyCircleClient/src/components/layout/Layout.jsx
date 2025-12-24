import React from 'react';
import Navbar from './Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';

const Layout = ({ children }) => {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Background Gradients */}
            <div className="fixed top-[-20%] right-[-10%] w-[500px] h-[500px] bg-primary/20 blur-[128px] rounded-full pointer-events-none" />
            <div className="fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-accent/10 blur-[128px] rounded-full pointer-events-none" />

            <Navbar />

            <main className={cn(
                "min-h-[calc(100vh-6rem)]",
                location.pathname === "/" ? "pt-0" : "pt-24"
            )}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className={cn(
                            "pb-12 w-full",
                            location.pathname !== "/" && "container mx-auto px-6"
                        )}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default Layout;
