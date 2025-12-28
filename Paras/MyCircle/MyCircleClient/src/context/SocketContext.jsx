import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) throw new Error('useSocket must be used within SocketProvider');
    return context;
};

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!user) {
            // Disconnect if user logs out
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setConnected(false);
            }
            return;
        }

        const isProduction = import.meta.env.PROD;
        const serverURL = isProduction
            ? (import.meta.env.VITE_API_URL || '')
            : (import.meta.env.VITE_API_URL_DEV || '');

        if (isProduction && !serverURL) {
            throw new Error('VITE_API_URL is not set. Please configure it in your web .env file.');
        }

        if (!isProduction && !serverURL) {
            throw new Error('VITE_API_URL_DEV is not set. Please configure it in your web .env file.');
        }

        // Connect to Socket.io server
        const newSocket = io(serverURL, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
            setConnected(true);
            // Join user's personal room
            newSocket.emit('join', user._id || user.id);
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            setConnected(false);
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket connect_error:', err?.message || err);
            setConnected(false);
        });

        // Reconnection lifecycle events (socket.io v4)
        newSocket.io.on('reconnect_attempt', (attempt) => {
            console.log('Socket reconnect_attempt:', attempt);
        });
        newSocket.io.on('reconnect', (attempt) => {
            console.log('Socket reconnect:', attempt);
        });
        newSocket.io.on('reconnect_error', (err) => {
            console.error('Socket reconnect_error:', err?.message || err);
        });
        newSocket.io.on('reconnect_failed', () => {
            console.error('Socket reconnect_failed');
            setConnected(false);
        });


        setSocket(newSocket);

        return () => {
            newSocket.off('connect_error');
            newSocket.disconnect();
            newSocket.io.off('reconnect_attempt');
            newSocket.io.off('reconnect');
            newSocket.io.off('reconnect_error');
            newSocket.io.off('reconnect_failed');
        };
    }, [user]);

    const value = {
        socket,
        connected
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
