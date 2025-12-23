import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import api from '../../src/services/api';
import PostCard from '../../src/components/ui/PostCard';
import { Trash, Repeat, EyeOff, Eye } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MyPosts() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'active', 'inactive', 'sold'

    const fetchMyPosts = async () => {
        try {
            setLoading(true);
            const res = await api.get('/posts/my-posts');
            setPosts(res.data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch your posts');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchMyPosts();
        }, [])
    );

    const handleStatusChange = async (postId, newStatus) => {
        try {
            await api.patch(`/posts/${postId}/status`, { status: newStatus });
            fetchMyPosts();
        } catch (error) {
            Alert.alert('Error', 'Failed to update status');
        }
    };

    const handleDelete = async (postId) => {
        Alert.alert(
            "Delete Post",
            "Are you sure you want to delete this post?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await api.delete(`/posts/${postId}`);
                            setPosts(posts.filter(p => p._id !== postId));
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete post');
                        }
                    }
                }
            ]
        );
    };

    const filteredPosts = posts.filter(post => {
        if (filter === 'all') return true;
        return post.status === filter;
    });

    const renderItem = ({ item }) => (
        <View className="mb-4">
            <PostCard post={item} isOwnPost={true} />

            {/* Actions Toolbar */}
            <View className="flex-row justify-between bg-zinc-900 border-x border-b border-zinc-800 rounded-b-2xl p-3 -mt-4 mx-1">
                <View className="flex-row gap-2">
                    {item.status === 'active' ? (
                        <>
                            <TouchableOpacity
                                onPress={() => handleStatusChange(item._id, 'inactive')}
                                className="bg-yellow-500/10 p-2 rounded-lg flex-row items-center gap-1 border border-yellow-500/20"
                            >
                                <EyeOff size={14} color="#eab308" />
                                <Text className="text-yellow-500 text-xs font-bold">Disable</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleStatusChange(item._id, 'sold')}
                                className="bg-blue-500/10 p-2 rounded-lg flex-row items-center gap-1 border border-blue-500/20"
                            >
                                <Repeat size={14} color="#60a5fa" />
                                <Text className="text-blue-500 text-xs font-bold">Sold</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity
                            onPress={() => handleStatusChange(item._id, 'active')}
                            className="bg-green-500/10 p-2 rounded-lg flex-row items-center gap-1 border border-green-500/20"
                        >
                            <Eye size={14} color="#22c55e" />
                            <Text className="text-green-500 text-xs font-bold">{item.status === 'sold' ? 'Relist' : 'Enable'}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    onPress={() => handleDelete(item._id)}
                    className="bg-red-500/10 p-2 rounded-lg flex-row items-center gap-1 border border-red-500/20"
                >
                    <Trash size={14} color="#ef4444" />
                    <Text className="text-red-500 text-xs font-bold">Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-black" edges={['top']}>
            <View className="px-4 py-4">
                <Text className="text-3xl font-bold text-white mb-4">My Posts</Text>

                {/* Filters */}
                <View className="flex-row mb-4 gap-2">
                    {['all', 'active', 'inactive', 'sold'].map(f => (
                        <TouchableOpacity
                            key={f}
                            onPress={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full border ${filter === f ? 'bg-zinc-100 border-white' : 'bg-zinc-900 border-zinc-700'}`}
                        >
                            <Text className={`capitalize text-xs font-bold ${filter === f ? 'text-black' : 'text-zinc-400'}`}>{f}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {loading ? (
                    <ActivityIndicator color="#8b5cf6" className="mt-10" />
                ) : (
                    <FlatList
                        data={filteredPosts}
                        keyExtractor={item => item._id}
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <Text className="text-zinc-500 text-center mt-20">No posts found with this status.</Text>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
