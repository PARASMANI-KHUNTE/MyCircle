import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';
import { useAuth } from './AuthContext';
import { useToast } from '../components/ui/Toast';

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
    const { token } = useAuth();
    const { success, info, warning } = useToast();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!token) {
            // Disconnect if user logs out
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setConnected(false);
            }
            return;
        }

        // Get Socket URL from environment (remove /api suffix)
        const apiUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
        const socketUrl = apiUrl.replace('/api', '');

        const newSocket = io(socketUrl, {
            transports: ['websocket', 'polling'],
        });

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
            setConnected(true);
            // Join user's personal room - we need to get user ID from token
            // For now, we'll emit join event without userId
            // TODO: Decode token to get userId or fetch from API
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            setConnected(false);
        });

        // Listen for notifications
        newSocket.on('notification', (data: any) => {
            console.log('Notification received:', data);

            switch (data.type) {
                case 'request_received':
                    info(`New contact request from ${data.requesterName}`);
                    break;
                case 'request_approved':
                    success(`${data.recipientName} approved your contact request!`);
                    break;
                case 'request_rejected':
                    warning(`${data.recipientName} declined your contact request`);
                    break;
                default:
                    info(data.message || 'New notification');
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [token]);

    const value = { socket, connected };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
