import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, TextInput, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Briefcase, Zap, ShoppingCart, Key } from 'lucide-react-native';
import api from '../services/api';
import PostCard from '../components/ui/PostCard';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../components/ui/Toast';

const CATEGORIES = [
    { id: 'all', label: 'All', icon: Zap },
    { id: 'job', label: 'Jobs', icon: Briefcase },
    { id: 'service', label: 'Services', icon: Zap },
    { id: 'sell', label: 'Market', icon: ShoppingCart },
    { id: 'rent', label: 'Rentals', icon: Key },
];

const FeedScreen = ({ navigation }: any) => {
    const { socket } = useSocket();
    const { success } = useToast();
    const [posts, setPosts] = useState<any[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        fetchPosts();
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on('new_post', (newPost: any) => {
                setPosts((prev: any) => [newPost, ...prev]);
                success('New post added!');
            });
            return () => {
                socket.off('new_post');
            };
        }
    }, [socket]);

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
        navigation.navigate('PostDetails', { id: postId });
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Explore</Text>

                <View style={styles.searchContainer}>
                    <Search size={20} color="#71717a" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search posts..."
                        placeholderTextColor="#3f3f46"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoriesScroll}
                    contentContainerStyle={styles.categoriesContent}
                >
                    {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isActive = selectedCategory === cat.id;
                        return (
                            <TouchableOpacity
                                key={cat.id}
                                onPress={() => setSelectedCategory(cat.id)}
                                style={[
                                    styles.categoryButton,
                                    isActive ? styles.categoryButtonActive : styles.categoryButtonInactive
                                ]}
                            >
                                <Icon size={16} color={isActive ? "white" : "#a1a1aa"} />
                                <Text style={[
                                    styles.categoryText,
                                    isActive ? styles.categoryTextActive : styles.categoryTextInactive
                                ]}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8b5cf6" />
                </View>
            ) : (
                <FlatList
                    data={filteredPosts}
                    keyExtractor={item => (item as any)._id}
                    renderItem={({ item }) => (
                        <PostCard
                            post={item as any}
                            isOwnPost={false}
                            onPress={() => handlePostPress((item as any)._id)}
                            onRequestContact={() => handleRequestContact((item as any)._id)}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No posts found</Text>
                            <TouchableOpacity onPress={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
                                <Text style={styles.clearFilterText}>Clear filters</Text>
                            </TouchableOpacity>
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
        paddingTop: 16,
        paddingBottom: 8,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#18181b', // zinc-900
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 16,
        marginTop: 16,
        height: 48,
    },
    searchInput: {
        flex: 1,
        color: '#ffffff',
        marginLeft: 12,
        fontSize: 16,
    },
    categoriesScroll: {
        marginTop: 16,
        marginHorizontal: -16,
    },
    categoriesContent: {
        paddingHorizontal: 16,
        paddingBottom: 8,
        flexDirection: 'row',
    },
    categoryButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 1,
    },
    categoryButtonActive: {
        backgroundColor: '#7c3aed', // violet-600
        borderColor: '#8b5cf6', // violet-500
    },
    categoryButtonInactive: {
        backgroundColor: '#18181b',
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    categoryText: {
        fontWeight: 'bold',
        marginLeft: 8,
    },
    categoryTextActive: {
        color: '#ffffff',
    },
    categoryTextInactive: {
        color: '#a1a1aa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingTop: 8,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
    },
    emptyText: {
        color: '#71717a',
        fontSize: 18,
    },
    clearFilterText: {
        color: '#8b5cf6',
        marginTop: 8,
        fontWeight: 'bold',
    },
});

export default FeedScreen;
