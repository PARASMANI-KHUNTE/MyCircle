import React, { useState, useCallback } from 'react';
import { View, Text, SectionList, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { Bell, MessageSquare, CheckCircle, Heart, Info, Trash2, X, CheckSquare, Square } from 'lucide-react-native';
import api from '../services/api';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';

import GlassView from '../components/ui/GlassView';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay, Easing } from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FloatingShape = ({ delay = 0, color, size, top, left }: any) => {
    const translationY = useSharedValue(0);
    const translationX = useSharedValue(0);

    React.useEffect(() => {
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

const NotificationsScreen = ({ navigation }: any) => {
    const { notifications, loading, refresh, markAllRead, handleNotificationClick } = useNotifications();
    const { colors } = useTheme();
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    const themeStyles = {
        container: { backgroundColor: colors.background },
        text: { color: colors.text },
        textSecondary: { color: colors.textSecondary },
        card: { backgroundColor: colors.card, borderColor: colors.border },
        border: { borderColor: colors.border },
        highlight: { backgroundColor: colors.primary + '10' },
        unreadCard: { backgroundColor: colors.card }, // Or slightly different?
        readCard: { backgroundColor: colors.background },
        selectedCard: { backgroundColor: colors.primary + '15' },
        icon: colors.text
    };

    const getIcon = (type: string) => {
        const size = 20;
        switch (type) {
            case 'request': return <MessageSquare size={size} color="#60a5fa" />;
            case 'approval': return <CheckCircle size={size} color="#4ade80" />;
            case 'like': return <Heart size={size} color="#f472b6" />;
            case 'info': return <Info size={size} color="#c084fc" />;
            default: return <Bell size={size} color={colors.textSecondary} />;
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/notifications/${id}`);
            refresh();
        } catch (err) {
            console.error('Failed to delete notification:', err);
        }
    };

    const handleBulkDelete = async () => {
        Alert.alert(
            "Delete Notifications",
            `Are you sure you want to delete ${selectedItems.size} notifications?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // Ideally, backend should support bulk delete. For now, we loop.
                            // Better approach: POST /notifications/bulk-delete { ids: [...] }
                            // Implementing loop for now to be safe with current API
                            await Promise.all(Array.from(selectedItems).map(id => api.delete(`/notifications/${id}`)));
                            refresh();
                            setIsSelectionMode(false);
                            setSelectedItems(new Set());
                        } catch (err) {
                            Alert.alert("Error", "Failed to delete some notifications");
                        }
                    }
                }
            ]
        );
    };

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

    // Grouping Logic
    const groupedNotifications = useCallback(() => {
        const groups: { [key: string]: any[] } = {
            'Today': [],
            'Yesterday': [],
            'Earlier': []
        };

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        notifications.forEach(item => {
            const itemDate = new Date(item.createdAt);
            itemDate.setHours(0, 0, 0, 0);

            if (itemDate.getTime() === today.getTime()) {
                groups['Today'].push(item);
            } else if (itemDate.getTime() === yesterday.getTime()) {
                groups['Yesterday'].push(item);
            } else {
                groups['Earlier'].push(item);
            }
        });

        return Object.keys(groups)
            .filter(key => groups[key].length > 0)
            .map(key => ({ title: key, data: groups[key] }));
    }, [notifications]);

    const renderRightActions = (id: string) => {
        return (
            <TouchableOpacity
                style={styles.deleteAction}
                onPress={() => handleDelete(id)}
            >
                <Trash2 size={24} color="#ffffff" />
                <Text style={styles.deleteActionText}>Delete</Text>
            </TouchableOpacity>
        );
    };

    const renderItem = useCallback(({ item, index }: { item: any, index: number }) => {
        const isSelected = selectedItems.has(item._id);

        const Content = (
            <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
                <TouchableOpacity
                    onPress={() => {
                        if (isSelectionMode) {
                            toggleSelection(item._id);
                        } else {
                            handleNotificationClick(item, navigation);
                        }
                    }}
                    onLongPress={() => enterSelectionMode(item._id)}
                    delayLongPress={300}
                    activeOpacity={0.7}
                    style={{ marginBottom: 1 }}
                >
                    <GlassView
                        intensity={isSelected ? 30 : (item.read ? 5 : 12)}
                        style={[
                            styles.notificationCard,
                            { borderBottomWidth: 0 },
                            !item.read ? { borderColor: 'rgba(139, 92, 246, 0.3)', borderLeftWidth: 3, borderLeftColor: colors.primary } : {},
                            isSelected ? { backgroundColor: colors.primary + '20', borderColor: colors.primary, borderWidth: 1 } : {}
                        ]}
                    >
                        <View style={styles.cardInner}>
                            {isSelectionMode && (
                                <View style={styles.checkboxContainer}>
                                    {isSelected ? (
                                        <CheckSquare size={20} color={colors.primary} />
                                    ) : (
                                        <Square size={20} color={colors.textSecondary} />
                                    )}
                                </View>
                            )}

                            <View style={[styles.iconContainer, { backgroundColor: isSelected ? colors.primary + '40' : 'rgba(255,255,255,0.05)' }]}>
                                {getIcon(item.type)}
                            </View>

                            <View style={styles.textContainer}>
                                <View style={styles.titleRow}>
                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={[
                                            styles.notificationTitle,
                                            { color: item.read ? 'rgba(255,255,255,0.4)' : '#fff' }
                                        ]} numberOfLines={1}>
                                            {item.title}
                                        </Text>
                                        {!item.read && <View style={styles.unreadDot} />}
                                    </View>
                                    <Text style={[styles.timeText, { color: 'rgba(255,255,255,0.3)' }]}>
                                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                                <Text style={[styles.messageText, { color: item.read ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)' }]} numberOfLines={2}>
                                    {item.message}
                                </Text>
                            </View>
                        </View>
                    </GlassView>
                </TouchableOpacity>
            </Animated.View>
        );

        if (isSelectionMode) {
            return Content;
        }

        return (
            <Swipeable renderRightActions={() => renderRightActions(item._id)}>
                {Content}
            </Swipeable>
        );
    }, [isSelectionMode, selectedItems, handleNotificationClick, navigation, colors.primary]);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={styles.container} edges={['top']}>
                <FloatingShape color="rgba(139, 92, 246, 0.2)" size={400} top={-150} left={-100} delay={0} />
                <FloatingShape color="rgba(37, 181, 244, 0.1)" size={300} top={SCREEN_HEIGHT * 0.6} left={SCREEN_WIDTH * 0.5} delay={2000} />

                <GlassView intensity={20} borderRadius={0} style={styles.headerGlass}>
                    <View style={styles.headerContent}>
                        {isSelectionMode ? (
                            <View style={styles.selectionHeader}>
                                <TouchableOpacity onPress={() => {
                                    setIsSelectionMode(false);
                                    setSelectedItems(new Set());
                                }}>
                                    <X size={24} color="#fff" />
                                </TouchableOpacity>
                                <Text style={styles.selectionTitle}>{selectedItems.size} Selected</Text>
                                <TouchableOpacity onPress={handleBulkDelete}>
                                    <Trash2 size={24} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.defaultHeader}>
                                <View>
                                    <Text style={styles.headerTitle}>Notifications</Text>
                                    <Text style={styles.headerSubtitle}>Updates and alerts</Text>
                                </View>
                                {notifications.some(n => !n.read) && (
                                    <TouchableOpacity onPress={markAllRead}>
                                        <GlassView intensity={30} borderRadius={15} style={styles.markReadBtn}>
                                            <Text style={styles.clearAllText}>Mark all read</Text>
                                        </GlassView>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                </GlassView>

                {loading && notifications.length === 0 ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <SectionList
                        sections={groupedNotifications()}
                        keyExtractor={item => item._id}
                        renderItem={renderItem}
                        renderSectionHeader={({ section: { title } }) => (
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionHeaderText}>{title}</Text>
                            </View>
                        )}
                        refreshControl={
                            <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Bell size={48} color="rgba(255,255,255,0.1)" />
                                <Text style={styles.emptyText}>
                                    All caught up! No new notifications.
                                </Text>
                            </View>
                        }
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </SafeAreaView>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#09090b',
    },
    headerGlass: {
        borderBottomWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    headerContent: {
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    defaultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#ffffff',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#ffffff',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        marginTop: 2,
    },
    markReadBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
    },
    clearAllText: {
        color: '#af25f4',
        fontWeight: 'bold',
        fontSize: 12,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingTop: 12,
        paddingBottom: 40,
    },
    sectionHeader: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        marginTop: 8,
    },
    sectionHeaderText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    notificationCard: {
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    cardInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkboxContainer: {
        marginRight: 16,
    },
    iconContainer: {
        marginRight: 16,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    unreadDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#af25f4',
        marginLeft: 8,
    },
    timeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
    },
    deleteAction: {
        backgroundColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '80%',
        marginTop: 10,
        borderRadius: 20,
        marginRight: 16,
    },
    deleteActionText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: '900',
        marginTop: 4,
        textTransform: 'uppercase',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.3)',
        marginTop: 16,
        fontSize: 16,
        fontWeight: '500',
    },
    floatingShape: {
        position: 'absolute',
        opacity: 0.5,
    },
});

export default NotificationsScreen;

