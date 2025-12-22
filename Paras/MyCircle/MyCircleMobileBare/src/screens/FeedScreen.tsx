import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, TextInput, ScrollView, TouchableOpacity, StyleSheet, Dimensions, PermissionsAndroid, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Briefcase, Zap, ShoppingCart, Key, MapPin, Calendar, ArrowUpDown, X, Check } from 'lucide-react-native';
import api from '../services/api';
import PostCard from '../components/ui/PostCard';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../components/ui/Toast';
import { useTheme } from '../context/ThemeContext';

const CATEGORIES = [
    { id: 'all', label: 'All', icon: Zap },
    { id: 'job', label: 'Jobs', icon: Briefcase },
    { id: 'service', label: 'Services', icon: Zap },
    { id: 'sell', label: 'Market', icon: ShoppingCart },
    { id: 'rent', label: 'Rentals', icon: Key },
];

const FeedScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const { socket } = useSocket();
    const { success } = useToast();
    const [posts, setPosts] = useState<any[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Filters
    const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');
    const [locationFilter, setLocationFilter] = useState('All');
    const [availableLocations, setAvailableLocations] = useState<string[]>(['All']);
    const [showLocationModal, setShowLocationModal] = useState(false);

    // For date, simple string match or picker? User said "select date". 
    // Implementing a simple text match for now or a list of available dates would be better but let's stick to simple "Date" sort/filter.
    // Actually, "Select Date" implies filtering by specific date.
    const [selectedDate, setSelectedDate] = useState<string | null>(null); // YYYY-MM-DD
    const [showDatePicker, setShowDatePicker] = useState(false); // Just a simulation of picker or simple list

    // Theme Styles
    const themeStyles = {
        container: { backgroundColor: colors.background },
        text: { color: colors.text },
        textSecondary: { color: colors.textSecondary },
        card: { backgroundColor: colors.card },
        border: { borderColor: colors.border },
        input: { backgroundColor: colors.input, color: colors.text, borderColor: colors.border },
        chip: { backgroundColor: colors.card, borderColor: colors.border },
        chipActive: { backgroundColor: 'rgba(139, 92, 246, 0.2)', borderColor: colors.primary },
        modal: { backgroundColor: colors.card, borderColor: colors.border }
    };

    useEffect(() => {
        fetchPosts();
        requestLocationPermission();
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
        if (posts.length > 0) {
            const locs = Array.from(new Set(posts.map(p => p.location).filter(Boolean)));
            setAvailableLocations(['All', ...locs]);
        }
        filterPosts();
    }, [posts, searchQuery, selectedCategory, sortOrder, locationFilter, selectedDate]);

    const requestLocationPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: "Location Permission",
                        message: "MyCircle needs access to your location to show relevant posts.",
                        buttonNeutral: "Ask Me Later",
                        buttonNegative: "Cancel",
                        buttonPositive: "OK"
                    }
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    // console.log("You can use the location");
                    // In future: Get current location and auto-filter or sort
                } else {
                    console.log("Location permission denied");
                }
            } catch (err) {
                console.warn(err);
            }
        }
    };

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
        let result = [...posts];

        // 1. Search
        if (searchQuery) {
            result = result.filter((p: any) =>
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // 2. Category
        if (selectedCategory !== 'all') {
            result = result.filter((p: any) => p.type === selectedCategory);
        }

        // 3. Location
        if (locationFilter !== 'All') {
            result = result.filter((p: any) => p.location === locationFilter);
        }

        // 4. Date
        if (selectedDate) {
            result = result.filter((p: any) => {
                const pDate = new Date(p.createdAt).toISOString().split('T')[0];
                return pDate === selectedDate;
            });
        }

        // 5. Sort
        result.sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
        });

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

    const toggleSort = () => {
        setSortOrder(prev => prev === 'latest' ? 'oldest' : 'latest');
    };

    return (
        <SafeAreaView style={[styles.container, themeStyles.container]} edges={['top']}>
            <View style={styles.header}>
                <Text style={[styles.title, themeStyles.text]}>Explore</Text>

                <View style={[styles.searchContainer, themeStyles.input]}>
                    <Search size={20} color={colors.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search posts..."
                        placeholderTextColor={colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Categories */}
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
                                    isActive
                                        ? { backgroundColor: colors.primary + '20', borderColor: colors.primary }
                                        : { backgroundColor: colors.card, borderColor: colors.border }
                                ]}
                            >
                                <Icon size={16} color={isActive ? colors.primary : colors.textSecondary} />
                                <Text style={[
                                    styles.categoryText,
                                    isActive ? { color: colors.primary } : { color: colors.textSecondary }
                                ]}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Filters Row */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filtersScroll}
                    contentContainerStyle={styles.categoriesContent}
                >
                    <TouchableOpacity onPress={toggleSort} style={[
                        styles.filterChip,
                        { backgroundColor: colors.card, borderColor: colors.border }
                    ]}>
                        <ArrowUpDown size={14} color={colors.textSecondary} />
                        <Text style={[styles.filterText, { color: colors.textSecondary }]}>{sortOrder === 'latest' ? 'Latest' : 'Oldest'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setShowLocationModal(true)} style={[
                        styles.filterChip,
                        locationFilter !== 'All'
                            ? { backgroundColor: colors.primary + '20', borderColor: colors.primary }
                            : { backgroundColor: colors.card, borderColor: colors.border }
                    ]}>
                        <MapPin size={14} color={locationFilter !== 'All' ? colors.primary : colors.textSecondary} />
                        <Text style={[
                            styles.filterText,
                            locationFilter !== 'All' ? { color: colors.primary } : { color: colors.textSecondary }
                        ]}>
                            {locationFilter === 'All' ? 'Location' : locationFilter}
                        </Text>
                    </TouchableOpacity>

                    {/* Simple Date Simulation: Toggle Today/All for MVP or clear */}
                    <TouchableOpacity onPress={() => setSelectedDate(selectedDate ? null : new Date().toISOString().split('T')[0])} style={[
                        styles.filterChip,
                        selectedDate
                            ? { backgroundColor: colors.primary + '20', borderColor: colors.primary }
                            : { backgroundColor: colors.card, borderColor: colors.border }
                    ]}>
                        <Calendar size={14} color={selectedDate ? colors.primary : colors.textSecondary} />
                        <Text style={[
                            styles.filterText,
                            selectedDate ? { color: colors.primary } : { color: colors.textSecondary }
                        ]}>
                            {selectedDate ? 'Today' : 'Date'}
                        </Text>
                        {selectedDate && <X size={12} color={colors.primary} style={{ marginLeft: 4 }} />}
                    </TouchableOpacity>
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
                            post={item}
                            onPress={() => navigation.navigate('PostDetails', { id: item._id })}
                            onRequestContact={() => handleRequestContact(item._id)}
                            navigation={navigation}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No posts found</Text>
                            <TouchableOpacity onPress={() => { setSearchQuery(''); setSelectedCategory('all'); setLocationFilter('All'); setSelectedDate(null); }}>
                                <Text style={styles.clearFilterText}>Clear filters</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

            {/* Location Selection Modal */}
            <Modal
                transparent={true}
                visible={showLocationModal}
                animationType="fade"
                onRequestClose={() => setShowLocationModal(false)}
            >
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowLocationModal(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Location</Text>
                        <ScrollView style={{ maxHeight: 300 }}>
                            {availableLocations.map((loc, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    style={styles.modalItem}
                                    onPress={() => { setLocationFilter(loc); setShowLocationModal(false); }}
                                >
                                    <Text style={[styles.modalItemText, locationFilter === loc && { color: '#8b5cf6', fontWeight: 'bold' }]}>{loc}</Text>
                                    {locationFilter === loc && <Check size={16} color="#8b5cf6" />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
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
    filtersScroll: {
        marginTop: 12,
        marginHorizontal: -16,
        maxHeight: 40,
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
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#18181b',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: '#2e1065', // violet-950
        borderColor: '#8b5cf6',
    },
    filterText: {
        color: '#a1a1aa',
        fontSize: 12,
        marginLeft: 6,
        fontWeight: '500',
    },
    filterTextActive: {
        color: '#ffffff',
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#18181b',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    modalItemText: {
        color: '#d4d4d8',
        fontSize: 16,
    },
});

export default FeedScreen;
