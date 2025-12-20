import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import api from '../../src/services/api';
import { MapPin } from 'lucide-react-native';

// Mock data if API fails locally
const MOCK_POSTS = [
    { _id: '1', title: 'Welcome to MyCircle', description: 'This is a demo post since API might be unreachable.', type: 'job', user: { displayName: 'Admin' }, location: 'Local', price: 0 }
];

const Feed = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            // Real API Call
            const res = await api.get('/posts');
            setPosts(res.data);
        } catch (err) {
            console.log('API Error:', err);
            // Fallback only if error is "Network Error" (meaning IP might be wrong), otherwise show empty or error
            if (err.message === 'Network Error') {
                alert("Check API_URL in src/services/api.ts");
            }
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <View className="bg-card mb-4 p-4 rounded-2xl border border-white/10">
            <View className="flex-row justify-between mb-2">
                <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 rounded-full bg-secondary" />
                    <View>
                        <Text className="text-white font-bold">{item.title}</Text>
                        <Text className="text-xs text-gray-400">{item.user?.displayName}</Text>
                    </View>
                </View>
                <View className="px-2 py-1 bg-white/10 rounded-lg">
                    <Text className="text-xs text-primary font-bold uppercase">{item.type}</Text>
                </View>
            </View>

            <Text className="text-gray-300 mb-3" numberOfLines={3}>{item.description}</Text>

            <View className="flex-row justify-between items-center border-t border-white/5 pt-3">
                <View className="flex-row items-center gap-1">
                    <MapPin size={12} color="#a1a1aa" />
                    <Text className="text-xs text-gray-400">{item.location}</Text>
                </View>
                <Text className="text-white font-bold">₹{item.price || 0}</Text>
            </View>

            <TouchableOpacity className="mt-3 bg-primary py-2 rounded-xl items-center">
                <Text className="text-white font-bold text-xs">Request Contact</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View className="flex-1 bg-background pt-10 px-4">
            <Text className="text-2xl font-bold text-white mb-4">Explore</Text>
            {loading ? (
                <ActivityIndicator color="#8b5cf6" />
            ) : (
                <FlatList
                    data={posts}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
};

export default Feed;
