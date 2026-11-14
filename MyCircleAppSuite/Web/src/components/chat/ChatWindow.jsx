import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useToast } from '../ui/Toast';
import Button from '../ui/Button';
import { getSmartSuggestions } from '../../utils/smartSuggestions';
import { getAvatarUrl } from '../../utils/avatar';
import { useCurrencySymbol } from '../../context/CurrencySymbolContext';
import { useDialog } from '../../hooks/useDialog';

const REPORT_REASON_OPTIONS = [
    'Spam or scam',
    'Harassment or abuse',
    'Impersonation',
    'Hate speech',
    'Explicit or unsafe content',
    'Other'
];

const mapReportCategory = (reasonText) => {
    const normalized = reasonText.toLowerCase();
    if (normalized.includes('spam') || normalized.includes('scam')) return 'spam';
    if (normalized.includes('harass') || normalized.includes('abuse') || normalized.includes('threat')) return 'harassment';
    if (normalized.includes('impersonat')) return 'impersonation';
    if (normalized.includes('hate')) return 'hate_speech';
    if (normalized.includes('explicit') || normalized.includes('unsafe') || normalized.includes('nudity')) return 'nudity';
    if (normalized.includes('violence')) return 'violence';
    return 'other';
};

const ChatWindow = ({ conversation, socket, currentUser, onBack, onMessagesRead, isDisabled }) => {
    const { success, error: showError } = useToast();
    const { currencySymbol } = useCurrencySymbol();
    const dialog = useDialog();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [messagesError, setMessagesError] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [postCollapsed, setPostCollapsed] = useState(true);
    const messagesEndRef = useRef(null);
    const post = conversation.postId;
    const typingTimeoutRef = useRef(null);
    const typingStartEmitted = useRef(false);
    const markReadInFlightRef = useRef(false);
    const markReadTimeoutRef = useRef(null);
    const initializedRef = useRef(false);

    const currentUserId = currentUser?._id || currentUser?.id;

    const normalizeSenderId = (message) => {
        const sender = message?.sender;
        return sender?._id || sender?.id || sender || null;
    };

    const otherParticipant = conversation.participants?.find(p => {
        const pId = p._id || p.id;
        return pId?.toString() !== currentUserId?.toString();
    }) || conversation.participants?.[0];

    const postOwnerId = post?.user?._id || post?.user;
    const isPostOwner = postOwnerId?.toString() === currentUserId?.toString();

    const otherParticipantId = otherParticipant?._id || otherParticipant?.id;

    const markAsRead = useCallback(async () => {
        if (markReadInFlightRef.current || !conversation._id) return;

        markReadInFlightRef.current = true;
        try {
            await api.put(`/chat/read/${conversation._id}`);
            if (onMessagesRead) {
                onMessagesRead(conversation._id);
            }
        } catch {
            // Silent fail
        } finally {
            markReadInFlightRef.current = false;
        }
    }, [conversation._id, onMessagesRead]);

    const generateSuggestions = (lastMessageText = '') => {
        const newSuggestions = getSmartSuggestions(lastMessageText);
        setSuggestions(newSuggestions.slice(0, 3));
    };

    useEffect(() => {
        if (!conversation._id || initializedRef.current) return;
        
        const runInit = async () => {
            initializedRef.current = true;
            setMessages([]);
            setLoading(true);
            setMessagesError('');
            
            try {
                const res = await api.get(`/chat/messages/${conversation._id}`);
                setMessages(res.data);
                scrollToBottom();

                if (res.data.length > 0) {
                    const lastMsg = res.data[res.data.length - 1];
                    if (normalizeSenderId(lastMsg)?.toString() !== currentUserId?.toString()) {
                        generateSuggestions(lastMsg.text);
                    }
                    const hasUnread = res.data.some((msg) => (
                        normalizeSenderId(msg)?.toString() !== currentUserId?.toString() &&
                        msg.status !== 'read'
                    ));
                    if (hasUnread) {
                        markReadTimeoutRef.current = window.setTimeout(() => {
                            void markAsRead();
                        }, 150);
                    }
                }
            } catch (err) {
                const status = err?.response?.status;
                if (status === 401 || status === 403) {
                    setMessagesError('You are not authorized.');
                } else {
                    setMessagesError('Failed to load messages.');
                }
            } finally {
                setLoading(false);
            }
        };

        void runInit();
    }, [conversation._id, currentUserId, markAsRead]);

    useEffect(() => {
        generateSuggestions(conversation.lastMessage?.text || '');
    }, [conversation._id, conversation.lastMessage?.text]);

    useEffect(() => {
        if (post) {
            setPostCollapsed(true);
        }
    }, [conversation._id, post]);

    useEffect(() => {
        if (!socket || !conversation._id) return;

        const handleReceiveMessage = (data) => {
            if (data.conversationId?.toString() !== conversation._id.toString()) return;

            const incomingMessage = data.message;
            setMessages((prev) => {
                if (prev.find((msg) => msg._id === incomingMessage._id)) return prev;
                return [...prev, incomingMessage];
            });

            scrollToBottom();

            if (normalizeSenderId(incomingMessage)?.toString() !== currentUserId?.toString()) {
                generateSuggestions(incomingMessage.text);
                window.clearTimeout(markReadTimeoutRef.current);
                markReadTimeoutRef.current = window.setTimeout(() => {
                    void markAsRead();
                }, 150);
            }
        };

        const handleReadReceipt = (data) => {
            if (data.conversationId === conversation._id && data.readerId !== currentUserId) {
                setMessages(prev => prev.map(msg =>
                    normalizeSenderId(msg)?.toString() === currentUserId?.toString()
                        ? { ...msg, status: 'read' }
                        : msg
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
                dialog.alert('This conversation has been closed.', 'Chat Closed');
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
    }, [socket, conversation._id, currentUserId, dialog, onBack, markAsRead]);

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);

        if (!socket || !otherParticipant?.id) return;

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        } else if (!typingStartEmitted.current) {
            socket.emit('typing_start', {
                conversationId: conversation._id,
                userId: currentUserId,
                recipientId: otherParticipantId
            });
            typingStartEmitted.current = true;
        }

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing_stop', {
                conversationId: conversation._id,
                userId: currentUserId,
                recipientId: otherParticipantId
            });
            typingTimeoutRef.current = null;
            typingStartEmitted.current = false;
        }, 1000);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !otherParticipant?.id) return;

        let tempMessage;
        try {
            const tempId = `temp-${Math.random().toString(36).slice(2, 9)}`;
            tempMessage = {
                _id: tempId,
                conversationId: conversation._id,
                sender: currentUserId,
                text: newMessage,
                status: 'sent',
                createdAt: new Date().toISOString()
            };
            setMessages(prev => [...prev, tempMessage]);
            setNewMessage('');
            scrollToBottom();
            generateSuggestions();

            const response = await api.post('/chat/message', {
                recipientId: otherParticipantId || otherParticipant.id || otherParticipant,
                text: tempMessage.text,
                postId: conversation.postId?._id || conversation.postId
            });

            setMessages(prev => prev.map((message) =>
                message._id === tempId ? response.data : message
            ));
        } catch {
            // best effort message send
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);

        if (!socket || !otherParticipant?.id) return;

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        } else if (!typingStartEmitted.current) {
            socket.emit('typing_start', {
                conversationId: conversation._id,
                userId: currentUserId,
                recipientId: otherParticipantId
            });
            typingStartEmitted.current = true;
        }

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing_stop', {
                conversationId: conversation._id,
                userId: currentUserId,
                recipientId: otherParticipantId
            });
            typingTimeoutRef.current = null;
            typingStartEmitted.current = false;
        }, 1000);
    };

    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex-1 flex flex-col">
                <div className="p-3 bg-background border-b border-card-border">
                    <div className="flex items-center gap-2">
                        <button onClick={onBack} className="p-1 rounded-lg hover:bg-card-hover transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                        <span className="font-semibold text-foreground">{otherParticipant?.displayName || 'Chat'}</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-background min-h-0">
                    {loading ? (
                        <div className="text-center text-foreground-muted mt-10 font-medium animate-pulse">Loading messages...</div>
                    ) : messagesError ? (
                        <div className="text-center mt-10">
                            <p className="text-sm text-error font-medium">{messagesError}</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isOwn = normalizeSenderId(msg)?.toString() === currentUserId?.toString();
                            return (
                                <div key={msg._id || `temp-${msg.createdAt}`} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] sm:max-w-[75%] rounded-2xl px-3.5 py-2 shadow-sm ${isOwn
                                        ? 'bg-primary text-primary-foreground rounded-br-none'
                                        : 'bg-card border border-card-border text-foreground rounded-bl-none'}
                                    }`}>
                                        <p className="text-sm leading-relaxed">{msg.text}</p>
                                        <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isOwn ? 'text-primary-foreground/80' : 'text-foreground-muted'}`}>
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
                </div>

                <div ref={messagesEndRef} />

                {suggestions.length > 0 && (
                    <div className="px-3 py-2 flex gap-2 overflow-x-auto bg-card border-t border-card-border shrink-0">
                        <div className="flex items-center text-xs text-primary font-medium mr-1 shrink-0">
                            <Sparkles className="w-3 h-3 mr-1" /> AI:
                        </div>
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => setNewMessage(s)}
                                className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary hover:bg-primary/20 transition-colors whitespace-nowrap shrink-0"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                {isTyping && (
                    <div className="px-3 py-2 text-xs text-foreground-muted italic animate-pulse bg-card border-t border-card-border shrink-0">
                        {otherParticipant?.displayName} is typing...
                    </div>
                )}

                <form onSubmit={handleSend} className="p-2.5 bg-card border-t border-card-border flex gap-2 items-end shrink-0">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={handleInputChange}
                        placeholder="Type a message..."
                        className="flex-1 bg-background border border-card-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary/50 transition-all shadow-inner min-h-[44px]"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="tap-target p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-colors shadow-md min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>

            {post && (
                <div className="border-b border-card-border bg-card/30 shrink-0">
                    <button
                        onClick={() => setPostCollapsed(!postCollapsed)}
                        className="w-full px-3 py-2.5 flex items-center justify-between text-sm hover:bg-card-hover transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            {post.images?.[0] ? (
                                <img src={post.images[0]} alt="" className="w-8 h-8 rounded-lg object-cover" />
                            ) : (
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    {post.type === 'service' ? <Wrench className="w-4 h-4" /> : post.type === 'job' ? <Briefcase className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
                                </div>
                            )}
                            <div className="text-left">
                                <span className="font-semibold text-foreground">{post.title}</span>
                                {post.price && <span className="ml-2 text-primary font-semibold">{currencySymbol}{post.price}</span>}
                            </div>
                        </div>
                        <ChevronDown className="w-4 h-4 text-foreground-muted" />
                    </button>
                    {!postCollapsed && (
                        <div className="px-3 pb-3">
                            <div
                                onClick={() => navigate(`/post/${post._id}`)}
                                className="p-3 rounded-xl bg-card border border-card-border hover:border-primary/30 cursor-pointer transition-colors space-y-2"
                            >
                                <p className="text-sm text-foreground leading-relaxed line-clamp-3">{post.description}</p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs text-foreground-muted">
                                        <span className="capitalize">{post.type}</span>
                                        {post.location && (
                                            <>
                                                <span>•</span>
                                                <span>{post.location}</span>
                                            </>
                                        )}
                                    </div>
                                    <span className="flex items-center gap-1 text-xs text-primary font-medium">
                                        View Details <ExternalLink className="w-3 h-3" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ChatWindow;