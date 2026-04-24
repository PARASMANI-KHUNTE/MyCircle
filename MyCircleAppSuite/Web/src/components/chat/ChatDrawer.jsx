import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../utils/api';

const ChatDrawer = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [loading, setLoading] = useState(true);

    const [typingUsers, setTypingUsers] = useState({});
    const currentUserId = user?._id || user?.id;

    const normalizeSenderId = (message) => {
        const sender = message?.sender;
        return sender?._id || sender?.id || sender || null;
    };

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const res = await api.get('/chat/conversations');
            setConversations(res.data);
        } catch {
            // Silent fail handled by empty state
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isOpen) return;

        void fetchConversations();
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
                        unreadCount: normalizeSenderId(data.message)?.toString() === currentUserId?.toString()
                            ? (current.unreadCount || 0)
                            : (current.unreadCount || 0) + 1,
                        updatedAt: new Date().toISOString()
                    };
                    return [updated, ...other];
                }

                // If it's a new conversation, we might want to fetch it or ignore
                // For now, let's refresh to be safe if we don't have it
                void fetchConversations();
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

        const handleUnreadUpdate = () => {
            // Re-fetch to get accurate counts when we read messages on another device
            // or when we mark messages as read in this drawer
            fetchConversations();
        };

        const handleTypingStart = (data) => {
            setTypingUsers(prev => ({ ...prev, [data.conversationId]: true }));
        };

        const handleTypingStop = (data) => {
            setTypingUsers(prev => ({ ...prev, [data.conversationId]: false }));
        };

        socket.on('receive_message', handleReceiveMessage);
        socket.on('messages_read', handleReadReceipt);
        socket.on('unread_count_update', handleUnreadUpdate);
        socket.on('user_typing', handleTypingStart);
        socket.on('user_stop_typing', handleTypingStop);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
            socket.off('messages_read', handleReadReceipt);
            socket.off('unread_count_update', handleUnreadUpdate);
            socket.off('user_typing', handleTypingStart);
            socket.off('user_stop_typing', handleTypingStop);
        };
    }, [currentUserId, socket]);

    const handleConversationDeleted = (deletedId) => {
        setConversations(prev => prev.filter(c => c._id !== deletedId));
    };

    const handleOpenFullChat = () => {
        const targetPath = selectedConversation?._id
            ? `/chat?conversationId=${selectedConversation._id}`
            : '/chat';

        onClose();
        navigate(targetPath);
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
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
                    />

                    {/* Drawer Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed right-0 top-0 bottom-0 w-full md:w-[450px] bg-background border-l border-card-border z-[100] flex flex-col shadow-2xl"
                    >
                        {/* Drawer Header */}
                        <div className="p-4 border-b border-card-border flex items-center justify-between glass">
                            <h2 className="text-xl font-bold text-text-heading">
                                {selectedConversation ? 'Chat' : 'Messages'}
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleOpenFullChat}
                                    className="inline-flex items-center gap-2 rounded-full border border-card-border px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-black/5 hover:text-text-heading"
                                    title="Open full chat page"
                                >
                                    <Maximize2 className="w-4 h-4" />
                                    <span>{selectedConversation ? 'Expand' : 'Open Chat'}</span>
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-black/5 rounded-full transition-colors text-text-muted hover:text-text-heading"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
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
                                            typingUsers={typingUsers}
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
