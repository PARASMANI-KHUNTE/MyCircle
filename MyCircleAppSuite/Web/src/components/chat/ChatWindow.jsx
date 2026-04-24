import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    const [messagesError, setMessagesError] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const messagesEndRef = useRef(null);
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef(null);
    const typingStartEmitted = useRef(false);

    const currentUserId = currentUser?._id || currentUser?.id;
    const strUserId = currentUserId?.toString();
    const otherParticipant = conversation.participants?.find(p => {
        const pId = p._id || p.id;
        return pId?.toString() !== strUserId;
    }) || conversation.participants?.[0];

    const fetchMessages = useCallback(async () => {
        try {
            setLoading(true);
            setMessagesError('');
            const res = await api.get(`/chat/messages/${conversation._id}`);
            setMessages(res.data);
            scrollToBottom();

            if (res.data.length > 0) {
                const lastMsg = res.data[res.data.length - 1];
                if (lastMsg.sender !== currentUserId) {
                    generateSuggestions(lastMsg.text);
                }
            }
        } catch (err) {
            const status = err?.response?.status;
            if (status === 401 || status === 403) {
                setMessagesError('You are not authorized to view this conversation.');
            } else {
                setMessagesError('Failed to load messages. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }, [conversation._id, currentUserId]);

    const markAsRead = useCallback(async () => {
        try {
            await api.put(`/chat/read/${conversation._id}`);
            if (onMessagesRead) {
                onMessagesRead(conversation._id);
            }
        } catch {
            // Silent fail for mark as read
        }
    }, [conversation._id, onMessagesRead]);

    const generateSuggestions = (lastMessageText = '') => {
        const newSuggestions = getSmartSuggestions(lastMessageText);
        setSuggestions(newSuggestions.slice(0, 3));
    };

    const normalizeSenderId = (message) => {
        return message?.sender?._id || message?.sender?.id || message?.sender;
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    useEffect(() => {
        if (!conversation._id) return;
        setMessages([]);
        const lastMsgText = conversation.lastMessage?.text || '';
        generateSuggestions(lastMsgText);
        typingStartEmitted.current = false;
        void fetchMessages();
        void markAsRead();
    }, [conversation._id, conversation.lastMessage?.text, fetchMessages, markAsRead]);

    useEffect(() => {
        if (!socket || !conversation._id) return;

        const handleReceiveMessage = (data) => {
            if (data.conversationId === conversation._id) {
                setMessages(prev => {
                    if (prev.find(m => m._id === data.message._id)) return prev;
                    return [...prev, data.message];
                });
                scrollToBottom();

                if (normalizeSenderId(data.message)?.toString() !== currentUserId?.toString()) {
                    generateSuggestions(data.message.text);
                    void markAsRead();
                }
            }
        };

        const handleReadReceipt = (data) => {
            if (data.conversationId === conversation._id && data.readerId !== currentUser?._id) {
                setMessages(prev => prev.map(msg =>
                    msg.sender === currentUserId ? { ...msg, status: 'read' } : msg
                ));
            }
        };

        const handleUserTyping = (data) => {
            if (data.conversationId === conversation._id && data.userId !== currentUserId) {
                setIsTyping(true);
            }
        };

        const handleUserStopTyping = (data) => {
            if (data.conversationId === conversation._id) {
                setIsTyping(false);
            }
        };

        const handleConversationDeleted = (data) => {
            if (data.conversationId === conversation._id) {
                dialog.alert('This conversation has been closed because the post is no longer available.', 'Chat Closed');
                onBack();
            }
        };

        socket.on('receive_message', handleReceiveMessage);
        socket.on('messages_read', handleReadReceipt);
        socket.on('user_typing', handleUserTyping);
        socket.on('user_stop_typing', handleUserStopTyping);
        socket.on('conversation_deleted', handleConversationDeleted);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
            socket.off('messages_read', handleReadReceipt);
            socket.off('user_typing', handleUserTyping);
            socket.off('user_stop_typing', handleUserStopTyping);
            socket.off('conversation_deleted', handleConversationDeleted);
        };
    }, [socket, conversation._id, currentUser?._id, currentUser?.id, currentUserId, dialog, markAsRead, onBack]);

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);

        if (!socket || !otherParticipant?._id) return;

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        } else if (!typingStartEmitted.current) {
            socket.emit('typing_start', {
                conversationId: conversation._id,
                userId: currentUserId,
                recipientId: otherParticipant._id
            });
            typingStartEmitted.current = true;
        }

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing_stop', {
                conversationId: conversation._id,
                userId: currentUserId,
                recipientId: otherParticipant._id
            });
            typingTimeoutRef.current = null;
            typingStartEmitted.current = false;
        }, 1000);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !otherParticipant?._id) return;

        let tempMessage; // Define outside try block
        try {
            // Optimistic update
            const tempId = `temp-${Date.now()}`;
            tempMessage = {
                _id: tempId,
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

            const response = await api.post('/chat/message', {
                recipientId: otherParticipant._id,
                text: tempMessage.text,
                postId: conversation.postId
            });

            setMessages(prev => prev.map((message) =>
                message._id === tempId ? response.data : message
            ));

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
        } catch {
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
        } catch {
            showError('Failed to report');
        }
    };

    return (
        <div className="flex flex-col h-full">
            {!otherParticipant ? (
                <div className="flex-1 flex items-center justify-center text-text-muted">
                    Conversation not found
                </div>
            ) : (
            <>
            {/* Header */}
            <div className="p-4 border-b border-card-border flex items-center justify-between bg-hover-bg/30">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-text-muted hover:text-text-heading mr-2">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-background-section overflow-hidden border border-card-border">
                        <img
                            src={getAvatarUrl(otherParticipant)}
                            alt={otherParticipant?.displayName}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <h3 className="font-bold text-text-heading">{otherParticipant?.displayName}</h3>
                        {otherParticipant?.isOnline && <span className="text-xs text-green-600 font-medium">Online</span>}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleBlock} className="p-2 text-text-muted hover:text-red-500 transition-colors" title="Block User">
                        <Shield className="w-5 h-5" />
                    </button>
                    <button onClick={handleReport} className="p-2 text-text-muted hover:text-yellow-600 transition-colors" title="Report User">
                        <Flag className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background-section/10">
                {loading ? (
                    <div className="text-center text-text-muted mt-10 font-medium animate-pulse">Loading messages...</div>
                ) : messagesError ? (
                    <div className="text-center mt-10">
                        <p className="text-sm text-error font-medium">{messagesError}</p>
                        <button
                            onClick={() => void fetchMessages()}
                            className="mt-3 px-4 py-2 rounded-lg border border-card-border text-sm text-foreground hover:bg-card-hover transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isOwn = msg.sender === currentUserId;
                        return (
                            <div key={msg._id || `temp-${msg.createdAt}`} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${isOwn
                                    ? 'bg-primary text-primary-foreground rounded-br-none'
                                    : 'bg-card border border-card-border text-text-body rounded-bl-none'
                                    }`}>
                                    <p>{msg.text}</p>
                                    <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isOwn ? 'text-primary-foreground/80' : 'text-text-muted'}`}>
                                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        {isOwn && (
                                            msg.status === 'read' ? <CheckCheck className="w-3 h-3 text-primary-foreground" /> :
                                                msg.status === 'delivered' ? <CheckCheck className="w-3 h-3 text-primary-foreground/70" /> :
                                                    <Check className="w-3 h-3 text-primary-foreground/50" />
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
                <div className="px-4 py-2 text-xs text-text-muted italic animate-pulse">
                    {otherParticipant?.displayName} is typing...
                </div>
            )}

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-hover-bg/20 border-t border-card-border flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={handleInputChange}
                    placeholder="Type a message..."
                    className="flex-1 bg-card border border-card-border rounded-xl px-4 py-3 text-text-heading placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all shadow-inner"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-colors shadow-button"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
            </>
            )}
        </div>
    );
};

export default ChatWindow;
