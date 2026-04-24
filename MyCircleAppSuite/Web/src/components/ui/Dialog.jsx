import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
};

const Dialog = ({ isOpen, onClose, title, description, children, actions, size = 'md' }) => {
    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop — z-modal(30) */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[30]"
                        aria-hidden="true"
                    />

                    {/* Dialog container */}
                    <div
                        className="fixed inset-0 z-[30] flex items-center justify-center p-4"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="dialog-title"
                    >
                        <motion.div
                            key="dialog"
                            initial={{ opacity: 0, scale: 0.94, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94, y: 16 }}
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                            className={`relative w-full ${sizes[size]} bg-card rounded-2xl border border-card-border overflow-hidden`}
                            style={{ boxShadow: 'var(--shadow-2xl)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4 p-6 pb-4 border-b border-card-border">
                                <div>
                                    <h2
                                        id="dialog-title"
                                        className="text-lg font-semibold text-foreground leading-tight font-display"
                                    >
                                        {title}
                                    </h2>
                                    {description && (
                                        <p className="text-sm text-foreground-muted mt-1 leading-relaxed">
                                            {description}
                                        </p>
                                    )}
                                </div>
                                {/* 44px close target */}
                                <button
                                    onClick={onClose}
                                    aria-label="Close dialog"
                                    className="shrink-0 -mt-1 -mr-1 w-9 h-9 flex items-center justify-center rounded-xl text-foreground-muted hover:text-foreground hover:bg-card-hover transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                {children}
                            </div>

                            {/* Actions */}
                            {actions && (
                                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-card-border bg-background-secondary/50">
                                    {actions}
                                </div>
                            )}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default Dialog;
