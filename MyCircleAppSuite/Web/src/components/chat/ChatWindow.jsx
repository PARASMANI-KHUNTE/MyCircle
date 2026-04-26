import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { Send, ArrowLeft, Shield, Flag, Check, CheckCheck, Sparkles, ExternalLink, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { getSmartSuggestions } from '../../utils/smartSuggestions';
import { useDialog } from '../../hooks/useDialog';
import { getAvatarUrl } from '../../utils/avatar';
import { useCurrencySymbol } from '../../context/CurrencySymbolContext';

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
    const [postLoading, setPostLoading] = useState(false);
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

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const markAsRead = async () => {
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
    };

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
    }, [conversation._id]);

    useEffect(() => {
        if (!conversation._id) return;
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
    }, [socket, conversation._id, currentUserId, dialog, onBack]);

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

        let tempMessage;
        try {
            const tempId = `temp-${Date.now()}`;
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
                recipientId: otherParticipant._id || otherParticipant.id || otherParticipant,
                text: tempMessage.text,
                postId: conversation.postId?._id || conversation.postId
            });

            setMessages(prev => prev.map((message) =>
                message._id === tempId ? response.data : message
            ));
        } catch (err) {
            console.error("Failed to send", err);
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
            `Block ${otherParticipant.displayName}? This hides the conversation, removes request links between you, and stops future messaging until you unblock them.`,
            'Block User'
        );
        if (!confirmed) return;

        try {
            const res = await api.post(`/user/block/${otherParticipant._id}`);
            success(res.data?.msg || 'User blocked');
            onBack();
        } catch (err) {
            showError(err.response?.data?.msg || 'Failed to block user');
        }
    };

    const handleReport = async () => {
        const confirmed = await dialog.confirm(
            `Report ${otherParticipant.displayName}? Please report only genuine safety or policy concerns.`,
            'Report User'
        );
        if (!confirmed) return;

        const reason = await dialog.prompt(
            `Choose a reason and add useful detail.\nExamples: ${REPORT_REASON_OPTIONS.join(', ')}`,
            'Report User',
            ''
        );
        const trimmedReason = reason?.trim();
        if (!trimmedReason) return;

        try {
            const res = await api.post('/user/report', {
                reportedUserId: otherParticipant._id,
                reason: trimmedReason,
                category: mapReportCategory(trimmedReason),
                contentType: 'chat',
                contentId: conversation._id
            });
            success(res.data?.msg || 'Report submitted');
        } catch (err) {
            showError(err.response?.data?.msg || 'Failed to report');
        }
    };

    if (!otherParticipant) {
        return (
            <div className="flex-1 flex items-center justify-center text-text-muted">
                Conversation not found
            </div>
        );
    }

    if (isDisabled) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-foreground-muted p-6 sm:p-8 text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                    <X className="w-7 h-7 sm:w-8 sm:h-8 text-red-500" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Conversation Ended</h3>
                <p className="text-sm mb-4 sm:mb-6 max-w-xs">This chat is no longer active because the post was deleted.</p>
                <button 
                    onClick={onBack}
                    className="tap-target px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors w-full sm:w-auto"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="px-3 py-2.5 border-b border-card-border flex items-center justify-between bg-card/50 shrink-0">
                <div className="flex items-center gap-2.5">
                    <button 
                        onClick={onBack} 
                        className="tap-target p-2 -ml-2 rounded-lg hover:bg-card-hover text-foreground-muted transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-9 h-9 rounded-full bg-background overflow-hidden border border-card-border">
                        <img
                            src={getAvatarUrl(otherParticipant)}
                            alt={otherParticipant?.displayName}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground text-sm">{otherParticipant?.displayName}</h3>
                        {otherParticipant?.isOnline && (
                            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                Online
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex gap-1">
                    <button onClick={handleBlock} className="tap-target p-2 rounded-lg text-foreground-muted hover:text-red-500 hover:bg-red-500/10 transition-colors" title="Block User">
                        <Shield className="w-4 h-4" />
                    </button>
                    <button onClick={handleReport} className="tap-target p-2 rounded-lg text-foreground-muted hover:text-yellow-600 hover:bg-yellow-600/10 transition-colors" title="Report User">
                        <Flag className="w-4 h-4" />
                    </button>
                </div>
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
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm">
                                    {post.type === 'service' ? '🔧' : post.type === 'job' ? '💼' : '🏷️'}
                                </div>
                            )}
                            <div className="text-left">
                                <span className="font-semibold text-foreground">{post.title}</span>
                                {post.price && <span className="ml-2 text-primary font-semibold">{currencySymbol}{post.price}</span>}
                            </div>
                        </div>
                        {postCollapsed ? (
                            <ChevronDown className="w-4 h-4 text-foreground-muted" />
                        ) : (
                            <ChevronUp className="w-4 h-4 text-foreground-muted" />
                        )}
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
                        const showPostCard = msg.isAutoMessage || msg.postId;
                        return (
                            <div key={msg._id || `temp-${msg.createdAt}`} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] sm:max-w-[75%] rounded-2xl px-3.5 py-2 shadow-sm ${isOwn
                                    ? 'bg-primary text-primary-foreground rounded-br-none'
                                    : 'bg-card border border-card-border text-foreground rounded-bl-none'
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
                                {showPostCard && !postLoading && post && (
                                    <div className={`flex items-start ${isOwn ? 'order-[-1] mr-2' : 'ml-2'}`}>
                                        <div 
                                            onClick={() => navigate(`/post/${post._id}`)}
                                            className="w-14 h-14 rounded-lg overflow-hidden cursor-pointer border border-card-border hover:opacity-80 transition-opacity"
                                        >
                                            {post.images?.[0] && (
                                                <img 
                                                    src={post.images[0]} 
                                                    alt="" 
                                                    className="w-full h-full object-cover" 
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}

                <div ref={messagesEndRef} />
            </div>

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
    );
};

export default ChatWindow;
