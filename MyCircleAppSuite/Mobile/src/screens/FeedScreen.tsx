import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { usePosts } from '../hooks/usePosts';
import { useQueryClient } from '@tanstack/react-query';
import { View, Text, ActivityIndicator, TextInput, ScrollView, TouchableOpacity, StyleSheet, Modal, RefreshControl, Image } from 'react-native';

import { FlashList } from "@shopify/flash-list";
import { WebView } from 'react-native-webview';
import AppScreen from '../components/layout/AppScreen';
import { Search, Briefcase, Zap, ShoppingCart, MapPin, Map as MapIcon, CalendarDays, ArrowUpDown, X, Check, Bell, MessageCircle, SlidersHorizontal, ArrowDownUp, Flame } from 'lucide-react-native';
import api from '../services/api';
import Animated, {
    FadeInDown,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { useNotifications } from '../context/NotificationContext';
import Sound from 'react-native-sound';
import PostCard from '../components/ui/PostCard';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../components/ui/Toast';
import { buildFeedMapHtml } from '../utils/feedMapHtml';

// Enable playback in silent mode
Sound.setCategory('Playback');

const EARTH_RADIUS_KM = 6371;

const toRadians = (value: number) => (value * Math.PI) / 180;

const getDistanceInKm = (
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
) => {
    const latDiff = toRadians(to.lat - from.lat);
    const lngDiff = toRadians(to.lng - from.lng);
    const startLat = toRadians(from.lat);
    const endLat = toRadians(to.lat);

    const a = Math.sin(latDiff / 2) ** 2
        + Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDiff / 2) ** 2;

    return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getCatColor = (catId: string, colors: any) => {
    return colors.primary; // Unified MyCircle Blue for all categories
};

const CATEGORIES = [
    { id: 'all', label: 'All', icon: Zap },
    { id: 'job', label: 'Jobs', icon: Briefcase },
    { id: 'service', label: 'Services', icon: Zap },
    { id: 'sell', label: 'Sell or Rent', icon: ShoppingCart },
    { id: 'barter', label: 'Barter', icon: ArrowUpDown },
];

const DEFAULT_DISTANCE_RADIUS = 50;
const SEARCH_DEBOUNCE_MS = 300;

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

const FeedScreen = ({ navigation, route }: any) => {
    const { isAuthenticated } = useAuth();
    const initialViewMode = route?.params?.viewMode || 'list';
    const { colors, isDark } = useTheme();
    const { socket } = useSocket() as any; // Type assertion if needed
    const { success, error: showError, info: showInfo } = useToast();
    const queryClient = useQueryClient();
    const { unreadCount } = useNotifications();
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [unreadMsgCount, setUnreadMsgCount] = useState(0);
    const [viewMode, setViewMode] = useState<'list' | 'map'>(initialViewMode);
    const [selectedPost, setSelectedPost] = useState<any | null>(null);
    const {
        location: userLocation,
        requestLocation,
    } = useLocation();

    // Chat Badge Logic




    // Filters
    const [sortOrder, setSortOrder] = useState<'latest' | 'price_asc' | 'price_desc' | 'nearest' | 'urgent'>('latest');
    const [priceRange, setPriceRange] = useState<'all' | 'under500' | '500to2000' | '2000to10000' | 'above10000'>('all');
    const [urgentOnly, setUrgentOnly] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [locationFilter, setLocationFilter] = useState('All');
    const [availableLocations, setAvailableLocations] = useState<string[]>(['All']);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [isNearby, setIsNearby] = useState(false);
    const [, setNearbyLoading] = useState(false);

    // Distance filter (radius in km)
    const [distanceRadius, setDistanceRadius] = useState<number>(DEFAULT_DISTANCE_RADIUS); // Default 50km (All)

    // React Query Hook
    const serverCategory = selectedCategory === 'barter' ? 'barter' : selectedCategory;
    const serverSort = sortOrder === 'nearest' && !isNearby ? 'latest' : (sortOrder === 'price_asc' || sortOrder === 'price_desc') ? 'latest' : sortOrder;

    const { data: postsData, isLoading: loading, refetch, isRefetching, isError } = usePosts({
        latitude: isNearby ? userLocation?.lat : undefined,
        longitude: isNearby ? userLocation?.lng : undefined,
        radius: distanceRadius,
        limit: 50,
        type: serverCategory,
        q: debouncedSearchQuery || undefined,
        location: locationFilter !== 'All' ? locationFilter : undefined,
        sort: serverSort,
        barterOnly: selectedCategory === 'barter',
        urgentOnly,
    });

    const [filteredPosts, setFilteredPosts] = useState<any[]>([]);

    // Actually, "Select Date" implies filtering by specific date.
    const [selectedDate, setSelectedDate] = useState<string | null>(null); // YYYY-MM-DD


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
        if (viewMode !== initialViewMode) {
            setViewMode(initialViewMode);
        }
    }, [initialViewMode, viewMode]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery.trim());
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timeout);
    }, [searchQuery]);

    const matchesActiveFilters = useCallback((post: any) => {
        if (!post) return false;

        if (selectedCategory !== 'all') {
            if (selectedCategory === 'barter') {
                if (!post.acceptsBarter && post.type !== 'barter') return false;
            } else if (selectedCategory === 'sell') {
                if (!['sell', 'rent'].includes(post.type)) return false;
            } else if (post.type !== selectedCategory) {
                return false;
            }
        }

        if (locationFilter !== 'All' && post.location !== locationFilter) {
            return false;
        }

        const trimmedQuery = debouncedSearchQuery.trim().toLowerCase();
        if (trimmedQuery) {
            const searchableText = [
                post.title,
                post.description,
                post.location,
                post.type,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            if (!searchableText.includes(trimmedQuery)) {
                return false;
            }
        }

        if (selectedDate) {
            const postDate = post.createdAt ? toDateKey(new Date(post.createdAt)) : null;
            if (postDate !== selectedDate) {
                return false;
            }
        }

        if (urgentOnly && !post.isUrgent) {
            return false;
        }

        if (priceRange !== 'all') {
            const rawPrice = post.price !== undefined && post.price !== null && post.price !== ''
                ? Number(post.price)
                : null;
            if (rawPrice === null || isNaN(rawPrice)) {
                if (priceRange !== 'under500') return false;
            } else {
                if (priceRange === 'under500' && rawPrice > 500) return false;
                if (priceRange === '500to2000' && (rawPrice < 500 || rawPrice > 2000)) return false;
                if (priceRange === '2000to10000' && (rawPrice < 2000 || rawPrice > 10000)) return false;
                if (priceRange === 'above10000' && rawPrice < 10000) return false;
            }
        }

        if (isNearby) {
            if (!userLocation || !post.locationCoords?.coordinates?.length) {
                return false;
            }

            const [lng, lat] = post.locationCoords.coordinates;
            const distance = getDistanceInKm(userLocation, { lat, lng });
            if (distance > distanceRadius) {
                return false;
            }
        }

        return true;
    }, [debouncedSearchQuery, distanceRadius, isNearby, locationFilter, priceRange, selectedCategory, selectedDate, urgentOnly, userLocation]);

    const handleNewPost = useCallback((newPost: any) => {
        if (!matchesActiveFilters(newPost)) {
            return;
        }

        const queryKey = ['posts', {
            latitude: isNearby ? userLocation?.lat : undefined,
            longitude: isNearby ? userLocation?.lng : undefined,
            radius: distanceRadius,
            limit: 50,
            type: serverCategory,
            q: debouncedSearchQuery || undefined,
            location: locationFilter !== 'All' ? locationFilter : undefined,
            sort: serverSort,
            barterOnly: selectedCategory === 'barter',
            urgentOnly
        }];
        queryClient.setQueryData(queryKey, (oldData: any[]) => {
            if (!oldData) return [newPost];

            const withoutDuplicate = oldData.filter((post: any) => post._id !== newPost._id);
            return [newPost, ...withoutDuplicate];
        });
        success('New post added!');
    }, [debouncedSearchQuery, distanceRadius, isNearby, locationFilter, matchesActiveFilters, queryClient, selectedCategory, serverCategory, serverSort, success, urgentOnly, userLocation?.lat, userLocation?.lng]);

    // const [refreshing, setRefreshing] = useState(false); // Managed by React Query now

    const requestLocationPermission = useCallback(async () => {
        try {
            const coords = await requestLocation();
            if (coords) return true;

            showError('Unable to get your location. Check location permission and GPS, then try again.');
            return false;
        } catch (err) {
            console.warn('Location permission request failed', err);
            return false;
        }
    }, [requestLocation, showError]);

    const fetchUnreadMsgCount = useCallback(async () => {
        if (!isAuthenticated) {
            setUnreadMsgCount(0);
            return;
        }

        try {
            const res = await api.get('/chat/unread/count');
            setUnreadMsgCount(res.data.count);
        } catch (err) {
            console.error('Failed to fetch unread messages count', err);
        }
    }, [isAuthenticated]);

    const onRefresh = useCallback(async () => {
        refetch();
    }, [refetch]);

    // Removed manual fetchPosts function

    const handleNearbyToggle = async () => {
        if (!isNearby) {
            setNearbyLoading(true);
            try {
                const coords = await requestLocation();
                if (coords) {
                    setIsNearby(true);
                    setLocationFilter('All');
                    showInfo('Filtered by nearby posts');
                } else {
                    showError('Please grant location permission to view nearby posts');
                }
            } catch {
                showError('Unable to retrieve location');
            } finally {
                setNearbyLoading(false);
            }
        } else {
            setIsNearby(false);
        }
    };

    const resetFilters = useCallback(() => {
        setSearchQuery('');
        setDebouncedSearchQuery('');
        setSelectedCategory('all');
        setSortOrder('latest');
        setPriceRange('all');
        setUrgentOnly(false);
        setLocationFilter('All');
        setSelectedDate(null);
        setIsNearby(false);
        setDistanceRadius(DEFAULT_DISTANCE_RADIUS);
        setSelectedPost(null);
        setShowFilterModal(false);
        setShowLocationModal(false);
    }, []);

    const hasActiveFilters = searchQuery.trim() !== ''
        || selectedCategory !== 'all'
        || locationFilter !== 'All'
        || selectedDate !== null
        || urgentOnly
        || sortOrder !== 'latest'
        || priceRange !== 'all'
        || isNearby;

    const filterPosts = useCallback(() => {
        let result = [...(postsData || [])].filter(matchesActiveFilters);

        result.sort((a: any, b: any) => {
            if (sortOrder === 'price_asc') {
                const pA = Number(a.price) || 0;
                const pB = Number(b.price) || 0;
                return pA - pB;
            }
            if (sortOrder === 'price_desc') {
                const pA = Number(a.price) || 0;
                const pB = Number(b.price) || 0;
                return pB - pA;
            }
            if (sortOrder === 'urgent') {
                return (b.isUrgent ? 1 : 0) - (a.isUrgent ? 1 : 0);
            }
            if (sortOrder === 'nearest') {
                const parseDistance = (value: any) => {
                    if (typeof value === 'number') return value;
                    if (typeof value !== 'string') return Infinity;
                    if (value.endsWith('m away')) return parseFloat(value);
                    if (value.endsWith('km away')) return parseFloat(value) * 1000;
                    return Infinity;
                };
                const distA = parseDistance(a.distance);
                const distB = parseDistance(b.distance);
                return distA - distB;
            }
            // Default latest
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });

        setFilteredPosts(result);
    }, [matchesActiveFilters, postsData, sortOrder]);

    useEffect(() => {
        if (isAuthenticated) {
            void fetchUnreadMsgCount();
        } else {
            setUnreadMsgCount(0);
        }
    }, [fetchUnreadMsgCount, isAuthenticated]);

    useEffect(() => {
        if (socket) {
            socket.on('new_post', handleNewPost);

            if (isAuthenticated) {
                socket.on('receive_message', fetchUnreadMsgCount);
                socket.on('messages_read', fetchUnreadMsgCount);
                socket.on('unread_count_update', fetchUnreadMsgCount);
            }

            return () => {
                socket.off('new_post', handleNewPost);

                if (isAuthenticated) {
                    socket.off('receive_message', fetchUnreadMsgCount);
                    socket.off('messages_read', fetchUnreadMsgCount);
                    socket.off('unread_count_update', fetchUnreadMsgCount);
                }
            };
        }
    }, [socket, handleNewPost, fetchUnreadMsgCount, isAuthenticated]);

    useEffect(() => {
        if (postsData) {
            const locs = Array.from(new Set((postsData as any[]).map(p => p.location).filter(Boolean)));
            setAvailableLocations(['All', ...locs]);
        }
        filterPosts();
    }, [postsData, selectedDate, filterPosts]);

    // State moved to top

    // Filter posts that have location coordinates for the map
    const mapPosts = React.useMemo(() => {
        return filteredPosts.filter(p => p.locationCoords && p.locationCoords.coordinates);
    }, [filteredPosts]);

    // Pre-fuzz coordinates to ensure stability (deterministic fuzz base on ID)
    const fuzzedPosts = React.useMemo(() => {
        return mapPosts.map(p => {
            // Use post ID to create a deterministic offset
            const seed = p._id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
            const latOffset = ((seed % 100) / 100 - 0.5) * 0.004;
            const lngOffset = (((seed * 13) % 100) / 100 - 0.5) * 0.004;

            return {
                ...p,
                fuzzedLat: p.locationCoords.coordinates[1] + latOffset,
                fuzzedLng: p.locationCoords.coordinates[0] + lngOffset
            };
        });
    }, [mapPosts]);

    const mapHTML = useMemo(() => buildFeedMapHtml({
        background: colors.background,
        isDark,
        userLocation,
        posts: fuzzedPosts,
        distanceRadius,
    }), [colors.background, isDark, userLocation, fuzzedPosts, distanceRadius]);

    const handleWebMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'markerClick') {
                const post = filteredPosts.find(p => p._id === data.postId);
                if (post) setSelectedPost(post);
            } else if (data.type === 'requestLocation') {
                requestLocationPermission();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const renderFeedState = () => {
        if (loading) return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[themeStyles.textSecondary, { marginTop: 12 }]}>Loading posts...</Text>
            </View>
        );

        if (isError) return (
            <View style={[styles.loadingContainer, { padding: 20 }]}>
                <Text style={[themeStyles.text, { marginBottom: 12, textAlign: 'center' }]}>
                    Failed to load posts.
                </Text>
                <TouchableOpacity
                    onPress={() => refetch()}
                    style={{ padding: 12, backgroundColor: colors.primary, borderRadius: 8 }}
                >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Retry</Text>
                </TouchableOpacity>
            </View>
        );

        return null;
    };

    const renderListContent = () => {
        const state = renderFeedState();
        if (state) return state;

        return (
            <FlashList
                data={filteredPosts}
                keyExtractor={(item: any) => item._id}
                numColumns={1}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]} // Android
                    />
                }
                renderItem={({ item, index }: any) => (
                    <Animated.View
                        entering={FadeInDown.delay(Math.min(index * 100, 600)).springify()}
                        style={styles.gridItemWrapper}
                    >
                        <PostCard
                            post={item}
                            onPress={() => navigation.navigate('PostDetails', { id: item._id })}
                        />
                    </Animated.View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconContainer}>
                            <Search size={48} color="#af25f4" />
                        </View>
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>No posts found</Text>
                        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                            {hasActiveFilters
                                ? "Try adjusting your filters to see more results"
                                : "Be the first to create a post in your area!"}
                        </Text>
                        {hasActiveFilters && (
                            <TouchableOpacity
                                style={styles.resetButton}
                                onPress={resetFilters}
                            >
                                <Text style={styles.resetButtonText}>Reset Filters</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
            />
        );
    };

    return (
        <AppScreen withBackground edges={['top']}>
            <Animated.View
                entering={FadeInDown.delay(200).duration(600).springify()}
                style={styles.headerSection}
            >
                <View style={styles.topBar}>
                    <View style={styles.brandContainer}>
                        <View style={[styles.logoWrapper, { backgroundColor: colors.cardSoft, borderColor: colors.borderSoft }]}>
                            <Image
                                source={require('../assets/logo.png')}
                                style={styles.headerLogo}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>
                            MyCircle<Text style={{ color: colors.primary }}>.</Text>
                        </Text>
                    </View>
                    <View style={styles.headerIcons}>
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('Notifications')} 
                            style={styles.iconButton}
                            activeOpacity={0.8}
                        >
                            <Bell size={24} color={colors.text} />
                            {unreadCount > 0 && (
                                <View style={[styles.badge, { backgroundColor: '#ef4444' }]}>
                                    <Text style={styles.badgeText}>{unreadCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={() => navigation.navigate('ChatList')} 
                            style={styles.iconButton}
                            activeOpacity={0.8}
                        >
                            <MessageCircle size={24} color={colors.text} />
                            {unreadMsgCount > 0 && (
                                <View style={[styles.badge, { backgroundColor: '#af25f4' }]}>
                                    <Text style={styles.badgeText}>{unreadMsgCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>

            {/* Modern Search and Filters */}
            <Animated.View
                entering={FadeInDown.delay(400).duration(800).springify()}
                style={styles.searchSection}
            >
                <View style={styles.searchRow}>
                    <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.borderSoft, flex: 1 }]}>
                        <Search size={20} color={colors.placeholder} style={styles.searchIcon} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="Search products, services, barter..."
                            placeholderTextColor={colors.placeholder}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity 
                                onPress={() => setSearchQuery('')} 
                                style={styles.clearButton}
                            >
                                <X size={18} color={colors.placeholder} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.filterTriggerButton,
                            { backgroundColor: colors.card, borderColor: colors.borderSoft },
                            (sortOrder !== 'latest' || priceRange !== 'all' || urgentOnly || isNearby) && {
                                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                                borderColor: colors.primary,
                            }
                        ]}
                        onPress={() => setShowFilterModal(true)}
                        activeOpacity={0.8}
                    >
                        <SlidersHorizontal
                            size={18}
                            color={(sortOrder !== 'latest' || priceRange !== 'all' || urgentOnly || isNearby) ? colors.primary : colors.text}
                        />
                        {((sortOrder !== 'latest' ? 1 : 0) + (priceRange !== 'all' ? 1 : 0) + (urgentOnly ? 1 : 0) + (isNearby ? 1 : 0)) > 0 && (
                            <View style={[styles.filterCountBadge, { backgroundColor: colors.primary }]}>
                                <Text style={styles.filterCountText}>
                                    {(sortOrder !== 'latest' ? 1 : 0) + (priceRange !== 'all' ? 1 : 0) + (urgentOnly ? 1 : 0) + (isNearby ? 1 : 0)}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Categories and Filters */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryScrollView}
                    contentContainerStyle={styles.filterContainer}
                >
                    {/* Category Chips */}
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[
                                styles.filterChip,
                                { backgroundColor: colors.card, borderColor: colors.borderSoft },
                                selectedCategory === cat.id && { backgroundColor: colors.primary, borderColor: colors.primary }
                            ]}
                            onPress={() => setSelectedCategory(cat.id)}
                        >
                            <cat.icon size={15} color={selectedCategory === cat.id ? '#ffffff' : colors.textSecondary} />
                            <Text style={[
                                styles.filterText,
                                { color: selectedCategory === cat.id ? '#ffffff' : colors.textSecondary, marginLeft: 6 }
                            ]}>
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    ))}

                    {/* Location Picker */}
                    <TouchableOpacity
                        style={[
                            styles.filterChip,
                            { backgroundColor: colors.card, borderColor: colors.borderSoft },
                            locationFilter !== 'All' && { backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: colors.primary }
                        ]}
                        onPress={() => setShowLocationModal(true)}
                    >
                        <MapIcon size={15} color={locationFilter !== 'All' ? colors.primary : colors.textSecondary} />
                        <Text style={[
                            styles.filterText,
                            { color: locationFilter !== 'All' ? colors.primary : colors.textSecondary, marginLeft: 6 }
                        ]}>
                            {locationFilter !== 'All' ? locationFilter : 'Location'}
                        </Text>
                    </TouchableOpacity>

                    {/* Date Picker */}
                    <TouchableOpacity
                        style={[
                            styles.filterChip,
                            { backgroundColor: colors.card, borderColor: colors.borderSoft },
                            selectedDate && { backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: colors.primary }
                        ]}
                        onPress={() => setShowFilterModal(true)}
                    >
                        <CalendarDays size={15} color={selectedDate ? colors.primary : colors.textSecondary} />
                        <Text style={[
                            styles.filterText,
                            { color: selectedDate ? colors.primary : colors.textSecondary, marginLeft: 6 }
                        ]}>
                            {selectedDate ? selectedDate.slice(5) : 'Date'}
                        </Text>
                    </TouchableOpacity>

                    <View style={[styles.filterDivider, { backgroundColor: colors.borderSoft }]} />

                    {/* Quick Urgent Filter */}
                    <TouchableOpacity
                        style={[
                            styles.filterChip,
                            { backgroundColor: colors.card, borderColor: colors.borderSoft },
                            urgentOnly && { backgroundColor: '#ef4444', borderColor: '#ef4444' }
                        ]}
                        onPress={() => setUrgentOnly(!urgentOnly)}
                    >
                        <Flame size={15} color={urgentOnly ? '#ffffff' : '#ef4444'} />
                        <Text style={[
                            styles.filterText,
                            { color: urgentOnly ? '#ffffff' : colors.text, marginLeft: 6 }
                        ]}>
                            Urgent
                        </Text>
                    </TouchableOpacity>

                    {/* Quick Sort Chip */}
                    <TouchableOpacity
                        style={[
                            styles.filterChip,
                            { backgroundColor: colors.card, borderColor: colors.borderSoft },
                            sortOrder !== 'latest' && { backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: colors.primary }
                        ]}
                        onPress={() => setShowFilterModal(true)}
                    >
                        <ArrowDownUp size={15} color={sortOrder !== 'latest' ? colors.primary : colors.textSecondary} />
                        <Text style={[
                            styles.filterText,
                            { color: sortOrder !== 'latest' ? colors.primary : colors.textSecondary, marginLeft: 6 }
                        ]}>
                            {sortOrder === 'price_asc' ? 'Price ↑' : sortOrder === 'price_desc' ? 'Price ↓' : sortOrder === 'nearest' ? 'Nearest' : sortOrder === 'urgent' ? 'Urgent' : 'Newest'}
                        </Text>
                    </TouchableOpacity>

                    {/* Quick Price Chip */}
                    <TouchableOpacity
                        style={[
                            styles.filterChip,
                            { backgroundColor: colors.card, borderColor: colors.borderSoft },
                            priceRange !== 'all' && { backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: colors.primary }
                        ]}
                        onPress={() => setShowFilterModal(true)}
                    >
                        <Text style={[
                            styles.filterText,
                            { color: priceRange !== 'all' ? colors.primary : colors.textSecondary }
                        ]}>
                            {priceRange === 'under500' ? '< ₹500' : priceRange === '500to2000' ? '₹500 - 2k' : priceRange === '2000to10000' ? '₹2k - 10k' : priceRange === 'above10000' ? '₹10k+' : 'All Prices'}
                        </Text>
                    </TouchableOpacity>

                    {/* Nearby Distance Filter */}
                    <TouchableOpacity
                        style={[
                            styles.filterChip,
                            { backgroundColor: colors.card, borderColor: colors.borderSoft },
                            isNearby && { backgroundColor: colors.primary, borderColor: colors.primary }
                        ]}
                        onPress={handleNearbyToggle}
                    >
                        <MapPin size={15} color={isNearby ? '#ffffff' : colors.textSecondary} />
                        <Text style={[
                            styles.filterText,
                            { color: isNearby ? '#ffffff' : colors.textSecondary, marginLeft: 6 }
                        ]}>
                            {isNearby ? `${distanceRadius}km` : 'Nearby'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </Animated.View>

            {viewMode === 'list' ? (
                renderListContent()
            ) : loading || isError ? (
                renderFeedState()
            ) : (
                <View style={{ flex: 1 }}>
                    <WebView
                        originWhitelist={['*']}
                        source={{ html: mapHTML }}
                        style={{ flex: 1, backgroundColor: colors.background }}
                        onMessage={handleWebMessage}
                    />
                    {selectedPost && (
                        <View style={styles.bottomSheet}>
                            <View style={styles.bottomSheetHandle} />
                            <TouchableOpacity style={styles.closeSheetButton} onPress={() => setSelectedPost(null)}>
                                <X size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                <View style={[styles.typeBadge, {
                                    backgroundColor: getCatColor(selectedPost.type, colors)
                                }]}>
                                    <Text style={styles.typeBadgeText}>{selectedPost.type.toUpperCase()}</Text>
                                </View>
                                <Text style={{ color: colors.textSecondary, marginLeft: 8, fontSize: 12 }}>
                                    {selectedPost.location}
                                </Text>
                            </View>
                            <Text style={styles.sheetTitle} numberOfLines={1}>{selectedPost.title}</Text>
                            <Text style={styles.sheetPrice}>₹{selectedPost.price}</Text>
                            <TouchableOpacity
                                style={[styles.viewDetailsButton, { backgroundColor: colors.primary }]}
                                onPress={() => {
                                    navigation.navigate('PostDetails', { id: selectedPost._id });
                                    setSelectedPost(null);
                                }}
                            >
                                <Text style={styles.viewDetailsText}>View Details</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
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
            {/* Advanced Filter and Sorting Modal */}
            <Modal
                transparent={true}
                visible={showFilterModal}
                animationType="slide"
                onRequestClose={() => setShowFilterModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.filterModalCard, { backgroundColor: colors.card, borderColor: colors.borderSoft }]}>
                        <View style={styles.filterModalHeader}>
                            <Text style={[styles.filterModalTitle, { color: colors.text }]}>
                                Filter & Sort Marketplace
                            </Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)} style={styles.modalCloseBtn}>
                                <X size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                            {/* Sort Section */}
                            <Text style={[styles.filterSectionTitle, { color: colors.textSecondary }]}>SORT BY</Text>
                            <View style={styles.filterOptionGroup}>
                                {[
                                    { id: 'latest', label: '🕒 Newest First' },
                                    { id: 'price_asc', label: '💰 Price: Low to High' },
                                    { id: 'price_desc', label: '💎 Price: High to Low' },
                                    { id: 'urgent', label: '⚡ Urgent Deals First' },
                                    { id: 'nearest', label: '📍 Distance: Nearest' },
                                ].map((opt) => (
                                    <TouchableOpacity
                                        key={opt.id}
                                        style={[
                                            styles.filterOptionPill,
                                            { backgroundColor: colors.background, borderColor: colors.borderSoft },
                                            sortOrder === opt.id && { backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: colors.primary }
                                        ]}
                                        onPress={() => setSortOrder(opt.id as any)}
                                    >
                                        <Text style={[
                                            styles.filterOptionText,
                                            { color: sortOrder === opt.id ? colors.primary : colors.text }
                                        ]}>
                                            {opt.label}
                                        </Text>
                                        {sortOrder === opt.id && <Check size={16} color={colors.primary} />}
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Price Range Section */}
                            <Text style={[styles.filterSectionTitle, { color: colors.textSecondary, marginTop: 16 }]}>PRICE RANGE</Text>
                            <View style={styles.filterOptionGroup}>
                                {[
                                    { id: 'all', label: 'All Prices' },
                                    { id: 'under500', label: 'Under ₹500' },
                                    { id: '500to2000', label: '₹500 - ₹2,000' },
                                    { id: '2000to10000', label: '₹2,000 - ₹10,000' },
                                    { id: 'above10000', label: '₹10,000+' },
                                ].map((opt) => (
                                    <TouchableOpacity
                                        key={opt.id}
                                        style={[
                                            styles.filterOptionPill,
                                            { backgroundColor: colors.background, borderColor: colors.borderSoft },
                                            priceRange === opt.id && { backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: colors.primary }
                                        ]}
                                        onPress={() => setPriceRange(opt.id as any)}
                                    >
                                        <Text style={[
                                            styles.filterOptionText,
                                            { color: priceRange === opt.id ? colors.primary : colors.text }
                                        ]}>
                                            {opt.label}
                                        </Text>
                                        {priceRange === opt.id && <Check size={16} color={colors.primary} />}
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Post Date Section */}
                            <Text style={[styles.filterSectionTitle, { color: colors.textSecondary, marginTop: 16 }]}>POST DATE</Text>
                            <View style={styles.filterOptionGroup}>
                                {[
                                    { id: null, label: 'Any date' },
                                    { id: toDateKey(new Date()), label: 'Today' },
                                    { id: toDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000)), label: 'Yesterday' },
                                ].map((opt) => (
                                    <TouchableOpacity
                                        key={opt.label}
                                        style={[
                                            styles.filterOptionPill,
                                            { backgroundColor: colors.background, borderColor: colors.borderSoft },
                                            selectedDate === opt.id && { backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: colors.primary }
                                        ]}
                                        onPress={() => setSelectedDate(opt.id)}
                                    >
                                        <Text style={[
                                            styles.filterOptionText,
                                            { color: selectedDate === opt.id ? colors.primary : colors.text }
                                        ]}>
                                            {opt.label}
                                        </Text>
                                        {selectedDate === opt.id && <Check size={16} color={colors.primary} />}
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Distance Radius Section */}
                            <Text style={[styles.filterSectionTitle, { color: colors.textSecondary, marginTop: 16 }]}>DISTANCE RADIUS</Text>
                            <View style={styles.distanceChipsRow}>
                                {[5, 10, 25, 50].map((radius) => (
                                    <TouchableOpacity
                                        key={radius}
                                        style={[
                                            styles.distanceRadiusChip,
                                            { backgroundColor: colors.background, borderColor: colors.borderSoft },
                                            isNearby && distanceRadius === radius && { backgroundColor: colors.primary, borderColor: colors.primary }
                                        ]}
                                        onPress={async () => {
                                            if (!userLocation) {
                                                const coords = await requestLocation();
                                                if (coords) {
                                                    setIsNearby(true);
                                                    setDistanceRadius(radius);
                                                } else {
                                                    showError('Please grant location permission to filter by distance');
                                                }
                                            } else {
                                                setIsNearby(true);
                                                setDistanceRadius(radius);
                                            }
                                        }}
                                    >
                                        <Text style={[
                                            styles.filterOptionText,
                                            { color: isNearby && distanceRadius === radius ? '#ffffff' : colors.text }
                                        ]}>
                                            {radius} km
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity
                                    style={[
                                        styles.distanceRadiusChip,
                                        { backgroundColor: colors.background, borderColor: colors.borderSoft },
                                        !isNearby && { backgroundColor: colors.primary, borderColor: colors.primary }
                                    ]}
                                    onPress={() => setIsNearby(false)}
                                >
                                    <Text style={[
                                        styles.filterOptionText,
                                        { color: !isNearby ? '#ffffff' : colors.text }
                                    ]}>
                                        Anywhere
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>

                        {/* Modal Action Buttons */}
                        <View style={styles.modalActionButtons}>
                            <TouchableOpacity
                                style={[styles.filterResetBtn, { borderColor: colors.borderSoft }]}
                                onPress={resetFilters}
                            >
                                <Text style={[styles.filterResetBtnText, { color: colors.textSecondary }]}>Reset All</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.applyButton, { backgroundColor: colors.primary }]}
                                onPress={() => setShowFilterModal(false)}
                            >
                                <Text style={styles.applyButtonText}>Apply Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </AppScreen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerSection: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 4,
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: '800',
        fontFamily: 'System',
        letterSpacing: -0.5,
    },
    titleDot: {
        color: '#af25f4',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    logoWrapper: {
        width: 36,
        height: 36,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    headerLogo: {
        width: 24,
        height: 24,
    },
    headerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconButton: {
        padding: 4,
    },
    badge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        minWidth: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 2,
    },
    badgeText: {
        fontSize: 10,
        color: '#ffffff',
        fontWeight: 'bold',
    },
    searchSection: {
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#ffffff',
    },
    clearButton: {
        marginLeft: 12,
    },
    categoryScrollView: {
        marginTop: 14,
        marginBottom: 8,
    },
    filterContainer: {
        paddingHorizontal: 4,
        paddingVertical: 2,
        gap: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
    },
    filterChipActive: {
        backgroundColor: '#af25f4',
        borderColor: '#af25f4',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#94a3b8',
    },
    filterDivider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginHorizontal: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 110,
    },
    gridItemWrapper: {
        flex: 1,
        marginBottom: 12,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        paddingBottom: 110,
        paddingHorizontal: 20,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(175, 37, 244, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    resetButton: {
        backgroundColor: '#af25f4',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    resetButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
        backgroundColor: '#18181b',
        borderRadius: 24,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    bottomSheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#3f3f46',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    closeSheetButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10
    },
    sheetTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    sheetPrice: {
        color: '#4ade80',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    viewDetailsButton: {
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: 'center',
    },
    viewDetailsText: {
        color: 'white',
        fontWeight: 'bold',
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    typeBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    loadingOverlay: {
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: '600',
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
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    filterTriggerButton: {
        width: 48,
        height: 48,
        borderRadius: 16,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    filterCountBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterCountText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: '700',
    },
    filterModalCard: {
        width: '90%',
        borderRadius: 24,
        borderWidth: 1,
        padding: 20,
        maxHeight: '85%',
    },
    filterModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(148, 163, 184, 0.15)',
    },
    filterModalTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    modalCloseBtn: {
        padding: 4,
    },
    filterSectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 10,
    },
    filterOptionGroup: {
        gap: 8,
    },
    filterOptionPill: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1,
    },
    filterOptionText: {
        fontSize: 14,
        fontWeight: '600',
    },
    distanceChipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    distanceRadiusChip: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1,
    },
    modalActionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: 'rgba(148, 163, 184, 0.15)',
    },
    filterResetBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterResetBtnText: {
        fontSize: 14,
        fontWeight: '600',
    },
    applyButton: {
        flex: 2,
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '700',
    },
});

export default FeedScreen;
