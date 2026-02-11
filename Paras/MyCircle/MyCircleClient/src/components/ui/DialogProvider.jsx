import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, HelpCircle, X } from 'lucide-react';
import Button from './Button';
import { DialogProvider as DialogContextProvider, useDialog } from '../../hooks/useDialog';

const DialogUI = () => {
    const { isOpen, type, title, message, onConfirm, onCancel, confirmText, cancelText, inputValue, setInputValue, closeDialog } = useDialog();

    const handleConfirm = () => {
        if (onConfirm) onConfirm();
    };

    const handleCancel = () => {
        if (onCancel) onCancel();
        else closeDialog();
    };

    const getIcon = () => {
        switch (type) {
            case 'confirm':
                return <HelpCircle className="w-12 h-12 text-yellow-500" />;
            case 'alert':
                return <AlertCircle className="w-12 h-12 text-blue-500" />;
            default:
                return null;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleCancel}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]"
                    />
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="glass-panel w-full max-w-md p-10 relative shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={handleCancel}
                                className="absolute top-6 right-6 text-text-muted hover:text-text-heading transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            {type !== 'prompt' && (
                                <div className="flex justify-center mb-4">
                                    {getIcon()}
                                </div>
                            )}
                            <h2 className="text-2xl font-black text-text-heading text-center mb-3 uppercase tracking-tight">{title}</h2>
                            <p className="text-text-body text-center mb-8 font-medium leading-relaxed">{message}</p>
                            {type === 'prompt' && (
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    className="w-full bg-card/10 border border-card-border rounded-xl px-4 py-3 text-text-heading mb-8 focus:outline-none focus:border-primary/50 shadow-inner"
                                    autoFocus
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') handleConfirm();
                                    }}
                                />
                            )}
                            <div className="flex gap-3">
                                {type !== 'alert' && (
                                    <Button variant="outline" className="flex-1" onClick={handleCancel}>
                                        {cancelText}
                                    </Button>
                                )}
                                <Button variant="primary" className={type === 'alert' ? 'w-full' : 'flex-1'} onClick={handleConfirm}>
                                    {confirmText}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

const DialogProvider = ({ children }) => {
    return (
        <DialogContextProvider>
            {children}
            <DialogUI />
        </DialogContextProvider>
    );
};

export default DialogProvider;
