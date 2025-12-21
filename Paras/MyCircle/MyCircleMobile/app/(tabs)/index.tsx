import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert } from 'react-native';
import api from '../../src/services/api';
import PostCard from '../../src/components/ui/PostCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const Feed = () => {
    const router = useRouter(); // Add router
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const res = await api.get('/posts');
            setPosts(res.data);
        } catch (err) {
            console.log('API Error:', err);
            Alert.alert("Connection Error", "Could not connect to server. Check API URL.");
        } finally {
            setLoading(false);
        }
    };

    const handleRequestContact = async (postId) => {
        try {
            await api.post(`/contacts/${postId}`);
            Alert.alert("Success", "Contact Request Sent!");
        } catch (err) {
            Alert.alert("Error", err.response?.data?.msg || "Failed to send request");
        }
    }

    const handlePostPress = (postId) => {
        router.push(`/post/${postId}`);
    }

    return (
        <SafeAreaView className="flex-1 bg-black" edges={['top']}>
            <View className="px-4 py-4 border-b border-white/10">
                <Text className="text-3xl font-bold text-white">Explore</Text>
                <Text className="text-zinc-400">Discover local opportunities</Text>
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#8b5cf6" />
                </View>
            ) : (
                <FlatList
                    data={posts}
                    keyExtractor={item => item._id}
                    renderItem={({ item }) => (
                        <PostCard
                            post={item}
                            isOwnPost={false}
                            onPress={() => handlePostPress(item._id)}
                            onRequestContact={() => handleRequestContact(item._id)}
                        />
                    )}
                    contentContainerStyle={{ padding: 16 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <Text className="text-white text-center mt-20">No posts found</Text>
                    }
                />
            )}
        </SafeAreaView>
    );
};

export default Feed;
