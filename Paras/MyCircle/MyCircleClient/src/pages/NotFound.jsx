import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search, ArrowLeft, AlertCircle } from 'lucide-react';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* Simple Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
                            <span className="text-xl">M</span>
                        </div>
                        MyCircle.
                    </div>
                </div>
            </nav>

            {/* 404 Content */}
            <div className="min-h-screen flex items-center justify-center px-6 pt-20">
                <div className="container mx-auto max-w-2xl text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        {/* 404 Number with Icon */}
                        <div className="relative mb-12">
                            <div className="text-[10rem] md:text-[12rem] font-bold text-slate-100 select-none leading-none">
                                404
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-slate-900 flex items-center justify-center shadow-2xl">
                                    <AlertCircle className="text-white w-10 h-10 md:w-12 md:h-12" />
                                </div>
                            </div>
                        </div>

                        {/* Heading */}
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                            Page Not Found
                        </h1>

                        {/* Description */}
                        <p className="text-slate-500 text-lg md:text-xl max-w-md mx-auto mb-12 leading-relaxed">
                            The page you're looking for doesn't exist or has been moved.
                        </p>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => navigate('/')}
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-black text-white rounded-full text-sm font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-black/20"
                            >
                                <Home size={18} />
                                Back to Home
                            </button>
                            <button
                                onClick={() => navigate('/feed')}
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-full text-sm font-semibold border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all"
                            >
                                <Search size={18} />
                                Explore Feed
                            </button>
                        </div>

                        {/* Optional: Helpful Links */}
                        <div className="mt-16 pt-8 border-t border-slate-100">
                            <p className="text-sm text-slate-400 mb-4">Quick Links</p>
                            <div className="flex flex-wrap gap-4 justify-center text-sm">
                                <button onClick={() => navigate('/dashboard')} className="text-slate-600 hover:text-slate-900 transition-colors">
                                    Dashboard
                                </button>
                                <button onClick={() => navigate('/feed')} className="text-slate-600 hover:text-slate-900 transition-colors">
                                    Feed
                                </button>
                                <button onClick={() => navigate('/')} className="text-slate-600 hover:text-slate-900 transition-colors">
                                    Home
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
