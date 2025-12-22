import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications } from '../context/NotificationContext';
import { Bell, MessageSquare, CheckCircle, Heart, Info, Trash2 } from 'lucide-react-native';
import api from '../services/api';

const NotificationsScreen = ({ navigation }: any) => {
    const { notifications, loading, refresh, markAsRead, markAllRead, handleNotificationClick } = useNotifications();

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

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    <Text style={styles.headerSubtitle}>Updates and alerts</Text>
                </View>
                {notifications.some(n => !n.read) && (
                    <TouchableOpacity onPress={markAllRead}>
                        <Text style={styles.clearAllText}>Clear All</Text>
                    </TouchableOpacity>
                )}
            </View>

            {loading && notifications.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8b5cf6" />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={item => (item as any)._id}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#8b5cf6" />
                    }
                    renderItem={({ item }: any) => (
                        <TouchableOpacity
                            onPress={() => handleNotificationClick(item, navigation)}
                            style={[
                                styles.notificationCard,
                                item.read ? styles.readCard : styles.unreadCard
                            ]}
                        >
                            <View style={styles.cardContent}>
                                <View style={styles.iconContainer}>
                                    {getIcon(item.type)}
                                </View>
                                <View style={styles.textContainer}>
                                    <View style={styles.titleRow}>
                                        <Text style={[
                                            styles.notificationTitle,
                                            item.read ? styles.readText : styles.unreadText
                                        ]}>
                                            {item.title}
                                        </Text>
                                        <Text style={styles.timeText}>
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <Text style={styles.messageText}>{item.message}</Text>

                                    <View style={styles.actionsRow}>
                                        <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteButton}>
                                            <Trash2 size={16} color="#4b5563" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Bell size={48} color="#27272a" />
                            <Text style={styles.emptyText}>
                                All caught up! No new notifications.
                            </Text>
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
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    headerSubtitle: {
        color: '#a1a1aa', // zinc-400
        fontSize: 14,
    },
    clearAllText: {
        color: '#8b5cf6', // violet-500
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationCard: {
        marginHorizontal: 16,
        marginVertical: 8,
        padding: 16,
        borderRadius: 16,
        borderLeftWidth: 4,
    },
    unreadCard: {
        backgroundColor: '#18181b', // zinc-900
        borderLeftColor: '#8b5cf6', // violet-500
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    readCard: {
        backgroundColor: 'rgba(24, 24, 27, 0.5)', // zinc-900/50
        borderLeftColor: 'transparent',
        opacity: 0.6,
    },
    cardContent: {
        flexDirection: 'row',
    },
    iconContainer: {
        marginTop: 2,
    },
    textContainer: {
        flex: 1,
        marginLeft: 16,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    notificationTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        flex: 1,
        paddingRight: 8,
    },
    unreadText: {
        color: '#ffffff',
    },
    readText: {
        color: '#a1a1aa',
    },
    timeText: {
        fontSize: 12,
        color: '#71717a',
    },
    messageText: {
        color: '#a1a1aa',
        marginTop: 4,
        fontSize: 14,
        lineHeight: 20,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
    },
    deleteButton: {
        padding: 4,
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
        textAlign: 'center',
        paddingHorizontal: 40,
        fontSize: 16,
    },
});

export default NotificationsScreen;
