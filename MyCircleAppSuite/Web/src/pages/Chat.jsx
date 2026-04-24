import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';
import { Plus, MessageCircle } from 'lucide-react';
import NewMessageModal from '../components/chat/NewMessageModal';

const Chat = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
    const [typingUsers, setTypingUsers] = useState({});
    const [initialized, setInitialized] = useState(false);
    const location = useLocation();
    const currentUserId = user?._id || user?.id;

    const normalizeSenderId = (message) => {
        const sender = message?.sender;
        return sender?._id || sender?.id || sender || null;
    };

    const fetchConversations = useCallback(async () => {
        try {
            const res = await api.get('/chat/conversations');
            setConversations(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!user || initialized) return;
        setInitialized(true);

        const initChat = async () => {
            try {
                const res = await api.get('/chat/conversations');
                setConversations(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }

            const queryParams = new URLSearchParams(location.search);
            const conversationId = queryParams.get('conversationId');
            const recipientId = queryParams.get('recipientId');

            if (conversationId) {
                try {
                    const res = await api.get(`/chat/conversations/${conversationId}`);
                    setSelectedConversation(res.data);
                    return;
                } catch (err) {
                    console.error('Failed to open conversation:', err);
                }
            }

            if (recipientId) {
                try {
                    const res = await api.post(`/chat/init/${recipientId}`);
                    setSelectedConversation(res.data);
                    const updatedRes = await api.get('/chat/conversations');
                    setConversations(updatedRes.data);
                } catch (err) {
                    console.error('Failed to auto-init chat:', err);
                }
            }
        };

        void initChat();
    }, [user, location.search, initialized]);

    // Listen for new messages to update conversation list order/preview
    useEffect(() => {
        if (!socket) return;

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

        socket.on('receive_message', (data) => {
            // Update conversations list finding the one and moving to top
            setConversations(prev => {
                const other = prev.filter(c => c._id !== data.conversationId);
                const current = prev.find(c => c._id === data.conversationId);
                if (current) {
                    return [{
                        ...current,
                        lastMessage: data.message,
                        updatedAt: new Date().toISOString(),
                        unreadCount: normalizeSenderId(data.message)?.toString() === currentUserId?.toString()
                            ? current.unreadCount
                            : (current.unreadCount || 0) + 1
                    }, ...other];
                }
                return prev; // If new convo, might need refresh or separate event
            });
        });

        const handleTypingStart = (data) => {
            if (data.userId !== (user?._id || user?.id)) {
                setTypingUsers((prev) => ({ ...prev, [data.conversationId]: true }));
            }
        };

        const handleTypingStop = (data) => {
            setTypingUsers((prev) => ({ ...prev, [data.conversationId]: false }));
        };

        socket.on('messages_read', handleReadReceipt);
        socket.on('user_typing', handleTypingStart);
        socket.on('user_stop_typing', handleTypingStop);

        return () => {
            socket.off('receive_message');
            socket.off('messages_read', handleReadReceipt);
            socket.off('user_typing', handleTypingStart);
            socket.off('user_stop_typing', handleTypingStop);
        };
    }, [currentUserId, socket, user?._id, user?.id]);

// Layout (sidebar + chat window or only list)
    return (
        <div className="flex h-[calc(100vh-64px)]">
            {/* Sidebar - always visible on mobile */}
            <div className={`w-full md:w-1/3 flex flex-col bg-background ${selectedConversation ? 'hidden md:flex' : 'flex'} border-r border-border`}>
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <h2 className="text-lg font-bold">Messages</h2>
                    <button
                        onClick={() => setIsNewMessageModalOpen(true)}
                        className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all shadow-lg shadow-primary/20"
                        title="New Message"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center text-text-muted">
                            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
                            Loading...
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <MessageCircle className="w-8 h-8 text-primary" />
                            </div>
                            <p className="text-text-muted font-medium mb-4">No conversations yet</p>
                            <button
                                onClick={() => setIsNewMessageModalOpen(true)}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                            >
                                Start New Chat
                            </button>
                        </div>
                    ) : (
                        <ChatList
                            conversations={conversations}
                            selectedId={selectedConversation?._id}
                            onSelect={setSelectedConversation}
                            loading={loading}
                            currentUserId={user?._id || user?.id}
                            typingUsers={typingUsers}
                            onConversationDeleted={(deletedId) => {
                                setConversations(prev => prev.filter(c => c._id !== deletedId));
                                if (selectedConversation?._id === deletedId) {
                                    setSelectedConversation(null);
                                }
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className={`w-full md:w-2/3 flex flex-col bg-card/60 ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                {selectedConversation ? (
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
                                        lastMessage: { ...c.lastMessage, status: 'read' },
                                        unreadCount: 0
                                    };
                                }
                                return c;
                            }));
                        }}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-text-muted p-8 text-center">
                        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                            <MessageCircle className="w-12 h-12 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Your Messages</h3>
                        <p className="text-text-muted max-w-xs">
                            Connect with people through contact requests to start chatting
                        </p>
                    </div>
                )}
</div>

            <NewMessageModal
                isOpen={isNewMessageModalOpen}
                onClose={() => setIsNewMessageModalOpen(false)}
                onSelectUser={async (otherUser) => {
                    try {
                        const res = await api.post(`/chat/init/${otherUser._id}`);
                        setSelectedConversation(res.data);
                        void fetchConversations();
                        setIsNewMessageModalOpen(false);
                    } catch (err) {
                        console.error('Failed to init chat:', err);
                    }
                }}
            />
        </div>
    );
};

export default Chat;
