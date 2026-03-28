import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';
import { Plus } from 'lucide-react';
import NewMessageModal from '../components/chat/NewMessageModal';

const getParticipantId = (participant) => participant?._id?.toString?.() || participant?.id?.toString?.();

const Chat = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
    const [typingUsers, setTypingUsers] = useState({});
    const location = useLocation();

    const fetchConversations = async () => {
        try {
            const res = await api.get('/chat/conversations');
            setConversations(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const initChat = async () => {
            await fetchConversations();

            const queryParams = new URLSearchParams(location.search);
            const recipientId = queryParams.get('recipientId');

            if (recipientId) {
                try {
                    const res = await api.post(`/chat/init/${recipientId}`);
                    setSelectedConversation(res.data);
                    // Refresh conversations to make sure the new/clicked one is in the list
                    const updatedRes = await api.get('/chat/conversations');
                    setConversations(updatedRes.data);
                } catch (err) {
                    console.error('Failed to auto-init chat:', err);
                }
            }
        };

        if (user) initChat();
    }, [location.search, user]);

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
                        unreadCount: data.message.sender === (user?._id || user?.id)
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
    }, [socket, user?._id, user?.id]);

    return (
        <div className="flex flex-col h-[calc(100vh-7rem)] min-h-[600px] w-full max-w-6xl mx-auto pb-4 text-foreground">
            <div className="flex-1 glass-panel overflow-hidden flex shadow-2xl bg-card/50 backdrop-blur-md">
                {/* Chat List Sidebar */}
                <div className={`w-full md:w-1/3 border-r border-card-border bg-card/30 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-card-border flex items-center justify-between bg-hover-bg/30">
                        <h2 className="text-xl font-bold text-text-heading">Messages</h2>
                        <button
                            onClick={() => setIsNewMessageModalOpen(true)}
                            className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all shadow-lg shadow-primary/20"
                            title="New Message"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
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
                        <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
                            <div className="w-20 h-20 rounded-full bg-card/10 flex items-center justify-center mb-4">
                                <span className="text-4xl opacity-80">💬</span>
                            </div>
                            <p className="text-lg font-medium opacity-60">Select a conversation to start messaging</p>
                        </div>
                    )}
                </div>
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
