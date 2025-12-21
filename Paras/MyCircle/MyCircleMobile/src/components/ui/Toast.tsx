import React, { createContext, useContext } from 'react';
import Toast from 'react-native-toast-message';

interface ToastContextType {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    const success = (message: string) => {
        Toast.show({
            type: 'success',
            text1: 'Success',
            text2: message,
            position: 'top',
            visibilityTime: 3000,
        });
    };

    const error = (message: string) => {
        Toast.show({
            type: 'error',
            text1: 'Error',
            text2: message,
            position: 'top',
            visibilityTime: 4000,
        });
    };

    const warning = (message: string) => {
        Toast.show({
            type: 'info',
            text1: 'Warning',
            text2: message,
            position: 'top',
            visibilityTime: 3000,
        });
    };

    const info = (message: string) => {
        Toast.show({
            type: 'info',
            text1: 'Info',
            text2: message,
            position: 'top',
            visibilityTime: 3000,
        });
    };

    const value = { success, error, warning, info };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <Toast />
        </ToastContext.Provider>
    );
};
