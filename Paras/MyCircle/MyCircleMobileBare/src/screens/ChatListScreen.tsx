import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ArrowLeft, MessageCircle } from 'lucide-react-native';

import { useFocusEffect } from '@react-navigation/native';

const ChatListScreen = ({ navigation }: any) => {
    const auth = useAuth() as any;
    const { socket } = useSocket() as any;
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleRequestsPress = () => {
        navigation.navigate('Requests');
    };

    const [typingUsers, setTypingUsers] = useState<{ [key: string]: boolean }>({});

    // Refresh conversations when screen gains focus
    useFocusEffect(
        React.useCallback(() => {
            fetchConversations();
        }, [])
    );

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = () => {
            fetchConversations();
        };

        const handleMessagesRead = () => {
            fetchConversations();
        };

        const handleTypingStart = (data: any) => {
            setTypingUsers(prev => ({ ...prev, [data.conversationId]: true }));
        };

        const handleTypingStop = (data: any) => {
            setTypingUsers(prev => ({ ...prev, [data.conversationId]: false }));
        };

        socket.on('receive_message', handleNewMessage);
        socket.on('messages_read', handleMessagesRead);
        socket.on('user_typing', handleTypingStart);
        socket.on('user_stop_typing', handleTypingStop);

        return () => {
            socket.off('receive_message', handleNewMessage);
            socket.off('messages_read', handleMessagesRead);
            socket.off('user_typing', handleTypingStart);
            socket.off('user_stop_typing', handleTypingStop);
        };
    }, [socket]);

    const fetchConversations = async () => {
        try {
            const res = await api.get('/chat/conversations');
            setConversations(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const otherUser = item.participants.find((p: any) => p._id !== auth?.user?._id);
        const lastMsg = item.lastMessage;
        const hasUnread = item.unreadCount > 0;

        return (
            <TouchableOpacity
                onPress={() => navigation.navigate('ChatWindow', { id: item._id, recipient: otherUser })}
                style={[styles.conversationItem, hasUnread && styles.unreadConversation]}
            >
                <Image
                    source={{ uri: otherUser?.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${otherUser?.displayName}` }}
                    style={styles.avatar}
                />
                <View style={styles.contentContainer}>
                    <View style={styles.nameRow}>
                        <Text style={[styles.userName, hasUnread && styles.unreadText]}>{otherUser?.displayName}</Text>
                        <Text style={styles.timeText}>
                            {item.updatedAt ? new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </Text>
                    </View>
                    {typingUsers[item._id] ? (
                        <Text style={[styles.lastMessage, { color: '#8b5cf6', fontWeight: '600' }]} numberOfLines={1}>
                            Typing...
                        </Text>
                    ) : (
                        <Text style={[styles.lastMessage, hasUnread && styles.unreadMessage]} numberOfLines={1}>
                            {lastMsg ? lastMsg.text : 'Start a conversation'}
                        </Text>
                    )}
                </View>
                {hasUnread && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft color="white" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Messages</Text>
                </View>
                {/* Requests Button */}
                <TouchableOpacity onPress={() => navigation.navigate('Requests')} style={{ padding: 8 }}>
                    <MessageCircle color="#8b5cf6" size={24} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#8b5cf6" size="large" />
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={item => (item as any)._id}
                    renderItem={renderItem}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={fetchConversations} tintColor="#8b5cf6" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MessageCircle size={48} color="#27272a" />
                            <Text style={styles.emptyText}>No conversations yet.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    conversationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        backgroundColor: 'rgba(24, 24, 27, 0.3)', // zinc-900/30
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#27272a',
    },
    contentContainer: {
        flex: 1,
        marginLeft: 16,
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    userName: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    timeText: {
        color: '#71717a',
        fontSize: 12,
    },
    lastMessage: {
        color: '#a1a1aa',
        fontSize: 14,
        marginTop: 4,
    },
    unreadBadge: {
        backgroundColor: '#8b5cf6',
        borderRadius: 10,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    unreadCount: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
    },
    emptyText: {
        color: '#71717a',
        marginTop: 16,
        fontSize: 16,
    },
    unreadConversation: {
        backgroundColor: 'rgba(139, 92, 246, 0.05)',
        borderLeftWidth: 3,
        borderLeftColor: '#8b5cf6',
    },
    unreadText: {
        fontWeight: '900',
        color: '#ffffff',
    },
    unreadMessage: {
        color: '#ffffff',
        fontWeight: '600',
    },
});

export default ChatListScreen;
