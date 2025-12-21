import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

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
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map(({ id, message, type }) => (
                        <Toast key={id} message={message} type={type} onClose={() => removeToast(id)} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

const Toast = ({ message, type, onClose }) => {
    const icons = {
        success: <CheckCircle className="w-5 h-5" />,
        error: <XCircle className="w-5 h-5" />,
        warning: <AlertCircle className="w-5 h-5" />,
        info: <Info className="w-5 h-5" />
    };

    const colors = {
        success: 'bg-green-500/10 border-green-500/50 text-green-400',
        error: 'bg-red-500/10 border-red-500/50 text-red-400',
        warning: 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400',
        info: 'bg-blue-500/10 border-blue-500/50 text-blue-400'
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            className={`glass border ${colors[type]} rounded-xl p-4 pr-12 min-w-[300px] max-w-md pointer-events-auto relative`}
        >
            <div className="flex items-center gap-3">
                {icons[type]}
                <p className="text-sm font-medium text-white">{message}</p>
            </div>
            <button
                onClick={onClose}
                className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
};
