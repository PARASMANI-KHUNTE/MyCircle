import React, { createContext, useContext, useState } from 'react';

const DialogContext = createContext();

export const useDialog = () => {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error('useDialog must be used within DialogProvider');
    }
    return context;
};

export const DialogProvider = ({ children }) => {
    const [dialogState, setDialogState] = useState({
        isOpen: false,
        type: 'alert',
        title: '',
        message: '',
        onConfirm: null,
        onCancel: null,
        confirmText: 'OK',
        cancelText: 'Cancel',
        inputValue: ''
    });

    const openDialog = (config) => {
        setDialogState({
            isOpen: true,
            type: config.type || 'alert',
            title: config.title || '',
            message: config.message || '',
            onConfirm: config.onConfirm || null,
            onCancel: config.onCancel || null,
            confirmText: config.confirmText || 'OK',
            cancelText: config.cancelText || 'Cancel',
            inputValue: config.defaultValue || ''
        });
    };

    const closeDialog = () => {
        setDialogState(prev => ({
            ...prev,
            isOpen: false,
            onConfirm: null,
            onCancel: null
        }));
    };

    const setInputValue = (value) => {
        setDialogState(prev => ({ ...prev, inputValue: value }));
    };

    const alert = (message, title = 'Alert') => {
        return new Promise((resolve) => {
            openDialog({
                type: 'alert',
                title,
                message,
                onConfirm: () => {
                    closeDialog();
                    resolve(true);
                }
            });
        });
    };

    const confirm = (message, title = 'Confirm') => {
        return new Promise((resolve) => {
            openDialog({
                type: 'confirm',
                title,
                message,
                confirmText: 'Confirm',
                cancelText: 'Cancel',
                onConfirm: () => {
                    closeDialog();
                    resolve(true);
                },
                onCancel: () => {
                    closeDialog();
                    resolve(false);
                }
            });
        });
    };

    const prompt = (message, title = 'Input', defaultValue = '') => {
        return new Promise((resolve) => {
            openDialog({
                type: 'prompt',
                title,
                message,
                defaultValue,
                confirmText: 'Submit',
                cancelText: 'Cancel',
                onConfirm: () => {
                    const value = dialogState.inputValue;
                    closeDialog();
                    resolve(value);
                },
                onCancel: () => {
                    closeDialog();
                    resolve(null);
                }
            });
        });
    };

    const value = {
        ...dialogState,
        alert,
        confirm,
        prompt,
        closeDialog,
        setInputValue
    };

    return (
        <DialogContext.Provider value={value}>
            {children}
        </DialogContext.Provider>
    );
};
