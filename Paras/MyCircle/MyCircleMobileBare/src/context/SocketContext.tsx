import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { BASE_URL } from '../services/api';

// Derive socket URL from BASE_URL (strip /api)
const SOCKET_URL = BASE_URL.replace('/api', '');

interface SocketContextType {
    socket: Socket | null;
    connected: boolean;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) throw new Error('useSocket must be used within SocketProvider');
    return context;
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setConnected(false);
            }
            return;
        }

        console.log('Connecting to socket at:', SOCKET_URL);
        const newSocket = io(SOCKET_URL, {
            transports: ['websocket'],
            forceNew: true,
        });

        newSocket.on('connect', () => {
            console.log('Socket connected mobile:', newSocket.id);
            setConnected(true);
            newSocket.emit('join', user._id || user.id);
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected mobile');
            setConnected(false);
        });

        newSocket.on('connect_error', (err) => {
            console.log('Socket connection error mobile:', err.message);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
        </SocketContext.Provider>
    );
};
