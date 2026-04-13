import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getSocketBaseUrl } from '../utils/api';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) throw new Error('useSocket must be used within SocketProvider');
    return context;
};

export const SocketProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!user) {
            return;
        }

        const serverURL = getSocketBaseUrl();

        // Connect to Socket.io server
        const newSocket = io(serverURL, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            auth: { token: token || localStorage.getItem('token') }
        });

        newSocket.on('connect', () => {
            setConnected(true);
        });

        newSocket.on('disconnect', () => {
            setConnected(false);
        });

        newSocket.on('connect_error', () => {
            setConnected(false);
        });

        // Reconnection lifecycle events (socket.io v4)
        newSocket.io.on('reconnect_attempt', () => {});
        newSocket.io.on('reconnect', () => {});
        newSocket.io.on('reconnect_error', () => {});
        newSocket.io.on('reconnect_failed', () => {
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
    }, [user, token]);

    const value = {
        socket: user ? socket : null,
        connected: user ? connected : false
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
