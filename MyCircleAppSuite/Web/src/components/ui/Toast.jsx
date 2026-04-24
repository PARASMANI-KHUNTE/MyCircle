import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X, MessageCircle, Heart, UserPlus } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const toast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random();
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
            {/* z-toast = 40 per our z-index scale */}
            <div className="fixed top-4 right-4 z-[40] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full">
                <AnimatePresence mode="popLayout">
                    {toasts.map(({ id, message, type }) => (
                        <ToastItem key={id} message={message} type={type} onClose={() => removeToast(id)} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

const configs = {
    success: {
        icon: CheckCircle2,
        containerClass: 'bg-card border-success/30 shadow-lg',
        iconClass: 'text-success',
        accent: 'bg-success',
    },
    error: {
        icon: XCircle,
        containerClass: 'bg-card border-error/30 shadow-lg',
        iconClass: 'text-error',
        accent: 'bg-error',
    },
    warning: {
        icon: AlertTriangle,
        containerClass: 'bg-card border-warning/30 shadow-lg',
        iconClass: 'text-warning',
        accent: 'bg-warning',
    },
    info: {
        icon: Info,
        containerClass: 'bg-card border-info/30 shadow-lg',
        iconClass: 'text-info',
        accent: 'bg-info',
    },
    message: {
        icon: MessageCircle,
        containerClass: 'bg-card border-primary/30 shadow-lg',
        iconClass: 'text-primary',
        accent: 'bg-primary',
    },
    like: {
        icon: Heart,
        containerClass: 'bg-card border-pink-500/30 shadow-lg',
        iconClass: 'text-pink-500',
        accent: 'bg-pink-500',
    },
    request: {
        icon: UserPlus,
        containerClass: 'bg-card border-secondary/30 shadow-lg',
        iconClass: 'text-secondary',
        accent: 'bg-secondary',
    },
};

const ToastItem = ({ message, type, onClose }) => {
    const config = configs[type] || configs.info;
    const Icon = config.icon;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 64, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 64, scale: 0.92 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={`relative overflow-hidden rounded-2xl border pointer-events-auto ${config.containerClass}`}
            style={{ boxShadow: 'var(--shadow-lg)' }}
        >
            {/* Left accent stripe */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${config.accent}`} />

            <div className="flex items-start gap-3 p-4 pl-5">
                <div className={`shrink-0 mt-0.5 ${config.iconClass}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-foreground leading-relaxed flex-1 min-w-0 pr-6">
                    {message}
                </p>
            </div>

            {/* Close button — proper 44px touch target */}
            <button
                onClick={onClose}
                aria-label="Dismiss notification"
                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-xl text-foreground-muted hover:text-foreground hover:bg-card-hover transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
};
