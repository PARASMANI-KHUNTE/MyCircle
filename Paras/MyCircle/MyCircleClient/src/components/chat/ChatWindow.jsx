
import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { Send, ArrowLeft, Shield, Flag, Check, CheckCheck, Sparkles } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { getSmartSuggestions } from '../../utils/smartSuggestions';
import { useDialog } from '../../hooks/useDialog';

const ChatWindow = ({ conversation, socket, currentUser, onBack, onMessagesRead }) => {
    const { success, error: showError } = useToast();
    const dialog = useDialog();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [suggestions, setSuggestions] = useState([]);
    const messagesEndRef = useRef(null);
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef(null);

    const otherParticipant = conversation.participants.find(p => p._id !== (currentUser?._id || currentUser?.id)) || conversation.participants[0];

    useEffect(() => {
        fetchMessages();
        markAsRead();
        // Generate suggestions based on the last message if available
        const lastMsgText = conversation.lastMessage?.text || '';
        generateSuggestions(lastMsgText);
        // Reset messages when conversation changes
        return () => setMessages([]);
    }, [conversation._id]);

    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (data) => {
            if (data.conversationId === conversation._id) {
                setMessages(prev => [...prev, data.message]);
                scrollToBottom();
                markAsRead(); // Mark incoming as read if window is open
                // Update suggestions based on received message
                generateSuggestions(data.message.text);
            }
        };

        const handleReadReceipt = (data) => {
            if (data.conversationId === conversation._id && data.readerId !== currentUser._id) {
                setMessages(prev => prev.map(msg =>
                    msg.sender === currentUser._id ? { ...msg, status: 'read' } : msg
                ));
            }
        };

        const handleUserTyping = (data) => {
            if (data.conversationId === conversation._id && data.userId !== (currentUser?._id || currentUser?.id)) {
                setIsTyping(true);
            }
        };

        const handleUserStopTyping = (data) => {
            if (data.conversationId === conversation._id) {
                setIsTyping(false);
            }
        };

        socket.on('receive_message', handleReceiveMessage);
        socket.on('messages_read', handleReadReceipt);
        socket.on('user_typing', handleUserTyping);
        socket.on('user_stop_typing', handleUserStopTyping);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
            socket.off('messages_read', handleReadReceipt);
            socket.off('user_typing', handleUserTyping);
            socket.off('user_stop_typing', handleUserStopTyping);
        };
    }, [socket, conversation._id]);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/chat/messages/${conversation._id}`);
            setMessages(res.data);
            setLoading(false);
            scrollToBottom();
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const markAsRead = async () => {
        try {
            await api.put(`/chat/read/${conversation._id}`);
            if (onMessagesRead) {
                onMessagesRead(conversation._id);
            }
        } catch (err) {
            console.error("Failed to mark read", err);
        }
    };

    const generateSuggestions = (lastMessageText = '') => {
        // Use smart suggestions based on last received message
        const newSuggestions = getSmartSuggestions(lastMessageText);
        setSuggestions(newSuggestions.slice(0, 3));
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);

        if (!socket) return;

        // Emit typing_start
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        } else {
            socket.emit('typing_start', {
                conversationId: conversation._id,
                userId: currentUser?._id || currentUser?.id,
                recipientId: otherParticipant?._id
            });
        }

        // Set timeout to emit typing_stop
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing_stop', {
                conversationId: conversation._id,
                userId: currentUser?._id || currentUser?.id,
                recipientId: otherParticipant?._id
            });
            typingTimeoutRef.current = null;
        }, 1000);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        let tempMessage; // Define outside try block
        try {
            // Optimistic update
            tempMessage = {
                _id: Date.now(),
                conversationId: conversation._id,
                sender: currentUser?._id || currentUser?.id,
                text: newMessage,
                status: 'sent',
                createdAt: new Date().toISOString()
            };
            setMessages(prev => [...prev, tempMessage]);
            setNewMessage('');
            scrollToBottom();
            generateSuggestions(); // Refresh suggestions

            await api.post('/chat/message', {
                recipientId: otherParticipant._id,
                text: tempMessage.text
            });
            // Ideally update tempMessage to 'delivered' or replace with server response
            setMessages(prev => prev.map(m => m._id === tempMessage._id ? { ...m, status: 'delivered' } : m));

        } catch (err) {
            console.error("Failed to send", err);
            // Remove optimistic message on error
            if (tempMessage) {
                setMessages(prev => prev.filter(m => m._id !== tempMessage._id));
            }

            if (err.response?.status === 403) {
                showError(err.response.data.msg || "You can only message connected users.");
            } else if (err.response?.status === 400) {
                showError(err.response.data.msg || "Message rejected.");
            } else {
                showError("Failed to send message.");
            }
        }
    };

    const handleBlock = async () => {
        const confirmed = await dialog.confirm(
            `Are you sure you want to block ${otherParticipant.displayName}? You will no longer be able to message each other.`,
            'Block User'
        );
        if (!confirmed) return;

        try {
            await api.post(`/user/block/${otherParticipant._id}`);
            success('User blocked');
            onBack();
        } catch (err) {
            showError('Failed to block user');
        }
    };

    const handleReport = async () => {
        const reason = await dialog.prompt(
            'Please describe the reason for reporting this user:',
            'Report User',
            ''
        );
        if (!reason) return;

        try {
            await api.post('/user/report', {
                reportedUserId: otherParticipant._id,
                reason,
                contentType: 'chat',
                contentId: conversation._id
            });
            success('Report submitted');
        } catch (err) {
            showError('Failed to report');
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-gray-400 hover:text-white mr-2">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                        <img
                            src={otherParticipant?.avatar || "https://ui-avatars.com/api/?name=" + (otherParticipant?.displayName || "User")}
                            alt={otherParticipant?.displayName}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">{otherParticipant?.displayName}</h3>
                        {otherParticipant?.isOnline && <span className="text-xs text-green-400">Online</span>}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleBlock} className="p-2 text-gray-400 hover:text-red-500" title="Block User">
                        <Shield className="w-5 h-5" />
                    </button>
                    <button onClick={handleReport} className="p-2 text-gray-400 hover:text-yellow-500" title="Report User">
                        <Flag className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="text-center text-gray-500 mt-10">Loading messages...</div>
                ) : (
                    messages.map((msg, index) => {
                        const isOwn = msg.sender === (currentUser?._id || currentUser?.id);
                        return (
                            <div key={index} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isOwn
                                    ? 'bg-primary text-white rounded-br-none'
                                    : 'bg-white/10 text-gray-200 rounded-bl-none'
                                    }`}>
                                    <p>{msg.text}</p>
                                    <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
                                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        {isOwn && (
                                            msg.status === 'read' ? <CheckCheck className="w-3 h-3 text-blue-300" /> :
                                                msg.status === 'delivered' ? <CheckCheck className="w-3 h-3 text-white/70" /> :
                                                    <Check className="w-3 h-3 text-white/50" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* AI Suggestions */}
            {suggestions.length > 0 && (
                <div className="px-4 py-2 flex gap-2 overflow-x-auto">
                    <div className="flex items-center text-xs text-primary font-medium mr-1">
                        <Sparkles className="w-3 h-3 mr-1" /> AI Suggestions:
                    </div>
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => setNewMessage(s)}
                            className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Typing Indicator */}
            {isTyping && (
                <div className="px-4 py-2 text-xs text-gray-400 italic animate-pulse">
                    {otherParticipant?.displayName} is typing...
                </div>
            )}

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-white/5 border-t border-white/10 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={handleInputChange}
                    placeholder="Type a message..."
                    className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-colors"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;
