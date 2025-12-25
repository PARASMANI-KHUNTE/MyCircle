import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X, MessageSquare, Heart, UserPlus } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const toast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const value = {
        toast,
        success: (msg, duration) => toast(msg, 'success', duration),
        error: (msg, duration) => toast(msg, 'error', duration),
        warning: (msg, duration) => toast(msg, 'warning', duration),
        info: (msg, duration) => toast(msg, 'info', duration),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence mode='popLayout'>
                    {toasts.map(({ id, message, type }) => (
                        <Toast key={id} message={message} type={type} onClose={() => removeToast(id)} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

const Toast = ({ message, type, onClose }) => {
    // Icon mapping
    const icons = {
        success: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
        error: <XCircle className="w-4 h-4 text-red-500" />,
        warning: <AlertTriangle className="w-4 h-4 text-amber-500" />,
        info: <Info className="w-4 h-4 text-blue-500" />,
        message: <MessageSquare className="w-4 h-4 text-indigo-500" />,
        like: <Heart className="w-4 h-4 text-rose-500" />,
        request: <UserPlus className="w-4 h-4 text-orange-500" />
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="pointer-events-auto w-full max-w-sm"
        >
            <div className="flex items-center gap-3 w-full bg-zinc-950 border border-zinc-800 shadow-xl shadow-black/20 rounded-lg p-3 pr-4">
                
                {/* Icon Container with subtle glow background based on type (Optional) */}
                <div className="shrink-0">
                    {icons[type] || icons.info}
                </div>

                {/* Message */}
                <p className="text-sm font-medium text-zinc-100 flex-1 leading-snug">
                    {message}
                </p>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-md hover:bg-zinc-800"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
};