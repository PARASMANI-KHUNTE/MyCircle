import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, ArrowLeft, Home } from 'lucide-react';
import Button from '../components/ui/Button';

const NotFound = () => {
    return (
        <div className="min-h-[90vh] flex flex-col items-center justify-center text-center px-6">
            {/* Ambient blobs */}
            <div aria-hidden="true" className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, rgb(245 158 11), transparent 70%)' }} />
            <div aria-hidden="true" className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, rgb(16 185 129), transparent 70%)' }} />

            {/* Big number backdrop */}
            <div className="relative mb-8">
                <div className="text-[10rem] sm:text-[14rem] font-black text-foreground/5 select-none leading-none tracking-tight">
                    404
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-24 h-24 rounded-3xl bg-primary flex items-center justify-center shadow-2xl"
                        style={{ boxShadow: '0 16px 48px rgb(245 158 11 / 0.35)' }}
                    >
                        <Compass className="text-primary-foreground w-11 h-11" />
                    </motion.div>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
            >
                <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight mb-3">
                    Lost in the Circle?
                </h1>
                <p className="text-foreground-muted max-w-md mx-auto mb-10 leading-relaxed">
                    The page you're looking for has drifted away or never existed in this circle.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link to="/">
                        <Button size="lg" className="gap-2">
                            <Home className="w-4 h-4" />
                            Back to Home
                        </Button>
                    </Link>
                    <Link to="/explore">
                        <Button variant="outline" size="lg" className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Explore Feed
                        </Button>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default NotFound;
