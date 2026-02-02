// Core chat window component for individual conversations
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { Send, ArrowLeft, Shield, Flag, Check, CheckCheck, Sparkles } from 'lucide-react-native';
import { getSmartSuggestions } from '../utils/smartSuggestions';
import { getAvatarUrl } from '../utils/avatar';

const ChatWindowScreen = ({ route, navigation }: any) => {
    const { conversation } = route.params;
    const { socket } = useSocket();
    const { user } = useAuth();
    const { colors } = useTheme();
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const typingTimeoutRef = useRef<any>(null);

    const otherParticipant = conversation.participants?.find((p: any) => p._id !== user?._id) || conversation.participants?.[0];

    useEffect(() => {
        fetchMessages();
        markAsRead();
        generateSuggestions(conversation.lastMessage?.text || '');
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (data: any) => {
            if (data.conversationId === conversation._id) {
                setMessages(prev => {
                    if (prev.find(m => m._id === data.message._id)) return prev;
                    return [...prev, data.message];
                });
                // If message is from other user, generate suggestions and mark read
                if (data.message.sender !== user?._id) {
                    generateSuggestions(data.message.text);
                    markAsRead();
                }
            }
        };

        const handleReadReceipt = (data: any) => {
            if (data.conversationId === conversation._id && data.readerId !== user?._id) {
                setMessages(prev => prev.map(msg =>
                    msg.sender === user?._id ? { ...msg, status: 'read' } : msg
                ));
            }
        };

        const handleTypingStart = (data: any) => {
            if (data.conversationId === conversation._id && data.userId !== user?._id) {
                setIsTyping(true);
            }
        };

        const handleTypingStop = (data: any) => {
            if (data.conversationId === conversation._id) {
                setIsTyping(false);
            }
        };

        const handleConversationDeleted = (data: any) => {
            if (data.conversationId === conversation._id) {
                Alert.alert('Chat Closed', 'This conversation has been closed because the post is no longer available.', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        };

        socket.on('receive_message', handleReceiveMessage);
        socket.on('messages_read', handleReadReceipt);
        socket.on('user_typing', handleTypingStart);
        socket.on('user_stop_typing', handleTypingStop);
        socket.on('conversation_deleted', handleConversationDeleted);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
            socket.off('messages_read', handleReadReceipt);
            socket.off('user_typing', handleTypingStart);
            socket.off('user_stop_typing', handleTypingStop);
            socket.off('conversation_deleted', handleConversationDeleted);
        };
    }, [socket, conversation._id]);

    const fetchMessages = async () => {
        try {
            const res = await api.get(`/chat/messages/${conversation._id}`);
            setMessages(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const markAsRead = async () => {
        try {
            await api.put(`/chat/read/${conversation._id}`);
        } catch (err) {
            console.error(err);
        }
    };

    const generateSuggestions = (lastMsg = '') => {
        const newSuggestions = getSmartSuggestions(lastMsg);
        setSuggestions(newSuggestions.slice(0, 3));
    };

    const handleInputChange = (text: string) => {
        setNewMessage(text);
        if (!socket) return;

        // Typing indicator logic
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        else {
            socket.emit('typing_start', {
                conversationId: conversation._id,
                userId: user?._id,
                recipientId: otherParticipant?._id
            });
        }

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing_stop', {
                conversationId: conversation._id,
                userId: user?._id,
                recipientId: otherParticipant?._id
            });
            typingTimeoutRef.current = null;
        }, 1500);
    };

    const handleSend = async () => {
        if (!newMessage.trim()) return;

        const msgText = newMessage.trim();
        setNewMessage('');
        setSuggestions([]);

        const optimisticMsg = {
            _id: Date.now().toString(),
            sender: user?._id,
            text: msgText,
            status: 'sent',
            createdAt: new Date().toISOString()
        };

        setMessages(prev => [...prev, optimisticMsg]);

        try {
            await api.post('/chat/message', {
                recipientId: otherParticipant._id,
                text: msgText,
                postId: conversation.postId
            });
        } catch (err: any) {
            setMessages(prev => prev.filter(m => m._id !== optimisticMsg._id));
            Alert.alert('Error', err.response?.data?.msg || 'Failed to send message');
        }
    };

    const handleBlock = () => {
        Alert.alert(
            'Block User',
            `Are you sure you want to block ${otherParticipant.displayName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Block',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.post(`/user/block/${otherParticipant._id}`);
                            navigation.goBack();
                        } catch (err) {
                            Alert.alert('Error', 'Failed to block user');
                        }
                    }
                }
            ]
        );
    };

    const handleReport = () => {
        Alert.alert(
            'Report User',
            'Would you like to report this user for inappropriate behavior?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Report',
                    onPress: () => {
                        // In a real app, show a prompt for reason
                        Alert.alert('Report Submitted', 'Our team will review this conversation.');
                    }
                }
            ]
        );
    };

    const renderMessage = ({ item }: any) => {
        const isOwn = item.sender === user?._id;
        return (
            <View style={{
                alignSelf: isOwn ? 'flex-end' : 'flex-start',
                backgroundColor: isOwn ? colors.primary : colors.card,
                padding: 12,
                borderRadius: 16,
                borderBottomRightRadius: isOwn ? 4 : 16,
                borderBottomLeftRadius: isOwn ? 16 : 4,
                marginVertical: 4,
                maxWidth: '80%',
                borderWidth: 1,
                borderColor: colors.border
            }}>
                <Text style={{ color: isOwn ? 'white' : colors.text }}>{item.text}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4 }}>
                    <Text style={{ fontSize: 10, color: isOwn ? 'rgba(255,255,255,0.7)' : colors.textSecondary, marginRight: 4 }}>
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {isOwn && (
                        item.status === 'read' ? <CheckCheck size={12} color="#93c5fd" /> :
                            item.status === 'delivered' ? <CheckCheck size={12} color="rgba(255,255,255,0.7)" /> :
                                <Check size={12} color="rgba(255,255,255,0.4)" />
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>

                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
                    <Image
                        source={{ uri: getAvatarUrl(otherParticipant) }}
                        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.input }}
                    />
                    <View style={{ marginLeft: 12 }}>
                        <Text style={{ color: colors.text, fontWeight: 'bold' }}>{otherParticipant?.displayName}</Text>
                        <Text style={{ color: colors.success, fontSize: 12 }}>Online</Text>
                    </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 16 }}>
                    <TouchableOpacity onPress={handleBlock}>
                        <Shield size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleReport}>
                        <Flag size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item._id}
                    contentContainerStyle={{ padding: 16 }}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                    initialNumToRender={20}
                />

                {isTyping && (
                    <Text style={{ paddingHorizontal: 16, color: colors.textSecondary, fontSize: 12, fontStyle: 'italic', marginBottom: 8 }}>
                        {otherParticipant?.displayName} is typing...
                    </Text>
                )}

                <View style={{ borderTopWidth: 1, borderTopColor: colors.border, padding: 12 }}>
                    {suggestions.length > 0 && (
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                            <Sparkles size={14} color={colors.primary} />
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                data={suggestions}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setNewMessage(item);
                                            setSuggestions([]);
                                        }}
                                        style={{ backgroundColor: colors.primary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.primary + '30', marginRight: 8 }}
                                    >
                                        <Text style={{ color: colors.primary, fontSize: 12 }}>{item}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    )}

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <TextInput
                            style={{ flex: 1, backgroundColor: colors.input, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, color: colors.text, borderWidth: 1, borderColor: colors.border }}
                            placeholder="Type a message..."
                            placeholderTextColor={colors.textSecondary}
                            value={newMessage}
                            onChangeText={handleInputChange}
                            multiline
                        />
                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={!newMessage.trim()}
                            style={{ width: 44, height: 44, backgroundColor: colors.primary, borderRadius: 22, alignItems: 'center', justifyContent: 'center', opacity: newMessage.trim() ? 1 : 0.5 }}
                        >
                            <Send size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ChatWindowScreen;
