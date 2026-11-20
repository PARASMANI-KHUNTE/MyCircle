import React, { useEffect, useState, useCallback } from 'react';
import { usePosts } from '../hooks/usePosts';
import { useQueryClient } from '@tanstack/react-query';
import { View, Text, ActivityIndicator, TextInput, ScrollView, TouchableOpacity, StyleSheet, Modal, RefreshControl, Image } from 'react-native';

import { FlashList } from "@shopify/flash-list";
import { WebView } from 'react-native-webview';
import AppScreen from '../components/layout/AppScreen';
import { Search, Briefcase, Zap, ShoppingCart, MapPin, ArrowUpDown, X, Check, Bell, MessageCircle, SlidersHorizontal, ArrowDownUp, Flame } from 'lucide-react-native';
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
import { LIGHT_TILE_URL, DARK_TILE_URL, LABELS_TILE_URL, MAP_ATTRIBUTION, MAP_MAX_NATIVE_ZOOM } from '../constants/mapTiles';

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

const FeedScreen = ({ navigation, route }: any) => {
    const { isAuthenticated } = useAuth();
    const initialViewMode = route?.params?.viewMode || 'list';
    const { colors } = useTheme();
    const { socket } = useSocket() as any; // Type assertion if needed
    const { success, error: showError, info: showInfo } = useToast();
    const queryClient = useQueryClient();
    const { unreadCount } = useNotifications();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [unreadMsgCount, setUnreadMsgCount] = useState(0);
    const [viewMode, setViewMode] = useState<'list' | 'map'>(initialViewMode);
    const [selectedPost, setSelectedPost] = useState<any | null>(null);
    const {
        location: userLocation,
        requestLocation,
    } = useLocation();
    const [mapLoading] = useState(false);

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
    const [distanceRadius, setDistanceRadius] = useState<number>(50); // Default 50km (All)

    // React Query Hook
    const serverCategory = selectedCategory === 'barter' ? 'barter' : selectedCategory;
    const serverSort = sortOrder === 'nearest' && !isNearby ? 'latest' : (sortOrder === 'price_asc' || sortOrder === 'price_desc') ? 'latest' : sortOrder;

    const { data: postsData, isLoading: loading, refetch, isRefetching, isError } = usePosts({
        latitude: isNearby ? userLocation?.lat : undefined,
        longitude: isNearby ? userLocation?.lng : undefined,
        radius: distanceRadius,
        limit: 50,
        type: serverCategory,
        q: searchQuery.trim() || undefined,
        location: locationFilter !== 'All' ? locationFilter : undefined,
        sort: serverSort,
        barterOnly: selectedCategory === 'barter',
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

        const trimmedQuery = searchQuery.trim().toLowerCase();
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
            const postDate = new Date(post.createdAt).toISOString().split('T')[0];
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
    }, [distanceRadius, isNearby, locationFilter, priceRange, searchQuery, selectedCategory, selectedDate, urgentOnly, userLocation]);

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
            q: searchQuery.trim() || undefined,
            location: locationFilter !== 'All' ? locationFilter : undefined,
            sort: serverSort,
            barterOnly: selectedCategory === 'barter'
        }];
        queryClient.setQueryData(queryKey, (oldData: any[]) => {
            if (!oldData) return [newPost];

            const withoutDuplicate = oldData.filter((post: any) => post._id !== newPost._id);
            return [newPost, ...withoutDuplicate];
        });
        success('New post added!');
    }, [distanceRadius, isNearby, locationFilter, matchesActiveFilters, queryClient, searchQuery, selectedCategory, serverCategory, serverSort, success, userLocation?.lat, userLocation?.lng]);

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

    const mapHTML = `
    <!DOCTYPE html>
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
                <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
                <style>
                    body {margin: 0; padding: 0; background-color: ${colors.background}; }
                    #map {height: 100vh; width: 100vw; }
                    .leaflet-container {background: ${colors.background}; }
                    
                    @keyframes pulse {
                        0% { transform: scale(0.5); opacity: 1; }
                        100% { transform: scale(2.5); opacity: 0; }
                    }
                    .user-loc-container {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    .user-loc-dot {
                        width: 14px;
                        height: 14px;
                        background: #8b5cf6;
                        border: 2px solid white;
                        border-radius: 50%;
                        z-index: 2;
                        box-shadow: 0 0 10px rgba(0,0,0,0.3);
                    }
                    .user-loc-pulse {
                        position: absolute;
                        width: 30px;
                        height: 30px;
                        background: rgba(139, 92, 246, 0.4);
                        border-radius: 50%;
                        animation: pulse 2s infinite;
                        z-index: 1;
                    }
                    
                    @keyframes markerEntrance {
                        0% { transform: scale(0); opacity: 0; }
                        60% { transform: scale(1.2); }
                        100% { transform: scale(1); opacity: 1; }
                    }
                    .post-marker-anim {
                        animation: markerEntrance 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
                    }

                    .custom-marker {
                        position: relative;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                    }
                    .marker-glass {
                        background: rgba(255, 255, 255, 0.1);
                        backdrop-filter: blur(8px);
                        -webkit-backdrop-filter: blur(8px);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        padding: 4px 10px;
                        border-radius: 12px;
                        color: white;
                        font-family: sans-serif;
                        font-weight: bold;
                        font-size: 12px;
                        white-space: nowrap;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                        border-bottom: 2px solid var(--marker-color);
                        transition: all 0.2s ease;
                    }
                    .custom-marker:hover .marker-glass {
                        transform: translateY(-2px);
                        background: rgba(255, 255, 255, 0.2);
                    }
                    .marker-tail {
                        width: 0;
                        height: 0;
                        border-left: 6px solid transparent;
                        border-right: 6px solid transparent;
                        border-top: 6px solid var(--marker-color);
                        margin-top: -1px;
                        filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));
                    }
                    .marker-price {
                        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                    }

                    /* Locate Me Button */
                    .locate-me-btn {
                        position: absolute;
                        bottom: 180px; /* Above the bottom sheet if open */
                        right: 20px;
                        width: 44px;
                        height: 44px;
                        background: rgba(255, 255, 255, 0.1);
                        backdrop-filter: blur(12px);
                        -webkit-backdrop-filter: blur(12px);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        border-radius: 12px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 1000;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                        transition: all 0.2s ease;
                        cursor: pointer;
                    }
                    .locate-me-btn:active {
                        transform: scale(0.9);
                        background: rgba(139, 92, 246, 0.3);
                    }
                    .locate-icon {
                        width: 20px;
                        height: 20px;
                        border: 2px solid white;
                        border-radius: 50%;
                        position: relative;
                    }
                    .locate-icon::after {
                        content: '';
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        width: 8px;
                        height: 8px;
                        background: white;
                        border-radius: 50%;
                    }
                </style>
            </head>
            <body>
                <div id="map"></div>
                <div class="locate-me-btn" onclick="recenterMap()">
                    <div class="locate-icon"></div>
                </div>
                <script>
                    var userLoc = ${userLocation ? JSON.stringify(userLocation) : 'null'};
                    var defaultCenter = [28.6139, 77.2090];
                    var center = userLoc ? [userLoc.lat, userLoc.lng] : defaultCenter;

                    var map = L.map('map', {zoomControl: false, zoomSnap: 0.1 }).setView(center, userLoc ? 15.5 : 12);

                    window.recenterMap = function() {
                        if (userLoc) {
                            map.flyTo([userLoc.lat, userLoc.lng], 16.5, {
                                animate: true,
                                duration: 1.5,
                                easeLinearity: 0.25
                            });
                        } else {
                            // Request location through RN if null
                            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'requestLocation' }));
                        }
                    };

                    var isDark = ${colors.background === '#000000'};
                    var mapStyle = isDark ? '${DARK_TILE_URL}' : '${LIGHT_TILE_URL}';

                    L.tileLayer(mapStyle, {
                        attribution: '${MAP_ATTRIBUTION}',
                        maxNativeZoom: ${MAP_MAX_NATIVE_ZOOM},
                        maxZoom: 19
                    }).addTo(map);
                    L.tileLayer('${LABELS_TILE_URL}', { maxNativeZoom: ${MAP_MAX_NATIVE_ZOOM}, maxZoom: 19 }).addTo(map);

                    // Add user location marker with premium animation
                    if (userLoc) {
                        var userIcon = L.divIcon({
                            className: 'user-loc-container',
                            html: '<div class="user-loc-pulse"></div><div class="user-loc-dot"></div>',
                            iconSize: [30, 30],
                            iconAnchor: [15, 15]
                        });
                        L.marker([userLoc.lat, userLoc.lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);

                        L.circle([userLoc.lat, userLoc.lng], {
                            radius: ${distanceRadius * 1000},
                            fillColor: '#8b5cf6',
                            color: '#8b5cf6',
                            weight: 1,
                            opacity: 0.2,
                            fillOpacity: 0.05
                        }).addTo(map);
                    }

                    var posts = ${JSON.stringify(fuzzedPosts.map(p => ({
        id: p._id,
        lat: p.fuzzedLat,
        lng: p.fuzzedLng,
        type: p.type,
        price: p.price,
        title: p.title,
        color: p.type === 'job' ? '#3b82f6' :
            p.type === 'service' ? '#06b6d4' :
                p.type === 'sell' ? '#f59e0b' :
                    p.type === 'rent' ? '#8b5cf6' : '#ec4899'
    })))};

                    var bounds = [];
                    if (userLoc) {
                        bounds.push([userLoc.lat, userLoc.lng]);
                    }

                    posts.forEach(function(p, index) {
                        setTimeout(function() {
                            // Custom Premium Marker
                            var markerHtml = '<div class="custom-marker" style="--marker-color: ' + p.color + '">' +
                                '<div class="marker-glass">' +
                                    '<span class="marker-price">₹' + p.price + '</span>' +
                                '</div>' +
                                '<div class="marker-tail"></div>' +
                            '</div>';

                            var markerIcon = L.divIcon({
                                className: 'custom-marker-wrapper',
                                html: markerHtml,
                                iconSize: [60, 30],
                                iconAnchor: [30, 30]
                            });

                            var marker = L.marker([p.lat, p.lng], {
                                icon: markerIcon,
                                className: 'post-marker-anim'
                            }).addTo(map);

                            marker.on('click', function() {
                                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerClick', postId: p.id }));
                                map.flyTo([p.lat, p.lng], 16.5, { duration: 1.2, easeLinearity: 0.25 });
                            });

                            bounds.push([p.lat, p.lng]);
                        }, index * 100); // Staggered entrance
                    });

                    // Initial entrance animation
                    if (userLoc) {
                        setTimeout(function() {
                            map.flyTo([userLoc.lat, userLoc.lng], 16, { animate: true, duration: 1.8 });
                        }, 500);
                    } else if (bounds.length > 0) {
                        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
                    }
                </script>
            </body>
        </html>
`;

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

    const renderListContent = () => {
        if (loading) return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
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
                        entering={FadeInDown.delay(index * 100).springify()}
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
                            {searchQuery || selectedCategory !== 'all' || locationFilter !== 'All' 
                                ? "Try adjusting your filters to see more results" 
                                : "Be the first to create a post in your area!"}
                        </Text>
                        {(searchQuery || selectedCategory !== 'all' || locationFilter !== 'All') && (
                            <TouchableOpacity 
                                style={styles.resetButton}
                                onPress={() => { 
                                    setSearchQuery(''); 
                                    setSelectedCategory('all'); 
                                    setLocationFilter('All'); 
                                    setSelectedDate(null);
                                    setIsNearby(false);
                                }}
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

            {mapLoading && (
                <View style={[StyleSheet.absoluteFill, styles.loadingOverlay, { backgroundColor: colors.background + 'CC' }]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.text }]}>Preparing Map...</Text>
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
                                onPress={() => {
                                    setSortOrder('latest');
                                    setPriceRange('all');
                                    setUrgentOnly(false);
                                    setIsNearby(false);
                                    setDistanceRadius(50);
                                }}
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
