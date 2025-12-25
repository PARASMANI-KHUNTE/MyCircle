import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, MessageCircle } from 'lucide-react';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import NewMessageModal from '../components/chat/NewMessageModal';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';

const DashboardChat = ({ onUnreadUpdate }) => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const initChat = async () => {
            await fetchConversations();

            const queryParams = new URLSearchParams(location.search);
            const recipientId = queryParams.get('recipientId');

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

        if (user) initChat();
    }, [location.search, user]);

    // Socket listeners for real-time updates
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
            setConversations(prev => {
                const other = prev.filter(c => c._id !== data.conversationId);
                const current = prev.find(c => c._id === data.conversationId);
                if (current) {
                    current.lastMessage = data.message;
                    current.updatedAt = new Date().toISOString();
                    return [current, ...other];
                }
                return prev;
            });
        });

        socket.on('messages_read', handleReadReceipt);

        return () => {
            socket.off('receive_message');
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

    return (
        <div className="flex flex-col h-[calc(100vh-14rem)] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex flex-1 overflow-hidden">
                {/* Chat List Sidebar */}
                <div className={`w-full md:w-80 border-r border-slate-200 bg-slate-50 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900">Messages</h2>
                        <button
                            onClick={() => setIsNewMessageModalOpen(true)}
                            className="w-9 h-9 rounded-lg bg-teal-500 text-white flex items-center justify-center hover:bg-teal-600 transition-all shadow-sm"
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
                        />
                    </div>
                </div>

                {/* Chat Window */}
                <div className={`flex-1 flex flex-col bg-white ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                    {selectedConversation ? (
                        <ChatWindow
                            conversation={selectedConversation}
                            socket={socket}
                            currentUser={user}
                            onBack={() => setSelectedConversation(null)}
                            onMessagesRead={(convoId) => {
                                setConversations(prev => {
                                    const updated = prev.map(c => {
                                        if (c._id === convoId) {
                                            return {
                                                ...c,
                                                unreadCount: 0,
                                                lastMessage: c.lastMessage ? { ...c.lastMessage, status: 'read' } : null
                                            };
                                        }
                                        return c;
                                    });
                                    // Calculate new total unread count
                                    if (onUnreadUpdate) {
                                        const totalUnread = updated.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
                                        onUnreadUpdate(totalUnread);
                                    }
                                    return updated;
                                });
                            }}
                        />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                <MessageCircle className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-600 mb-2">No conversation selected</h3>
                            <p className="text-sm text-slate-500">Choose a conversation from the list or start a new one</p>
                        </div>
                    )}
                </div>
            </div>

            {/* New Message Modal */}
            {isNewMessageModalOpen && (
                <NewMessageModal
                    onClose={() => setIsNewMessageModalOpen(false)}
                    onConversationStart={(conv) => {
                        setSelectedConversation(conv);
                        fetchConversations();
                        setIsNewMessageModalOpen(false);
                    }}
                />
            )}
        </div>
    );
};

export default DashboardChat;
