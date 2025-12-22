import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { useSocket } from '../../src/context/SocketContext';
import { ArrowLeft, MessageCircle } from 'lucide-react-native';

export default function ChatList() {
    const router = useRouter();
    const { user } = useAuth();
    const { socket } = useSocket();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('receive_message', (data: any) => {
            fetchConversations(); // Simplicity: just refresh the list
        });

        return () => {
            socket.off('receive_message');
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
        const otherUser = item.participants.find((p: any) => p._id !== user?._id);
        const lastMsg = item.lastMessage;

        return (
            <TouchableOpacity
                onPress={() => router.push(`/chat/${item._id}` as any)}
                className="flex-row items-center p-4 border-b border-white/5 bg-zinc-900/30"
            >
                <Image
                    source={{ uri: otherUser?.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${otherUser?.displayName}` }}
                    className="w-14 h-14 rounded-full bg-zinc-800"
                />
                <View className="flex-1 ml-4">
                    <View className="flex-row justify-between items-center">
                        <Text className="text-white font-bold text-lg">{otherUser?.displayName}</Text>
                        <Text className="text-zinc-500 text-xs">
                            {item.updatedAt ? new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </Text>
                    </View>
                    <Text className="text-zinc-400 text-sm mt-1" numberOfLines={1}>
                        {lastMsg ? lastMsg.text : 'Start a conversation'}
                    </Text>
                </View>
                {item.unreadCount > 0 && (
                    <View className="bg-violet-500 rounded-full w-5 h-5 items-center justify-center ml-2">
                        <Text className="text-white text-[10px] font-bold">{item.unreadCount}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-black" edges={['top']}>
            <View className="px-4 py-4 border-b border-white/10 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <ArrowLeft color="white" size={24} />
                </TouchableOpacity>
                <Text className="text-2xl font-bold text-white">Messages</Text>
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator color="#8b5cf6" size="large" />
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={fetchConversations} tintColor="#8b5cf6" />
                    }
                    ListEmptyComponent={
                        <View className="flex-1 items-center justify-center pt-20">
                            <MessageCircle size={48} color="#27272a" />
                            <Text className="text-zinc-500 mt-4">No conversations yet.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
