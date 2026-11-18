import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

    useEffect(() => {
        if (!user) {
            setSocket(null);
            setConnected(false);
            setConnectionError(null);
            return;
        }

        const serverURL = getSocketBaseUrl();
        let newSocket = null;
        let mounted = true;

        const connectSocket = () => {
            try {
                newSocket = io(serverURL, {
                    withCredentials: true,
                    transports: ['websocket', 'polling'],
                    reconnection: true,
                    reconnectionAttempts: 5,
                    reconnectionDelay: 1000,
                    auth: { token: token || localStorage.getItem('token') },
                    // Short timeout to fail fast if server isn't running
                    timeout: 5000,
                });

                newSocket.on('connect', () => {
                    if (mounted) {
                        setConnected(true);
                        setConnectionError(null);
                    }
                });

                newSocket.on('disconnect', (reason) => {
                    if (mounted) {
                        setConnected(false);
                        // Don't treat intentional disconnect as error
                        if (reason !== 'io client disconnect') {
                            setConnectionError(`Disconnected: ${reason}`);
                        }
                    }
                });

                newSocket.on('connect_error', (err) => {
                    if (mounted) {
                        setConnected(false);
                        // Silently handle server not running - not a user-facing error
                        const isServerDown = err.message?.includes('ECONNREFUSED') ||
                                             err.message?.includes('Connection refused') ||
                                             err.message?.includes('xhr poll error');
                        if (isServerDown) {
                            setConnectionError('Server unavailable - real-time features disabled');
                        } else {
                            setConnectionError(err.message);
                        }
                    }
                });

                // Reconnection lifecycle events (socket.io v4)
                newSocket.io?.on('reconnect_attempt', () => {});
                newSocket.io?.on('reconnect', () => {});
                newSocket.io?.on('reconnect_error', () => {});
                newSocket.io?.on('reconnect_failed', () => {
                    if (mounted) {
                        setConnected(false);
                        setConnectionError('Reconnection failed - real-time features disabled');
                    }
                });

                if (mounted) {
                    setSocket(newSocket);
                }
            } catch (err) {
                if (mounted) {
                    setConnectionError('Failed to initialize socket connection');
                }
            }
        };

        connectSocket();

        return () => {
            mounted = false;
            cleanupSocket(newSocket);
        };
    }, [user, token, cleanupSocket]);

    const value = {
        socket: user ? socket : null,
        connected: user ? connected : false,
        connectionError: user ? connectionError : null
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
