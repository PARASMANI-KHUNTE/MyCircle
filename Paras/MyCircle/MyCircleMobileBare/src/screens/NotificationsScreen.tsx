import React, { useState, useCallback } from 'react';
import { View, Text, SectionList, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications } from '../context/NotificationContext';
import { Bell, MessageSquare, CheckCircle, Heart, Info, Trash2, X, CheckSquare, Square } from 'lucide-react-native';
import api from '../services/api';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';

const NotificationsScreen = ({ navigation }: any) => {
    const { notifications, loading, refresh, markAllRead, handleNotificationClick } = useNotifications();
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    const getIcon = (type: string) => {
        const size = 20;
        switch (type) {
            case 'request': return <MessageSquare size={size} color="#60a5fa" />;
            case 'approval': return <CheckCircle size={size} color="#4ade80" />;
            case 'like': return <Heart size={size} color="#f472b6" />;
            case 'info': return <Info size={size} color="#c084fc" />;
            default: return <Bell size={size} color="#a1a1aa" />;
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

    const renderItem = useCallback(({ item }: { item: any }) => {
        const isSelected = selectedItems.has(item._id);

        const Content = (
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
                style={[
                    styles.notificationCard,
                    item.read ? styles.readCard : styles.unreadCard,
                    isSelected && styles.selectedCard
                ]}
                activeOpacity={0.7}
            >
                <View style={styles.cardInner}>
                    {isSelectionMode && (
                        <View style={styles.checkboxContainer}>
                            {isSelected ? (
                                <CheckSquare size={20} color="#8b5cf6" />
                            ) : (
                                <Square size={20} color="#71717a" />
                            )}
                        </View>
                    )}

                    <View style={styles.iconContainer}>
                        {getIcon(item.type)}
                    </View>

                    <View style={styles.textContainer}>
                        <View style={styles.titleRow}>
                            <Text style={[
                                styles.notificationTitle,
                                item.read ? styles.readText : styles.unreadText
                            ]} numberOfLines={1}>
                                {item.title}
                            </Text>
                            <Text style={styles.timeText}>
                                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                        <Text style={styles.messageText} numberOfLines={2}>{item.message}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );

        if (isSelectionMode) {
            return Content;
        }

        return (
            <Swipeable renderRightActions={() => renderRightActions(item._id)}>
                {Content}
            </Swipeable>
        );
    }, [isSelectionMode, selectedItems, handleNotificationClick, navigation, toggleSelection, enterSelectionMode]);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    {isSelectionMode ? (
                        <View style={styles.selectionHeader}>
                            <TouchableOpacity onPress={() => {
                                setIsSelectionMode(false);
                                setSelectedItems(new Set());
                            }}>
                                <X size={24} color="#ffffff" />
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
                                    <Text style={styles.clearAllText}>Mark all read</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>

                {loading && notifications.length === 0 ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#8b5cf6" />
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
                            <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#8b5cf6" />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Bell size={48} color="#27272a" />
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
        backgroundColor: '#000000',
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: '#000000',
        zIndex: 10,
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
        paddingVertical: 4,
    },
    selectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    headerSubtitle: {
        color: '#a1a1aa',
        fontSize: 14,
    },
    clearAllText: {
        color: '#8b5cf6',
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: 20,
    },
    sectionHeader: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#000000',
    },
    sectionHeaderText: {
        color: '#71717a',
        fontSize: 13,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    notificationCard: {
        backgroundColor: '#18181b',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    unreadCard: {
        backgroundColor: '#18181b', // Default dark background
    },
    readCard: {
        backgroundColor: '#000000', // Matches background for cleaner look? Or darker zinc
    },
    selectedCard: {
        backgroundColor: 'rgba(139, 92, 246, 0.15)', // Light violet tint
    },
    cardInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkboxContainer: {
        marginRight: 12,
    },
    iconContainer: {
        marginRight: 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
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
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
        paddingRight: 8,
    },
    unreadText: {
        color: '#ffffff', // Brighter for unread
    },
    readText: {
        color: '#a1a1aa', // Dimmer for read
        fontWeight: '400',
    },
    timeText: {
        fontSize: 11,
        color: '#52525b',
    },
    messageText: {
        color: '#71717a',
        fontSize: 13,
        lineHeight: 18,
    },
    deleteAction: {
        backgroundColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
    },
    deleteActionText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 4,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        color: '#71717a',
        marginTop: 16,
        fontSize: 16,
    },
});

export default NotificationsScreen;

