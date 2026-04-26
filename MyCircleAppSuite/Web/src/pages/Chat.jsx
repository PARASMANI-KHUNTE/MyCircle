import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';
import { MessageCircle, ArrowLeft } from 'lucide-react';

const Chat = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [typingUsers, setTypingUsers] = useState({});
    const [initialized, setInitialized] = useState(false);
    const [disabledConvId, setDisabledConvId] = useState(null);
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
            if (conversationId) {
                try {
                    const res = await api.get(`/chat/conversations/${conversationId}`);
                    setSelectedConversation(res.data);
                    return;
                } catch (err) {
                    console.error('Failed to open conversation:', err);
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
        
        const handleConversationDisabled = (data) => {
            setDisabledConvId(data.conversationId);
            setTimeout(() => setDisabledConvId(null), 5000);
            if (selectedConversation?._id === data.conversationId) {
                setSelectedConversation(null);
            }
            setConversations(prev => prev.filter(c => c._id !== data.conversationId));
        };
        socket.on('conversation_disabled', handleConversationDisabled);

        return () => {
            socket.off('receive_message');
            socket.off('messages_read', handleReadReceipt);
            socket.off('user_typing', handleTypingStart);
            socket.off('user_stop_typing', handleTypingStop);
            socket.off('conversation_disabled', handleConversationDisabled);
        };
    }, [currentUserId, socket, user?._id, user?.id]);

// Layout (sidebar + chat window or only list)
    return (
        <>
            <div className="flex h-[100dvh] lg:h-[calc(100vh-80px)] overflow-hidden min-w-0">
                {/* Sidebar - list of conversations */}
                <div className={`
                    w-full md:w-1/3 min-w-0 flex flex-col bg-background border-r border-card-border
                    ${selectedConversation ? 'hidden md:flex' : 'flex'}
                `}>
                    <div className="px-3 py-3 border-b border-card-border flex items-center justify-between bg-card/50 shrink-0">
                        <div className="flex items-center gap-2">
                            {selectedConversation && (
                                <button 
                                    onClick={() => setSelectedConversation(null)}
                                    className="tap-target p-2 -ml-2 rounded-lg hover:bg-card-hover text-foreground-muted transition-colors lg:hidden"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                            )}
                            <h2 className="text-base font-bold text-foreground">Messages</h2>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto -webkit-overflow-scrolling: touch min-h-0">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
                                <span className="text-sm text-foreground-muted">Loading...</span>
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                                    <MessageCircle className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-base font-semibold text-foreground mb-2">No conversations yet</h3>
                                <p className="text-sm text-foreground-muted mb-4 max-w-[240px]">
                                    Connect with people through contact requests to start chatting
                                </p>
                                <p className="text-xs text-foreground-muted max-w-[260px]">
                                    New chats start only from accepted requests on a specific post.
                                </p>
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
                <div className={`
                    w-full md:w-2/3 min-w-0 flex flex-col bg-card
                    ${!selectedConversation ? 'hidden md:flex' : 'flex'}
                `}>
                    {selectedConversation ? (
                        <ChatWindow
                            conversation={selectedConversation}
                            socket={socket}
                            currentUser={user}
                            isDisabled={disabledConvId === selectedConversation._id}
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
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-background">
                            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                                <MessageCircle className="w-10 h-10 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">Your Messages</h3>
                            <p className="text-sm text-foreground-muted max-w-[280px]">
                                Select a conversation to start chatting
                            </p>
                        </div>
                    )}
                </div>
            </div>

        </>
    );
};

export default Chat;
