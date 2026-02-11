import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, MessageCircle, ChevronRight } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
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

const ChatListScreen = ({ navigation }: any) => {
    const auth = useAuth() as any;
    const { socket } = useSocket() as any;
    const { colors } = useTheme();
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

    const themeStyles = {
        container: { backgroundColor: colors.background },
        text: { color: colors.text },
        textSecondary: { color: colors.textSecondary },
        card: { backgroundColor: colors.card, borderColor: colors.border },
        border: { borderColor: colors.border },
        highlight: { backgroundColor: colors.primary + '10', borderLeftColor: colors.primary },
        icon: colors.text
    };

    const renderItem = ({ item, index }: { item: any, index: number }) => {
        const otherUser = item.participants.find((p: any) => p._id !== auth?.user?._id);
        const lastMsg = item.lastMessage;
        const hasUnread = item.unreadCount > 0;

        return (
            <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('ChatWindow', { id: item._id, recipient: otherUser })}
                    activeOpacity={0.7}
                    style={styles.conversationItemWrapper}
                >
                    <GlassView intensity={hasUnread ? 15 : 5} borderRadius={24} style={[styles.conversationGlass, hasUnread ? styles.unreadGlassBorder : {}]}>
                        <View style={styles.conversationItemInner}>
                            <View style={styles.avatarWrapper}>
                                <Image
                                    source={{ uri: otherUser?.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${otherUser?.displayName}` }}
                                    style={styles.avatar}
                                />
                                {hasUnread && <View style={styles.activeIndicator} />}
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
                            <ChevronRight size={18} color="rgba(255,255,255,0.2)" />
                        </View>
                    </GlassView>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <FloatingShape color="rgba(175, 37, 244, 0.15)" size={300} top={-50} left={-100} delay={0} />
            <FloatingShape color="rgba(37, 181, 244, 0.1)" size={250} top={SCREEN_HEIGHT * 0.4} left={SCREEN_WIDTH * 0.6} delay={1000} />

            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft color="#fff" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Messages</Text>
                </View>
            </View>

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
                                <MessageCircle size={48} color="rgba(255,255,255,0.2)" />
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
        backgroundColor: '#09090b',
    },
    header: {
        paddingHorizontal: 24,
        paddingVertical: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '900',
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
    conversationGlass: {
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    unreadGlassBorder: {
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
        borderColor: '#09090b',
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
        fontWeight: 'bold',
        fontSize: 18,
        color: '#ffffff',
    },
    unreadText: {
        color: '#af25f4',
    },
    timeText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    lastMessage: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
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
        fontWeight: '900',
    },
    typingIndicator: {
        fontSize: 14,
        color: '#af25f4',
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
        paddingTop: 100,
    },
    emptyIconWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.03)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 16,
        fontWeight: '500',
    },
    floatingShape: {
        position: 'absolute',
        opacity: 0.6,
    },
});

export default ChatListScreen;
