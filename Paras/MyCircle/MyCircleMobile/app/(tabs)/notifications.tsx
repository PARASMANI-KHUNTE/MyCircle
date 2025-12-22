import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications } from '../../src/context/NotificationContext';
import { Bell, MessageSquare, CheckCircle, Heart, Info, Trash2 } from 'lucide-react-native';
import clsx from 'clsx';
import api from '../../src/services/api';

export default function NotificationsScreen() {
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
        <SafeAreaView className="flex-1 bg-black" edges={['top']}>
            <View className="px-4 py-4 border-b border-white/10 flex-row justify-between items-center">
                <View>
                    <Text className="text-3xl font-bold text-white">Notifications</Text>
                    <Text className="text-zinc-400">Updates and alerts</Text>
                </View>
                {notifications.some(n => !n.read) && (
                    <TouchableOpacity onPress={markAllRead}>
                        <Text className="text-violet-500 font-medium">Clear All</Text>
                    </TouchableOpacity>
                )}
            </View>

            {loading && notifications.length === 0 ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#8b5cf6" />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={item => item._id}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#8b5cf6" />
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => handleNotificationClick(item)}
                            className={clsx(
                                "mx-4 my-2 p-4 rounded-2xl border-l-4",
                                item.read ? "bg-zinc-900/50 border-transparent opacity-60" : "bg-zinc-900 border-violet-500 shadow-lg"
                            )}
                        >
                            <View className="flex-row gap-4">
                                <View className="mt-1">
                                    {getIcon(item.type)}
                                </View>
                                <div className="flex-1">
                                    <View className="flex-row justify-between items-start">
                                        <Text className={clsx("font-bold text-base", item.read ? "text-zinc-400" : "text-white")}>
                                            {item.title}
                                        </Text>
                                        <Text className="text-xs text-zinc-500">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <Text className="text-zinc-400 mt-1">{item.message}</Text>

                                    <View className="flex-row justify-end mt-2">
                                        <TouchableOpacity onPress={() => handleDelete(item._id)} className="p-1">
                                            <Trash2 size={16} color="#4b5563" />
                                        </TouchableOpacity>
                                    </View>
                                </div>
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View className="flex-1 items-center justify-center pt-20">
                            <Bell size={48} color="#27272a" />
                            <Text className="text-zinc-500 mt-4 text-center px-10">
                                All caught up! No new notifications.
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
