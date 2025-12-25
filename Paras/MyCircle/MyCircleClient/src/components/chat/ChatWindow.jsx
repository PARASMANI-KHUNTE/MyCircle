
import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { Send, ArrowLeft, Shield, Flag, Check, CheckCheck, Sparkles } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { getSmartSuggestions } from '../../utils/smartSuggestions';
import { useDialog } from '../../hooks/useDialog';
import { getAvatarUrl } from '../../utils/avatar';

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
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-10 shadow-sm/50">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-slate-400 hover:text-slate-900 mr-2 md:hidden">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-slate-200">
                        <img
                            src={getAvatarUrl(otherParticipant)}
                            alt={otherParticipant?.displayName}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">{otherParticipant?.displayName}</h3>
                        {otherParticipant?.isOnline && <span className="text-xs text-emerald-500 font-medium">Online</span>}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleBlock} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Block User">
                        <Shield className="w-5 h-5" />
                    </button>
                    <button onClick={handleReport} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-full transition-colors" title="Report User">
                        <Flag className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                {loading ? (
                    <div className="text-center text-slate-400 mt-10">Loading messages...</div>
                ) : (
                    messages.map((msg, index) => {
                        const isOwn = msg.sender === (currentUser?._id || currentUser?.id);
                        return (
                            <div key={index} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${isOwn
                                    ? 'bg-zinc-900 text-white rounded-br-sm'
                                    : 'bg-slate-100 text-slate-800 rounded-bl-sm border border-slate-200'
                                    }`}>
                                    <p className="text-sm leading-relaxed">{msg.text}</p>
                                    <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isOwn ? 'text-white/60' : 'text-slate-400'}`}>
                                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        {isOwn && (
                                            msg.status === 'read' ? <CheckCheck className="w-3 h-3 text-sky-400" /> :
                                                msg.status === 'delivered' ? <CheckCheck className="w-3 h-3 text-white/60" /> :
                                                    <Check className="w-3 h-3 text-white/40" />
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
                <div className="px-4 py-2 flex gap-2 overflow-x-auto border-t border-slate-50 bg-slate-50/50">
                    <div className="flex items-center text-xs text-violet-600 font-bold mr-1 shrink-0">
                        <Sparkles className="w-3 h-3 mr-1" /> Suggestions:
                    </div>
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => setNewMessage(s)}
                            className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-slate-600 hover:text-violet-600 hover:border-violet-200 hover:bg-violet-50 transition-all whitespace-nowrap shadow-sm"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Typing Indicator */}
            {isTyping && (
                <div className="px-6 py-2 text-xs text-slate-400 italic animate-pulse flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    {otherParticipant?.displayName} is typing...
                </div>
            )}

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-3 items-end">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={handleInputChange}
                        placeholder="Type a message..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100 transition-all shadow-inner"
                    />
                </div>
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-3 bg-zinc-900 text-white rounded-xl hover:bg-black disabled:opacity-50 disabled:hover:bg-zinc-900 transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;
