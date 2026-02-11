// Core chat window component for individual conversations
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Image, ActivityIndicator, Alert, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { Send, ArrowLeft, Shield, Flag, Check, CheckCheck, Sparkles, ChevronRight, MoreVertical } from 'lucide-react-native';
import { getSmartSuggestions } from '../utils/smartSuggestions';
import { getAvatarUrl } from '../utils/avatar';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay, Easing } from 'react-native-reanimated';
import GlassView from '../components/ui/GlassView';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FloatingShape = ({ delay = 0, color, size, top, left }: any) => {
    const translationY = useSharedValue(0);
    const translationX = useSharedValue(0);

    useEffect(() => {
        translationY.value = withRepeat(
            withSequence(
                withDelay(delay, withTiming(20, { duration: 3000, easing: Easing.inOut(Easing.sin) })),
                withTiming(-20, { duration: 3000, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
        );
        translationX.value = withRepeat(
            withSequence(
                withDelay(delay, withTiming(-15, { duration: 4000, easing: Easing.inOut(Easing.sin) })),
                withTiming(15, { duration: 4000, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translationY.value }, { translateX: translationX.value }],
    }));

    return (
        <Animated.View
            style={[
                styles.floatingShape,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: color,
                    top,
                    left,
                },
                animatedStyle,
            ]}
        />
    );
};

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

    const renderMessage = ({ item, index }: any) => {
        const isOwn = item.sender === user?._id;
        return (
            <Animated.View entering={FadeInDown.delay(index % 10 * 50).springify()}>
                <View style={{
                    alignSelf: isOwn ? 'flex-end' : 'flex-start',
                    marginVertical: 4,
                    maxWidth: '85%',
                }}>
                    <GlassView
                        intensity={isOwn ? 20 : 10}
                        borderRadius={20}
                        style={[
                            styles.messageGlass,
                            isOwn ? styles.ownMessageGlass : styles.receivedMessageGlass,
                            {
                                borderBottomRightRadius: isOwn ? 4 : 20,
                                borderBottomLeftRadius: isOwn ? 20 : 4,
                            }
                        ]}
                    >
                        <Text style={styles.messageText}>{item.text}</Text>
                        <View style={styles.messageFooter}>
                            <Text style={styles.messageTime}>
                                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                            {isOwn && (
                                item.status === 'read' ? <CheckCheck size={12} color="#af25f4" /> :
                                    item.status === 'delivered' ? <CheckCheck size={12} color="rgba(255,255,255,0.6)" /> :
                                        <Check size={12} color="rgba(255,255,255,0.4)" />
                            )}
                        </View>
                    </GlassView>
                </View>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <FloatingShape color="rgba(175, 37, 244, 0.15)" size={250} top={-50} left={-50} delay={0} />
            <FloatingShape color="rgba(37, 181, 244, 0.1)" size={200} top={SCREEN_HEIGHT * 0.7} left={SCREEN_WIDTH * 0.7} delay={1500} />

            {/* Glass Header */}
            <GlassView intensity={30} borderRadius={0} style={styles.headerGlass}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('UserProfile', { userId: otherParticipant?._id })}
                        style={styles.userInfo}
                    >
                        <View style={styles.avatarContainer}>
                            <Image
                                source={{ uri: getAvatarUrl(otherParticipant) }}
                                style={styles.avatar}
                            />
                            <View style={styles.onlineStatus} />
                        </View>
                        <View style={styles.userNameContainer}>
                            <Text style={styles.headerUserName}>{otherParticipant?.displayName}</Text>
                            <Text style={styles.statusText}>Online</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={handleBlock} className="p-2">
                            <Shield size={20} color="rgba(255,255,255,0.5)" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleReport} className="p-2">
                            <MoreVertical size={20} color="rgba(255,255,255,0.5)" />
                        </TouchableOpacity>
                    </View>
                </View>
            </GlassView>

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
                    contentContainerStyle={styles.listContent}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                    initialNumToRender={20}
                    showsVerticalScrollIndicator={false}
                />

                {isTyping && (
                    <Animated.Text
                        entering={FadeInDown}
                        style={styles.typingIndicator}
                    >
                        {otherParticipant?.displayName} is typing...
                    </Animated.Text>
                )}

                {/* Floating Input Bar */}
                <View style={styles.inputWrapper}>
                    {suggestions.length > 0 && (
                        <View className="mb-3 px-2 flex-row items-center">
                            <Sparkles size={14} color="#af25f4" className="mr-2" />
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
                                        className="bg-primary/10 px-4 py-2 rounded-full border border-primary/20 mr-2"
                                    >
                                        <Text className="text-primary text-xs font-bold">{item}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    )}

                    <GlassView intensity={30} borderRadius={32} style={styles.inputGlass}>
                        <View style={styles.inputInner}>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Type a message..."
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                value={newMessage}
                                onChangeText={handleInputChange}
                                multiline
                            />
                            <TouchableOpacity
                                onPress={handleSend}
                                disabled={!newMessage.trim()}
                                style={[styles.sendButton, !newMessage.trim() && { opacity: 0.5 }]}
                            >
                                <View style={styles.sendIconWrapper}>
                                    <Send size={20} color="white" />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </GlassView>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#09090b',
    },
    headerGlass: {
        paddingTop: Platform.OS === 'android' ? 10 : 0,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    userInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: 'rgba(175, 37, 244, 0.4)',
    },
    onlineStatus: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#10b981',
        borderWidth: 2,
        borderColor: '#09090b',
    },
    userNameContainer: {
        marginLeft: 12,
    },
    headerUserName: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },
    statusText: {
        color: '#10b981',
        fontSize: 12,
        fontWeight: '500',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    listContent: {
        padding: 20,
        paddingBottom: 100,
    },
    messageGlass: {
        padding: 14,
        borderWidth: 1,
    },
    ownMessageGlass: {
        backgroundColor: 'rgba(175, 37, 244, 0.15)',
        borderColor: 'rgba(175, 37, 244, 0.3)',
    },
    receivedMessageGlass: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderColor: 'rgba(255,255,255,0.1)',
    },
    messageText: {
        color: '#fff',
        fontSize: 16,
        lineHeight: 22,
    },
    messageFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 6,
    },
    messageTime: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
        marginRight: 6,
    },
    typingIndicator: {
        paddingHorizontal: 24,
        paddingBottom: 12,
        color: '#af25f4',
        fontSize: 12,
        fontStyle: 'italic',
    },
    inputWrapper: {
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 0 : 20,
    },
    inputGlass: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    inputInner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        paddingLeft: 16,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
        maxHeight: 100,
        paddingVertical: 12,
    },
    sendButton: {
        padding: 4,
    },
    sendIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#af25f4',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#af25f4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    floatingShape: {
        position: 'absolute',
        opacity: 0.5,
    },
});

export default ChatWindowScreen;
