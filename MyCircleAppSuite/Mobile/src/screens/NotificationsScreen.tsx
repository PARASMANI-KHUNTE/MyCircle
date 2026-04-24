import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bell, CheckCircle, CheckSquare, Heart, Info, MessageSquare, Square, Trash2, X } from 'lucide-react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeInDown } from 'react-native-reanimated';

import AppScreen from '../components/layout/AppScreen';
import ScreenHeader from '../components/layout/ScreenHeader';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

const NotificationsScreen = ({ navigation }: any) => {
    const { notifications, loading, refresh, markAllRead, handleNotificationClick } = useNotifications();
    const { colors } = useTheme();
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    const getIcon = (type: string) => {
        const size = 20;
        switch (type) {
            case 'request':
                return <MessageSquare size={size} color={colors.info} />;
            case 'approval':
                return <CheckCircle size={size} color={colors.success} />;
            case 'like':
                return <Heart size={size} color={colors.accent} />;
            case 'info':
                return <Info size={size} color={colors.primary} />;
            default:
                return <Bell size={size} color={colors.textSecondary} />;
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
        Alert.alert('Delete Notifications', `Are you sure you want to delete ${selectedItems.size} notifications?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await Promise.all(Array.from(selectedItems).map(id => api.delete(`/notifications/${id}`)));
                        refresh();
                        setIsSelectionMode(false);
                        setSelectedItems(new Set());
                    } catch {
                        Alert.alert('Error', 'Failed to delete some notifications');
                    }
                },
            },
        ]);
    };

    const toggleSelection = (id: string) => {
        const next = new Set(selectedItems);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedItems(next);
        if (next.size === 0) {
            setIsSelectionMode(false);
        }
    };

    const enterSelectionMode = (id: string) => {
        setIsSelectionMode(true);
        setSelectedItems(new Set([id]));
    };

    const groupedNotifications = useCallback(() => {
        const groups: Record<string, any[]> = { Today: [], Yesterday: [], Earlier: [] };
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        notifications.forEach((item) => {
            const itemDate = new Date(item.createdAt);
            itemDate.setHours(0, 0, 0, 0);
            if (itemDate.getTime() === today.getTime()) {
                groups.Today.push(item);
            } else if (itemDate.getTime() === yesterday.getTime()) {
                groups.Yesterday.push(item);
            } else {
                groups.Earlier.push(item);
            }
        });

        return Object.keys(groups)
            .filter(key => groups[key].length > 0)
            .map(key => ({ title: key, data: groups[key] }));
    }, [notifications]);

    const renderRightActions = (id: string) => (
        <TouchableOpacity activeOpacity={0.85} style={[styles.deleteAction, { backgroundColor: colors.danger }]} onPress={() => handleDelete(id)}>
            <Trash2 size={24} color={colors.white} />
            <Text style={[styles.deleteActionText, { color: colors.white }]}>Delete</Text>
        </TouchableOpacity>
    );

    const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
        const isSelected = selectedItems.has(item._id);

        const content = (
            <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
                <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => {
                        if (isSelectionMode) {
                            toggleSelection(item._id);
                        } else {
                            handleNotificationClick(item, navigation);
                        }
                    }}
                    onLongPress={() => enterSelectionMode(item._id)}
                    delayLongPress={300}
                    style={{ marginBottom: 1 }}
                >
                    <View
                        style={[
                            styles.notificationCard,
                            {
                                backgroundColor: isSelected ? colors.primarySoft : colors.cardSoft,
                                borderColor: !item.read ? colors.primary : colors.borderSoft,
                                borderLeftWidth: !item.read ? 3 : 1,
                            },
                        ]}
                    >
                        <View style={styles.cardInner}>
                            {isSelectionMode ? (
                                <View style={styles.checkboxContainer}>
                                    {isSelected ? (
                                        <CheckSquare size={20} color={colors.primary} />
                                    ) : (
                                        <Square size={20} color={colors.textSecondary} />
                                    )}
                                </View>
                            ) : null}

                            <View style={[styles.iconContainer, { backgroundColor: isSelected ? colors.primarySoft : colors.backdrop }]}>
                                {getIcon(item.type)}
                            </View>

                            <View style={styles.textContainer}>
                                <View style={styles.titleRow}>
                                    <View style={styles.titleWrap}>
                                        <Text style={[styles.notificationTitle, { color: item.read ? colors.textSecondary : colors.text }]} numberOfLines={1}>
                                            {item.title}
                                        </Text>
                                        {!item.read ? <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} /> : null}
                                    </View>
                                    <Text style={[styles.timeText, { color: colors.textMuted }]}>
                                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                                <Text style={[styles.messageText, { color: item.read ? colors.textMuted : colors.textSecondary }]} numberOfLines={2}>
                                    {item.message}
                                </Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );

        if (isSelectionMode) {
            return content;
        }

        return <Swipeable renderRightActions={() => renderRightActions(item._id)}>{content}</Swipeable>;
    }, [colors, handleNotificationClick, isSelectionMode, navigation, selectedItems]);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AppScreen>
                <View style={styles.headerContent}>
                    {isSelectionMode ? (
                        <View style={styles.selectionHeader}>
                            <TouchableOpacity
                                onPress={() => {
                                    setIsSelectionMode(false);
                                    setSelectedItems(new Set());
                                }}
                            >
                                <X size={24} color={colors.text} />
                            </TouchableOpacity>
                            <Text style={[styles.selectionTitle, { color: colors.text }]}>{selectedItems.size} Selected</Text>
                            <TouchableOpacity onPress={handleBulkDelete}>
                                <Trash2 size={24} color={colors.danger} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <ScreenHeader
                            title="Notifications"
                            onBack={() => navigation.goBack()}
                            right={
                                notifications.some(notification => !notification.read) ? (
                                    <TouchableOpacity
                                        activeOpacity={0.85}
                                        onPress={markAllRead}
                                        style={[styles.markReadButton, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
                                    >
                                        <Text style={[styles.markReadText, { color: colors.primary }]}>Mark all read</Text>
                                    </TouchableOpacity>
                                ) : null
                            }
                        />
                    )}
                </View>

                {loading && notifications.length === 0 ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <SectionList
                        sections={groupedNotifications()}
                        keyExtractor={(item) => item._id}
                        renderItem={renderItem}
                        renderSectionHeader={({ section: { title } }) => (
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionHeaderText, { color: colors.textSecondary }]}>{title}</Text>
                            </View>
                        )}
                        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <View style={[styles.emptyIconContainer, { backgroundColor: colors.primarySoft }]}>
                                    <Bell size={48} color={colors.primary} />
                                </View>
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>All caught up! No new notifications.</Text>
                            </View>
                        }
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </AppScreen>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    headerContent: {
        zIndex: 10,
    },
    selectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    selectionTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    markReadButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
    },
    markReadText: {
        fontWeight: '700',
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
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    notificationCard: {
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderRadius: 16,
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
    titleWrap: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    unreadDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
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
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '80%',
        marginTop: 10,
        borderRadius: 20,
        marginRight: 16,
    },
    deleteActionText: {
        fontSize: 10,
        fontWeight: '700',
        marginTop: 4,
        textTransform: 'uppercase',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '500',
    },
});

export default NotificationsScreen;
