import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl, StyleSheet, Dimensions, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, MessageCircle, ChevronRight, CheckSquare, Square, X, Trash2, CheckCheck } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const getParticipantId = (participant: any) => participant?._id?.toString?.() || participant?.id?.toString?.();

const ChatListScreen = ({ navigation }: any) => {
    const auth = useAuth() as any;
    const { socket } = useSocket() as any;
    const { colors } = useTheme();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Selection state
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);

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

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedItems(newSelected);

        if (newSelected.size === 0) {
            setIsSelectionMode(false);
        }
    };

    const enterSelectionMode = (id: string) => {
        setIsSelectionMode(true);
        setSelectedItems(new Set([id]));
    };

    const exitSelectionMode = () => {
        setIsSelectionMode(false);
        setSelectedItems(new Set());
    };

    const handleBulkDelete = () => {
        Alert.alert(
            "Delete Conversations",
            `Delete ${selectedItems.size} conversation${selectedItems.size > 1 ? 's' : ''}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // Try to delete conversations one by one
                            await Promise.all(
                                Array.from(selectedItems).map(id => api.delete(`/chat/conversation/${id}`))
                            );
                            fetchConversations();
                            exitSelectionMode();
                        } catch (err: any) {
                            if (err.response?.status === 404) {
                                Alert.alert("Feature Not Available", "Delete conversation feature is coming soon.");
                            } else {
                                Alert.alert("Error", "Failed to delete conversations");
                            }
                            exitSelectionMode();
                        }
                    }
                }
            ]
        );
    };

    const handleMarkAsRead = async () => {
        try {
            await Promise.all(
                Array.from(selectedItems).map(id => api.put(`/chat/read/${id}`))
            );
            fetchConversations();
            exitSelectionMode();
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const themeStyles = {
        container: { backgroundColor: colors.background },
        text: { color: colors.text },
        textSecondary: { color: colors.textSecondary },
        card: { backgroundColor: colors.card, borderColor: colors.border },
        border: { borderColor: colors.border },
        highlight: { backgroundColor: colors.primary + '10', borderLeftColor: colors.primary },
        icon: colors.text
    };

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

    const renderItem = ({ item, index }: { item: any, index: number }) => {
        const currentUserId = auth?.user?._id?.toString?.() || auth?.user?.id?.toString?.();
        const otherUser = item.participants.find((p: any) => getParticipantId(p) !== currentUserId) || item.participants[0];
        const lastMsg = item.lastMessage;
        const hasUnread = item.unreadCount > 0;
        const isSelected = selectedItems.has(item._id);

        const Content = (
            <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
                <TouchableOpacity
                    onPress={() => {
                        if (isSelectionMode) {
                            toggleSelection(item._id);
                        } else {
                            navigation.navigate('ChatWindow', { conversation: item });
                        }
                    }}
                    onLongPress={() => enterSelectionMode(item._id)}
                    delayLongPress={300}
                    activeOpacity={0.7}
                    style={styles.conversationItemWrapper}
                >
                    <View style={[
                        styles.conversationCard, 
                        hasUnread ? styles.unreadCard : {},
                        isSelected ? styles.selectedCard : {}
                    ]}>
                        <View style={styles.conversationItemInner}>
                            {isSelectionMode && (
                                <View style={styles.checkboxContainer}>
                                    {isSelected ? (
                                        <CheckSquare size={24} color="#af25f4" />
                                    ) : (
                                        <Square size={24} color="#64748b" />
                                    )}
                                </View>
                            )}
                            <View style={styles.avatarWrapper}>
                                <Image
                                    source={{ uri: otherUser?.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${otherUser?.displayName}` }}
                                    style={styles.avatar}
                                />
                                {otherUser?.isOnline && <View style={styles.activeIndicator} />}
                            </View>

                            <View style={styles.contentContainer}>
                                <View style={styles.nameRow}>
                                    <Text style={[styles.userName, hasUnread && styles.unreadText]}>{otherUser?.displayName}</Text>
                                    <Text style={styles.timeText}>
                                        {item.updatedAt ? new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </Text>
                                </View>

                                {typingUsers[item._id] ? (
                                    <Text style={styles.typingIndicator} numberOfLines={1}>
                                        Typing...
                                    </Text>
                                ) : (
                                    <View style={styles.messageRow}>
                                        <Text style={[styles.lastMessage, hasUnread && styles.unreadMessageText]} numberOfLines={1}>
                                            {lastMsg ? lastMsg.text : 'Start a conversation'}
                                        </Text>
                                        {hasUnread && (
                                            <View style={styles.unreadCountBadge}>
                                                <Text style={styles.unreadCountText}>{item.unreadCount}</Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                            {!isSelectionMode && <ChevronRight size={18} color="#64748b" />}
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );

        return Content;
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            
            {/* Modern Gradient Background */}
            <View style={styles.backgroundGradient}>
                <View style={[styles.gradientLayer, { backgroundColor: '#0a0a0a' }]} />
                <View style={[styles.gradientLayer, { backgroundColor: '#1a1a2e', opacity: 0.8 }]} />
                <View style={[styles.gradientLayer, { backgroundColor: '#16213e', opacity: 0.6 }]} />
            </View>

            {/* Header */}
            {isSelectionMode ? (
                <View style={styles.header}>
                    <View style={styles.selectionHeader}>
                        <TouchableOpacity onPress={exitSelectionMode} style={styles.backButton}>
                            <X color="#ffffff" size={24} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{selectedItems.size} Selected</Text>
                        <View style={styles.selectionActions}>
                            <TouchableOpacity onPress={handleMarkAsRead} style={styles.actionButton}>
                                <CheckCheck size={22} color="#10b981" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleBulkDelete} style={styles.actionButton}>
                                <Trash2 size={22} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            ) : (
                <Animated.View entering={FadeInDown.delay(100).duration(600).springify()} style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft color="#ffffff" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Messages</Text>
                </Animated.View>
            )}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#af25f4" size="large" />
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={item => (item as any)._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={fetchConversations} tintColor="#af25f4" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconWrapper}>
                                <MessageCircle size={48} color="#af25f4" />
                            </View>
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
        backgroundColor: '#0a0a0a',
    },
    backgroundGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    gradientLayer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
        zIndex: 10,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: -0.5,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    conversationItemWrapper: {
        marginBottom: 12,
    },
    conversationCard: {
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
    },
    unreadCard: {
        borderColor: 'rgba(175, 37, 244, 0.3)',
        backgroundColor: 'rgba(175, 37, 244, 0.05)',
    },
    conversationItemInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    activeIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#10b981',
        borderWidth: 3,
        borderColor: '#0a0a0a',
    },
    contentContainer: {
        flex: 1,
        marginLeft: 16,
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    userName: {
        fontWeight: '700',
        fontSize: 18,
        color: '#ffffff',
    },
    unreadText: {
        color: '#af25f4',
    },
    timeText: {
        fontSize: 12,
        color: '#64748b',
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    lastMessage: {
        fontSize: 14,
        color: '#94a3b8',
        flex: 1,
        marginRight: 8,
    },
    unreadMessageText: {
        color: '#ffffff',
        fontWeight: '600',
    },
    unreadCountBadge: {
        backgroundColor: '#af25f4',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
        shadowColor: '#af25f4',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    unreadCountText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '700',
    },
    typingIndicator: {
        fontSize: 14,
        color: '#af25f4',
        fontWeight: '700',
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
        paddingTop: 100,
    },
    emptyIconWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(175, 37, 244, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: 16,
        fontWeight: '500',
    },
    // Selection styles
    selectedCard: {
        borderColor: '#af25f4',
        backgroundColor: 'rgba(175, 37, 244, 0.15)',
    },
    checkboxContainer: {
        marginRight: 12,
    },
    selectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectionActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
});

export default ChatListScreen;
