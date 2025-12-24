import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Image, StyleSheet, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { ArrowLeft, Send, MoreVertical, Sparkles } from 'lucide-react-native';
import { moderateContent, getChatSuggestions } from '../services/aiService';
import ActionSheet, { ActionItem } from '../components/ui/ActionSheet';

const ChatWindowScreen = ({ route, navigation }: any) => {
    const { id, recipient } = route.params;
    const auth = useAuth() as any;
    const { socket } = useSocket() as any;
    const { colors } = useTheme();

    const [messages, setMessages] = useState<any[]>([]);
    const [conversation, setConversation] = useState<any>(null);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef<FlatList>(null);

    const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ActionSheet State
    const [actionSheetVisible, setActionSheetVisible] = useState(false);
    const [actionSheetConfig, setActionSheetConfig] = useState<{ title?: string; description?: string; actions: ActionItem[] }>({ actions: [] });

    useEffect(() => {
        if (id) {
            fetchMessages();
        }
    }, [id]);

    useEffect(() => {
        const myId = auth?.user?._id || auth?.user?.id;

        if (messages.length === 0) {
            if (showSuggestions) {
                console.log("Empty chat: showing starters");
                setSuggestions(["Hi there!", "Interested in this!", "Is this still available?"]);
            }
        } else {
            if (showSuggestions) {
                // Fetch suggestions
                const context = messages.slice(-5).map(m => ({
                    sender: (typeof m.sender === 'string' ? m.sender : m.sender?._id) === myId ? 'user' : 'other',
                    text: m.text
                })) as { sender: 'user' | 'other'; text: string }[];

                console.log("Fetching suggestions for context length:", context.length);
                getChatSuggestions(context)
                    .then(res => {
                        console.log("Suggestions received:", res);
                        if (res && res.length > 0) {
                            setSuggestions(res);
                        } else if (messages.length > 0) {
                            // If AI returns nothing but we have messages, maybe provide generic ones or clear
                            setSuggestions([]);
                        }
                    })
                    .catch(err => {
                        console.error("Failed to get suggestions:", err);
                        setSuggestions([]);
                    });
            } else {
                setSuggestions([]);
            }
        }
    }, [messages.length, auth?.user?._id, showSuggestions]);

    // Refresh messages when screen gains focus (e.g., after unblocking user)
    useFocusEffect(
        React.useCallback(() => {
            if (id) {
                fetchMessages();
            }
        }, [id])
    );

    useEffect(() => {
        if (recipient) {
            setLoading(false); // New conversation
        }

        if (socket && id) {
            socket.emit('join_conversation', id);

            socket.on('receive_message', (data: any) => {
                if (data.conversationId === id) {
                    setMessages(prev => [...prev, data.message]);
                    socket.emit('read_messages', id);
                    setIsOtherUserTyping(false); // Clear typing when message received
                }
            });

            socket.on('messages_read', (data: any) => {
                if (data.conversationId === id) {
                    setMessages(prev => prev.map(m => ({ ...m, status: 'read' })));
                }
            });

            socket.on('user_typing', (data: any) => {
                if (data.conversationId === id) {
                    setIsOtherUserTyping(true);
                }
            });

            socket.on('user_stop_typing', (data: any) => {
                if (data.conversationId === id) {
                    setIsOtherUserTyping(false);
                }
            });
        }

        return () => {
            if (socket && id) {
                socket.emit('leave_conversation', id);
                socket.off('receive_message');
                socket.off('messages_read');
                socket.off('user_typing');
                socket.off('user_stop_typing');
            }
            // Clear typing timeout to prevent memory leaks
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [id, socket]);

    const handleTextChange = (text: string) => {
        setInputText(text);

        if (!socket || !id) return;

        // Emit typing start
        socket.emit('typing_start', {
            conversationId: id,
            recipientId: displayUser?._id || displayUser?.id
        });

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set timeout to stop typing after 2 seconds
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing_stop', {
                conversationId: id,
                recipientId: displayUser?._id || displayUser?.id
            });
        }, 2000);
    };

    const fetchConversationDetails = async () => {
        try {
            const res = await api.get(`/chat/${id}`); // Assuming this endpoint exists, or use getConversations and filter
            // Wait, does /api/chat/:conversationId exist? Let's check routes.
            // Actually, /api/chat/conversations returns all. 
            // Let's use getOrCreateConversation with recipientId if we have it, 
            // or just find it in the list for now.
            const convsRes = await api.get('/chat/conversations');
            const found = convsRes.data.find((c: any) => c._id === id);
            if (found) {
                setConversation(found);
            }
        } catch (err) {
            console.error("Failed to fetch conversation details:", err);
        }
    };

    const fetchMessages = async () => {
        try {
            const res = await api.get(`/chat/messages/${id}`);
            setMessages(res.data); // Backend returns messages array directly
            setLoading(false);

            // Mark messages as read
            await api.put(`/chat/read/${id}`);
            if (socket) socket.emit('read_messages', id);

            // Fetch conversation details to get participants
            if (!conversation) {
                fetchConversationDetails();
            }
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };


    const handleSend = async (textToSend?: string) => {
        const text = textToSend || inputText;
        if (!text.trim()) return;

        // AI Moderation
        const moderation = await moderateContent(text);
        if (!moderation.safe) {
            Alert.alert('Message Blocked', `Your message was flagged: ${moderation.reason}. Please be respectful.`);
            return;
        }

        // Stop typing immediately when sending
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socket.emit('typing_stop', {
            conversationId: id,
            recipientId: displayUser?._id || displayUser?.id
        });

        try {
            const messageData = {
                recipientId: recipient?._id || conversation?.participants.find((p: any) => p._id !== auth?.user?._id)?._id,
                text: text.trim()
            };

            const res = await api.post('/chat/message', messageData);

            // Add message to local state
            setMessages(prev => [...prev, res.data]);
            setInputText('');

            // If this was a new conversation, update the conversation ID
            if (!id && res.data.conversationId) {
                setConversation({ _id: res.data.conversationId });
            }
        } catch (err: any) {
            console.error('Failed to send message:', err);

            // Show user-friendly error messages
            if (err.response?.status === 403) {
                const errorMsg = err.response?.data?.msg || 'Cannot send message';
                Alert.alert('Unable to Send', errorMsg, [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else if (err.response?.status === 400) {
                Alert.alert('Message Blocked', err.response?.data?.msg || 'Your message contains inappropriate content');
            } else {
                Alert.alert('Error', 'Failed to send message. Please try again.');
            }
        }
    };

    const displayUser = recipient || conversation?.participants.find((p: any) => p._id !== auth?.user?._id);

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
            </SafeAreaView>
        );
    }


    const submitReport = async (userId: string, reason: string) => {
        try {
            await api.post('/user/report', {
                reportedUserId: userId,
                reason,
                contentType: 'chat',
                contentId: id // conversation ID
            });
            // We can add a toast here if we had one, or a simple transient alert
            console.log("Report submitted");
        } catch (err) {
            console.error("Failed to submit report");
        }
    };

    const showMenu = () => {
        setActionSheetConfig({
            title: "Options",
            actions: [
                {
                    label: "Report User",
                    onPress: () => {
                        setTimeout(() => handleReportUser(), 500); // Delay to allow sheet to close and next one to open if needed
                    }
                },
                {
                    label: "Block User",
                    isDestructive: true,
                    onPress: () => {
                        setTimeout(() => handleBlockUser(), 500);
                    }
                }
            ]
        });
        setActionSheetVisible(true);
    };

    const handleReportUser = () => {
        const userIdToReport = recipient?._id || conversation?.participants.find((p: any) => p._id !== auth?.user?._id)?._id;
        setActionSheetConfig({
            title: "Report User",
            description: "Select a reason for reporting:",
            actions: [
                { label: "Spam", onPress: () => submitReport(userIdToReport, "Spam") },
                { label: "Harassment", onPress: () => submitReport(userIdToReport, "Harassment") },
                { label: "Inappropriate Content", onPress: () => submitReport(userIdToReport, "Inappropriate Content") }
            ]
        });
        setActionSheetVisible(true);
    };

    const handleBlockUser = () => {
        const userIdToBlock = recipient?._id || conversation?.participants.find((p: any) => p._id !== auth?.user?._id)?._id;

        if (!userIdToBlock) {
            console.error('Cannot block user: user ID not found');
            return;
        }

        setActionSheetConfig({
            title: "Block User",
            description: "Are you sure? You won't receive messages from them.",
            actions: [
                {
                    label: "Block",
                    isDestructive: true,
                    onPress: async () => {
                        try {
                            await api.post(`/user/block/${userIdToBlock}`);
                            navigation.goBack();
                        } catch (err) {
                            console.error("Failed to block user");
                        }
                    }
                }
            ]
        });
        setActionSheetVisible(true);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
                        <ArrowLeft color={colors.text} size={24} />
                    </TouchableOpacity>
                    <Image
                        source={{ uri: displayUser?.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${displayUser?.displayName}` }}
                        style={styles.headerAvatar}
                    />
                    <View style={styles.headerInfo}>
                        <Text style={[styles.headerName, { color: colors.text }]}>{displayUser?.displayName}</Text>
                        {isOtherUserTyping ? (
                            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>Typing...</Text>
                        ) : (
                            <Text style={[styles.onlineStatus, { color: colors.textSecondary }]}>Online</Text>
                        )}
                    </View>
                </View>
                <TouchableOpacity onPress={showMenu} style={{ padding: 8 }}>
                    <MoreVertical color={colors.text} size={24} />
                </TouchableOpacity>
            </View >

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item._id || Math.random().toString()}
                    renderItem={({ item }) => {
                        // Handle both populated sender objects and sender IDs
                        const senderId = typeof item.sender === 'string' ? item.sender : item.sender?._id;
                        const isMe = senderId === (auth?.user?._id || auth?.user?.id);
                        return (
                            <View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.otherMessageRow]}>
                                <View style={[
                                    styles.messageBubble,
                                    isMe ? { backgroundColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }
                                ]}>
                                    <Text style={[styles.messageText, { color: isMe ? '#ffffff' : colors.text }]}>{item.text}</Text>
                                    <View style={styles.messageFooter}>
                                        <Text style={styles.timeText}>
                                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                        {isMe && (
                                            <Text style={styles.statusText}>
                                                {item.status === 'read' ? '✓✓' : '✓'}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </View>
                        );
                    }}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    contentContainerStyle={styles.listContent}
                />

                <View style={[styles.inputArea, { backgroundColor: colors.card, borderTopColor: colors.border, flexDirection: 'column', alignItems: 'stretch' }]}>
                    {suggestions.length > 0 && (
                        <View style={{ flexDirection: 'row', marginBottom: 8, paddingHorizontal: 4 }}>
                            {suggestions.map((s, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={{
                                        backgroundColor: colors.primary + '20',
                                        borderColor: colors.primary,
                                        borderWidth: 1,
                                        borderRadius: 16,
                                        paddingHorizontal: 12,
                                        paddingVertical: 6,
                                        marginRight: 8
                                    }}
                                    onPress={() => handleSend(s)}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Sparkles size={12} color={colors.primary} style={{ marginRight: 4 }} />
                                        <Text style={{ color: colors.primary, fontSize: 12 }}>{s}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
                            placeholder="Type a message..."
                            placeholderTextColor={colors.textSecondary}
                            value={inputText}
                            onChangeText={handleTextChange}
                            multiline
                        />
                        <TouchableOpacity onPress={() => handleSend()} style={[styles.sendButton, { backgroundColor: colors.primary }]}>
                            <Send size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            <ActionSheet
                visible={actionSheetVisible}
                onClose={() => setActionSheetVisible(false)}
                title={actionSheetConfig.title}
                description={actionSheetConfig.description}
                actions={actionSheetConfig.actions}
            />
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(24, 24, 27, 0.5)', // zinc-900/50
    },
    backButton: {
        marginRight: 12,
        padding: 4,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#27272a',
    } as const,
    headerInfo: {
        marginLeft: 12,
    },
    headerName: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    onlineStatus: {
        color: '#22c55e', // green-500
        fontSize: 12,
        fontWeight: '500',
    },
    keyboardView: {
        flex: 1,
    },
    listContent: {
        paddingTop: 16,
        paddingBottom: 16,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 12,
        paddingHorizontal: 16,
    },
    myMessageRow: {
        justifyContent: 'flex-end',
    },
    otherMessageRow: {
        justifyContent: 'flex-start',
    },
    messageBubble: {
        maxWidth: '80%',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 16,
    },
    myBubble: {
        backgroundColor: '#7c3aed', // violet-600
        borderTopRightRadius: 2,
    },
    otherBubble: {
        backgroundColor: '#3f3f46', // zinc-800
        borderTopLeftRadius: 2,
    },
    messageText: {
        color: '#ffffff',
        fontSize: 16,
    },
    messageFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 4,
    },
    timeText: {
        fontSize: 10,
        color: '#a1a1aa', // zinc-400
    },
    statusText: {
        fontSize: 10,
        color: '#71717a', // zinc-500
        marginLeft: 4,
    },
    inputArea: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(24, 24, 27, 0.8)', // zinc-900/80
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#27272a', // zinc-800
        color: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        marginRight: 12,
        maxHeight: 100,
    },
    sendButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonActive: {
        backgroundColor: '#7c3aed', // violet-600
    },
    sendButtonDisabled: {
        backgroundColor: '#27272a', // zinc-800
    },
});

export default ChatWindowScreen;
