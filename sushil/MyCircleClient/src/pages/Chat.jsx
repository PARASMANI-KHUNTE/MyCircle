import React, { useState, useEffect } from 'react';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';
import { Plus } from 'lucide-react';
import NewMessageModal from '../components/chat/NewMessageModal';

const Chat = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);

    useEffect(() => {
        fetchConversations();
    }, []);

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
                    current.lastMessage = data.message;
                    current.updatedAt = new Date().toISOString();
                    return [current, ...other];
                }
                return prev; // If new convo, might need refresh or separate event
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
        <div className="container mx-auto px-4 py-24 h-screen max-h-screen flex flex-col">
            <div className="flex-1 glass rounded-2xl overflow-hidden flex shadow-2xl">
                {/* Chat List Sidebar */}
                <div className={`w-full md:w-1/3 border-r border-white/10 bg-black/20 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">Messages</h2>
                        <button
                            onClick={() => setIsNewMessageModalOpen(true)}
                            className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/20"
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
                <div className={`w-full md:w-2/3 flex flex-col bg-black/40 ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
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
                                            lastMessage: { ...c.lastMessage, status: 'read' }
                                        };
                                    }
                                    return c;
                                }));
                            }}
                        />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                <span className="text-4xl">💬</span>
                            </div>
                            <p className="text-lg">Select a conversation to start messaging</p>
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
                        fetchConversations(); // Refresh list
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
