import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Briefcase, Zap, ShoppingCart, Key } from 'lucide-react-native';
import api from '../../src/services/api';
import PostCard from '../../src/components/ui/PostCard';
import clsx from 'clsx';

const CATEGORIES = [
    { id: 'all', label: 'All', icon: Zap },
    { id: 'job', label: 'Jobs', icon: Briefcase },
    { id: 'service', label: 'Services', icon: Zap },
    { id: 'sell', label: 'Market', icon: ShoppingCart },
    { id: 'rent', label: 'Rentals', icon: Key },
];

const Feed = () => {
    const router = useRouter();
    const [posts, setPosts] = useState([]);
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        fetchPosts();
    }, []);

    useEffect(() => {
        filterPosts();
    }, [posts, searchQuery, selectedCategory]);

    const fetchPosts = async () => {
        try {
            const res = await api.get('/posts');
            setPosts(res.data);
            setFilteredPosts(res.data);
        } catch (err) {
            console.log('API Error:', err);
            Alert.alert("Connection Error", "Could not connect to server.");
        } finally {
            setLoading(false);
        }
    };

    const filterPosts = () => {
        let result = posts;
        if (selectedCategory !== 'all') {
            result = result.filter((p: any) => p.type === selectedCategory);
        }
        if (searchQuery) {
            result = result.filter((p: any) =>
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        setFilteredPosts(result);
    };

    const handleRequestContact = async (postId: string) => {
        try {
            await api.post(`/contacts/${postId}`);
            Alert.alert("Success", "Contact Request Sent!");
        } catch (err: any) {
            Alert.alert("Error", err.response?.data?.msg || "Failed to send request");
        }
    }

    const handlePostPress = (postId: string) => {
        router.push(`/post/${postId}` as any);
    }

    return (
        <SafeAreaView className="flex-1 bg-black" edges={['top']}>
            <View className="px-4 pt-4 pb-2">
                <Text className="text-3xl font-bold text-white">Explore</Text>

                {/* Search Bar */}
                <View className="flex-row items-center bg-zinc-900 rounded-2xl border border-white/5 px-4 mt-4 py-2">
                    <Search size={20} color="#71717a" />
                    <TextInput
                        className="flex-1 text-white ml-3 text-base h-10"
                        placeholder="Search posts..."
                        placeholderTextColor="#3f3f46"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Categories */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mt-4 -mx-4 px-4 pb-2"
                >
                    <View className="flex-row gap-3">
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                onPress={() => setSelectedCategory(cat.id)}
                                className={clsx(
                                    "px-4 py-2 rounded-xl flex-row items-center gap-2 border",
                                    selectedCategory === cat.id
                                        ? "bg-violet-600 border-violet-500"
                                        : "bg-zinc-900 border-white/5"
                                )}
                            >
                                <cat.icon size={16} color={selectedCategory === cat.id ? "white" : "#a1a1aa"} />
                                <Text className={clsx("font-bold", selectedCategory === cat.id ? "text-white" : "text-zinc-400")}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#8b5cf6" />
                </View>
            ) : (
                <FlatList
                    data={filteredPosts}
                    keyExtractor={item => item._id}
                    renderItem={({ item }) => (
                        <PostCard
                            post={item}
                            isOwnPost={false}
                            onPress={() => handlePostPress(item._id)}
                            onRequestContact={() => handleRequestContact(item._id)}
                        />
                    )}
                    contentContainerStyle={{ padding: 16, paddingTop: 8 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View className="flex-1 items-center justify-center pt-20">
                            <Text className="text-zinc-500 text-lg">No posts found</Text>
                            <TouchableOpacity onPress={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
                                <Text className="text-violet-500 mt-2 font-bold">Clear filters</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

export default Feed;
