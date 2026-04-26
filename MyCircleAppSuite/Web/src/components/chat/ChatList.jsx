import React from 'react';
import { MessageCircle, Trash2 } from 'lucide-react';
import api from '../../utils/api';
import { useDialog } from '../../hooks/useDialog';
import { useToast } from '../ui/Toast';
import { getAvatarUrl } from '../../utils/avatar';

const ChatList = ({ conversations, selectedId, onSelect, loading, currentUserId, onConversationDeleted, typingUsers = {} }) => {
    const dialog = useDialog();
    const { success, error } = useToast();

    const handleDelete = async (e, conversationId) => {
        e.stopPropagation();
        const confirmed = await dialog.confirm(
            'Are you sure you want to delete this conversation? This action cannot be undone.',
            'Delete Conversation'
        );
        if (!confirmed) return;

        try {
            await api.delete(`/chat/conversation/${conversationId}`);
            if (onConversationDeleted) {
                onConversationDeleted(conversationId);
            }
            if (selectedId && selectedId === conversationId) {
                onSelect(null);
            }
            success('Conversation deleted');
        } catch (err) {
            console.error(err);
            error('Failed to delete conversation');
        }
    };

    if (loading) return <div className="p-4 text-center text-foreground-muted font-medium">Loading chats...</div>;

    if (conversations.length === 0) {
        return <div className="p-8 text-center text-foreground-muted font-medium">No conversations yet.</div>;
    }

    return (
        <div className="flex flex-col">
            {conversations.map(conv => {
                const strUserId = currentUserId?.toString();
                const otherParticipant = conv.participants?.find(p => p._id?.toString() !== strUserId) || conv.participants?.[0];
                const isSelected = selectedId === conv._id;
                const isUnread = conv.unreadCount > 0;

                if (!otherParticipant) {
                    console.warn('No other participant found for conversation:', conv._id);
                    return null;
                }

                return (
                    <div key={conv._id} className="relative group">
                        <button
                            onClick={() => onSelect(conv)}
                            className={`w-full px-3 py-3 flex items-center gap-3 hover:bg-card-hover transition-colors text-left border-b border-card-border ${isSelected ? 'bg-primary/10 border-l-4 border-l-primary' : ''}`}
                        >
                            <div className="relative shrink-0">
                                <div className="w-11 h-11 rounded-full bg-background overflow-hidden ring-2 ring-card-border">
                                    <img
                                        src={getAvatarUrl(otherParticipant)}
                                        alt={otherParticipant?.displayName}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {otherParticipant?.isOnline && (
                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background"></div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h3 className={`truncate text-sm ${isUnread ? 'font-bold' : 'font-semibold'} text-foreground`}>
                                        {otherParticipant?.displayName}
                                    </h3>
                                    <span className="text-[11px] text-foreground-muted shrink-0 ml-2">
                                        {conv.updatedAt ? new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className={`text-xs truncate ${isUnread ? 'text-foreground font-medium' : 'text-foreground-muted'}`}>
                                        {typingUsers[conv._id] ? (
                                            <span className="text-primary font-semibold animate-pulse">Typing...</span>
                                        ) : conv.lastMessage ? (
                                            <span>
                                                {conv.lastMessage.sender?.toString() === strUserId && 'You: '}
                                                {conv.lastMessage.text}
                                            </span>
                                        ) : (
                                            <span className="italic">Start a conversation</span>
                                        )}
                                    </p>
                                    {conv.unreadCount > 0 && (
                                        <div className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ml-2 shrink-0">
                                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </button>
                        <button
                            onClick={(e) => handleDelete(e, conv._id)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-foreground-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-card/80 rounded-full backdrop-blur-sm shadow-md"
                            title="Delete Conversation"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default ChatList;
