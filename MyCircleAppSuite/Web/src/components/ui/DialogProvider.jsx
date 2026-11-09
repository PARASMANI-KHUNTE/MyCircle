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
                return <HelpCircle className="w-12 h-12 text-warning" />;
            case 'alert':
                return <AlertCircle className="w-12 h-12 text-info" />;
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
                        className="fixed inset-0 bg-black/70 z-[9998]"
                    />
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md rounded-2xl border border-card-border bg-card p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={handleCancel}
                                className="absolute top-4 right-4 text-foreground-muted hover:text-foreground transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            {type !== 'prompt' && (
                                <div className="flex justify-center mb-4">
                                    {getIcon()}
                                </div>
                            )}
                            <h2 className="text-lg font-semibold text-foreground text-center mb-2">{title}</h2>
                            <p className="text-sm text-foreground-secondary text-center mb-6 leading-relaxed">{message}</p>
                            {type === 'prompt' && (
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    className="input-modern mb-6"
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
