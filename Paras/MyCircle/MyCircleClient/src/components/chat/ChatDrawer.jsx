import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../utils/api';

const ChatDrawer = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchConversations();
        }
    }, [isOpen]);

    // Listen for new messages to update conversation list order
    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (data) => {
            setConversations(prev => {
                const other = prev.filter(c => c._id !== data.conversationId);
                const current = prev.find(c => c._id === data.conversationId);

                // If the conversation exists in our list, update it
                if (current) {
                    const updated = {
                        ...current,
                        lastMessage: data.message,
                        updatedAt: new Date().toISOString()
                    };
                    return [updated, ...other];
                }

                return prev;
            });
        };

        const handleReadReceipt = (data) => {
            setConversations(prev => prev.map(c => {
                if (c._id === data.conversationId && c.lastMessage) {
                    return {
                        ...c,
                        lastMessage: { ...c.lastMessage, status: 'read' }
                    };
                }
                return c;
            }));
        };

        socket.on('receive_message', handleReceiveMessage);
        socket.on('messages_read', handleReadReceipt);
        return () => {
            socket.off('receive_message', handleReceiveMessage);
            socket.off('messages_read', handleReadReceipt);
        };
    }, [socket]);

    const fetchConversations = async () => {
        try {
            const res = await api.get('/chat/conversations');
            setConversations(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleConversationDeleted = (deletedId) => {
        setConversations(prev => prev.filter(c => c._id !== deletedId));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Drawer Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed right-0 top-0 bottom-0 w-full md:w-[450px] bg-background border-l border-white/10 z-50 flex flex-col shadow-2xl"
                    >
                        {/* Drawer Header */}
                        <div className="p-4 border-b border-white/10 flex items-center justify-between glass">
                            <h2 className="text-xl font-bold text-white">
                                {selectedConversation ? 'Chat' : 'Messages'}
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Drawer Content */}
                        <div className="flex-1 overflow-hidden relative">
                            <AnimatePresence mode="wait">
                                {selectedConversation ? (
                                    <motion.div
                                        key="window"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="absolute inset-0 bg-background"
                                    >
                                        <ChatWindow
                                            conversation={selectedConversation}
                                            socket={socket}
                                            currentUser={user}
                                            onBack={() => setSelectedConversation(null)}
                                            onMessagesRead={(convoId) => {
                                                setConversations(prev => prev.map(c => {
                                                    if (c._id === convoId && c.lastMessage) {
                                                        return {
                                                            ...c,
                                                            lastMessage: { ...c.lastMessage, status: 'read' }
                                                        };
                                                    }
                                                    return c;
                                                }));
                                            }}
                                        />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="list"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="absolute inset-0 overflow-y-auto"
                                    >
                                        <ChatList
                                            conversations={conversations}
                                            selectedId={null}
                                            onSelect={setSelectedConversation}
                                            loading={loading}
                                            currentUserId={user?._id || user?.id}
                                            onConversationDeleted={handleConversationDeleted}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ChatDrawer;
