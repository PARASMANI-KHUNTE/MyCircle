import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
    const [connectionError, setConnectionError] = useState(null);
    const socketRef = useRef(null);
    const connectAttempted = useRef(false);

    const cleanupSocket = useCallback((socketInstance) => {
        if (!socketInstance) return;
        socketInstance.off('connect');
        socketInstance.off('disconnect');
        socketInstance.off('connect_error');
        socketInstance.io?.off('reconnect_attempt');
        socketInstance.io?.off('reconnect');
        socketInstance.io?.off('reconnect_error');
        socketInstance.io?.off('reconnect_failed');
        socketInstance.disconnect();
    }, []);

    // Lazy connection - only connect when socket is actually needed
    const ensureConnected = useCallback(() => {
        if (!user || connectAttempted.current || socketRef.current) return;

        const serverURL = getSocketBaseUrl();
        connectAttempted.current = true;

        try {
            const newSocket = io(serverURL, {
                withCredentials: true,
                transports: ['polling', 'websocket'], // Try polling first to avoid WS errors in console
                reconnection: true,
                reconnectionAttempts: 3,
                reconnectionDelay: 1000,
                auth: { token: token || localStorage.getItem('token') },
                timeout: 3000,
                autoConnect: true,
            });

            newSocket.on('connect', () => {
                setConnected(true);
                setConnectionError(null);
            });

            newSocket.on('disconnect', (reason) => {
                setConnected(false);
                if (reason !== 'io client disconnect') {
                    setConnectionError('Disconnected');
                }
            });

            newSocket.on('connect_error', (err) => {
                setConnected(false);
                const isServerDown = err.message?.includes('ECONNREFUSED') ||
                    err.message?.includes('Connection refused') ||
                    err.message?.includes('xhr poll error') ||
                    err.message?.includes('websocket error');
                if (isServerDown) {
                    // Silent fail - server not running
                    setConnectionError(null);
                } else {
                    setConnectionError(err.message);
                }
            });

            newSocket.io?.on('reconnect_failed', () => {
                setConnected(false);
                setConnectionError('Reconnection failed');
            });

            socketRef.current = newSocket;
            setSocket(newSocket);
        } catch {
            setConnectionError('Failed to initialize socket');
        }
    }, [user, token]);

    // Auto-connect when user logs in (optional - can be removed for fully lazy)
    useEffect(() => {
        if (user) {
            // Small delay to let React settle
            const timer = setTimeout(ensureConnected, 100);
            return () => clearTimeout(timer);
        } else {
            cleanupSocket(socketRef.current);
            socketRef.current = null;
            setSocket(null);
            setConnected(false);
            setConnectionError(null);
            connectAttempted.current = false;
        }
    }, [user, ensureConnected, cleanupSocket]);

    // Expose method to manually trigger connection
    const connect = useCallback(() => {
        ensureConnected();
    }, [ensureConnected]);

    const disconnect = useCallback(() => {
        cleanupSocket(socketRef.current);
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
        connectAttempted.current = false;
    }, [cleanupSocket]);

    const value = {
        socket: user ? socket : null,
        connected: user ? connected : false,
        connectionError: user ? connectionError : null,
        connect,
        disconnect,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};