import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Image, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { ArrowLeft, Send } from 'lucide-react-native';

const ChatWindowScreen = ({ route, navigation }: any) => {
    const { id, recipient } = route.params;
    const auth = useAuth() as any;
    const { socket } = useSocket() as any;

    const [messages, setMessages] = useState<any[]>([]);
    const [conversation, setConversation] = useState<any>(null);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef<FlatList>(null);

    const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (id) {
            fetchMessages();
        }
    }, [id]);

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

    const fetchMessages = async () => {
        try {
            const res = await api.get(`/chat/messages/${id}`);
            setMessages(res.data); // Backend returns messages array directly
            setLoading(false);

            // Mark messages as read
            await api.put(`/chat/read/${id}`);
            if (socket) socket.emit('read_messages', id);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };


    const handleSend = async () => {
        if (!inputText.trim()) return;

        // Stop typing immediately when sending
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socket.emit('typing_stop', {
            conversationId: id,
            recipientId: displayUser?._id || displayUser?.id
        });

        try {
            const messageData = {
                recipientId: recipient?._id || conversation?.participants.find((p: any) => p._id !== auth?.user?._id)?._id,
                text: inputText.trim()
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

    if (loading) return (
        <View style={[styles.container, styles.centerContent]}>
            <ActivityIndicator color="#8b5cf6" size="large" />
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color="white" size={24} />
                </TouchableOpacity>
                <Image
                    source={{ uri: displayUser?.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${displayUser?.displayName}` }}
                    style={styles.headerAvatar}
                />
                <View style={styles.headerInfo}>
                    <Text style={styles.headerName}>{displayUser?.displayName}</Text>
                    {isOtherUserTyping ? (
                        <Text style={{ color: '#8b5cf6', fontSize: 12, fontWeight: '600' }}>Typing...</Text>
                    ) : (
                        <Text style={styles.onlineStatus}>Online</Text>
                    )}
                </View>
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
                                    isMe ? styles.myBubble : styles.otherBubble
                                ]}>
                                    <Text style={styles.messageText}>{item.text}</Text>
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

                <View style={styles.inputArea}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor="#71717a"
                        value={inputText}
                        onChangeText={handleTextChange}
                        multiline
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={!inputText.trim()}
                        style={[
                            styles.sendButton,
                            inputText.trim() ? styles.sendButtonActive : styles.sendButtonDisabled
                        ]}
                    >
                        <Send color="white" size={20} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
