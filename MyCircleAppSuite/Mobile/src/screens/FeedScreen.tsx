import React, { useEffect, useState, useCallback } from 'react';
import { usePosts } from '../hooks/usePosts';
import { useQueryClient } from '@tanstack/react-query';
import { View, Text, ActivityIndicator, TextInput, ScrollView, TouchableOpacity, StyleSheet, Modal, RefreshControl, AppState, StatusBar, Dimensions } from 'react-native';
import { Alert } from '../utils/alert';
import { FlashList } from "@shopify/flash-list";
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Briefcase, Zap, ShoppingCart, MapPin, ArrowUpDown, X, Check, Bell, MessageCircle } from 'lucide-react-native';
import api from '../services/api';
import Animated, {
    FadeInDown,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getCurrentLocation } from '../utils/location';
import { useNotifications } from '../context/NotificationContext';
import Sound from 'react-native-sound';
import PostCard from '../components/ui/PostCard';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../components/ui/Toast';

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

const { width, height } = Dimensions.get('window');

const FeedScreen = ({ navigation, route }: any) => {
    const { isAuthenticated } = useAuth();
    const initialViewMode = route?.params?.viewMode || 'list';
    const { colors } = useTheme();
    const { socket } = useSocket() as any; // Type assertion if needed
    const { success } = useToast();
    const queryClient = useQueryClient();
    const { unreadCount } = useNotifications();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [unreadMsgCount, setUnreadMsgCount] = useState(0);
    const [viewMode, setViewMode] = useState<'list' | 'map'>(initialViewMode);
    const [selectedPost, setSelectedPost] = useState<any | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [mapLoading, setMapLoading] = useState(false);

    // Chat Badge Logic




    // Filters
    const [sortOrder, setSortOrder] = useState<'latest' | 'oldest' | 'urgent' | 'nearest'>('latest');
    const [locationFilter, setLocationFilter] = useState('All');
    const [availableLocations, setAvailableLocations] = useState<string[]>(['All']);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [isNearby, setIsNearby] = useState(false);
    const [, setNearbyLoading] = useState(false);

    // Distance filter (radius in km)
    const [distanceRadius, setDistanceRadius] = useState<number>(50); // Default 50km (All)

    // React Query Hook
    const serverCategory = selectedCategory === 'barter' ? 'barter' : selectedCategory;
    const serverSort = sortOrder === 'nearest' && !isNearby ? 'latest' : sortOrder;

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
    }, [distanceRadius, isNearby, locationFilter, searchQuery, selectedCategory, selectedDate, userLocation]);

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
            const loc = await getCurrentLocation();
            if (loc) {
                setUserLocation({ lat: loc.latitude, lng: loc.longitude });
                return true;
            }
            return false;
        } catch (err) {
            console.warn('Location permission request failed', err);
            return false;
        }
    }, []);

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
        if (!userLocation) requestLocationPermission();
    }, [refetch, requestLocationPermission, userLocation]);

    // Auto-check location when returning to app (e.g. from Settings)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                requestLocationPermission();
            }
        });
        return () => subscription.remove();
    }, [requestLocationPermission]);

    // Removed manual fetchPosts function

    const handleNearbyToggle = async () => {
        if (!isNearby) {
            setNearbyLoading(true);
            const loc = await getCurrentLocation() as any;
            if (loc) {
                setIsNearby(true);
                setLocationFilter('All');
            } else {
                setNearbyLoading(false);
            }
        } else {
            setIsNearby(false);
        }
    };

    const handleDistanceChange = useCallback((radius: number) => {
        setDistanceRadius(radius);
    }, []);

    const filterPosts = useCallback(() => {
        let result = [...(postsData || [])].filter(matchesActiveFilters);

        result.sort((a: any, b: any) => {
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
            return 0;
        });

        setFilteredPosts(result);
    }, [matchesActiveFilters, postsData, sortOrder]);

    useEffect(() => {
        requestLocationPermission();

        if (isAuthenticated) {
            void fetchUnreadMsgCount();
        } else {
            setUnreadMsgCount(0);
        }
    }, [requestLocationPermission, fetchUnreadMsgCount, isAuthenticated]);

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

    const toggleViewMode = useCallback(async () => {
        if (viewMode === 'list') {
            setMapLoading(true);
            try {
                // Fetch fresh user location when switching to map
                const loc = await getCurrentLocation();
                if (loc) {
                    setUserLocation({ lat: loc.latitude, lng: loc.longitude });
                } else {
                    // If denied, still allow map but center on default
                    console.log('Location denied or failed, using default center');
                }
            } catch (err) {
                console.error('Error fetching location:', err);
            } finally {
                // Add a slight delay to ensure smooth transition
                setTimeout(() => {
                    setViewMode('map');
                    setMapLoading(false);
                }, 300);
            }
        } else {
            setViewMode('list');
        }
    }, [viewMode]);

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
                    var mapStyle = isDark 
                        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

                    L.tileLayer(mapStyle, {
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                        subdomains: 'abcd',
                        maxZoom: 20
                    }).addTo(map);

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

    const handleRequestContact = useCallback(async (postId: string) => {
        try {
            await api.post(`/contacts/${postId}`);
            Alert.alert("Success", "Contact Request Sent!");
        } catch (err: any) {
            Alert.alert("Error", err.response?.data?.msg || "Failed to send request");
        }
    }, []);

    const toggleSort = useCallback(() => {
        setSortOrder(prev => prev === 'latest' ? 'oldest' : 'latest');
    }, []);

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
                        <Text style={styles.emptyTitle}>No posts found</Text>
                        <Text style={styles.emptySubtitle}>
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
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Modern Gradient Background */}
            <View style={styles.backgroundGradient}>
                <View style={[styles.gradientLayer, { backgroundColor: '#0a0a0a' }]} />
                <View style={[styles.gradientLayer, { backgroundColor: '#1a1a2e', opacity: 0.8 }]} />
                <View style={[styles.gradientLayer, { backgroundColor: '#16213e', opacity: 0.6 }]} />
            </View>

            {/* Subtle Grid Pattern */}
            <View style={styles.gridPattern}>
                {[...Array(15)].map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.gridLine,
                            {
                                left: (i % 5) * (width / 5),
                                top: Math.floor(i / 5) * (height / 3),
                                width: 1,
                                height: height / 3,
                            }
                        ]}
                    />
                ))}
            </View>

            <Animated.View
                entering={FadeInDown.delay(200).duration(600).springify()}
                style={styles.headerSection}
            >
                <View style={styles.topBar}>
                    <Text style={styles.headerTitle}>
                        Explore<Text style={styles.titleDot}>.</Text>
                    </Text>
                    <View style={styles.headerIcons}>
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('Notifications')} 
                            style={styles.iconButton}
                            activeOpacity={0.8}
                        >
                            <Bell size={24} color="#ffffff" />
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
                            <MessageCircle size={24} color="#ffffff" />
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
                <View style={styles.searchContainer}>
                    <Search size={20} color="#94a3b8" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Find something..."
                        placeholderTextColor="#94a3b8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity 
                            onPress={() => setSearchQuery('')} 
                            style={styles.clearButton}
                        >
                            <X size={18} color="#94a3b8" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Categories and Filters */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterContainer}
                >
                    {viewMode === 'map' ? (
                        <>
                            <TouchableOpacity
                                style={[
                                    styles.filterChip,
                                    isNearby && styles.filterChipActive
                                ]}
                                onPress={handleNearbyToggle}
                            >
                                <MapPin size={16} color={isNearby ? '#ffffff' : '#94a3b8'} />
                                <Text style={[
                                    styles.filterText,
                                    { color: isNearby ? '#ffffff' : '#94a3b8', marginLeft: 8 }
                                ]}>
                                    {isNearby ? `${distanceRadius}km` : 'Nearby'}
                                </Text>
                            </TouchableOpacity>

                            {isNearby && <View style={styles.filterDivider} />}

                            {isNearby && [5, 10, 25, 50, 100].map(radius => (
                                <TouchableOpacity
                                    key={radius}
                                    style={[
                                        styles.filterChip,
                                        distanceRadius === radius && styles.filterChipActive
                                    ]}
                                    onPress={() => {
                                        setDistanceRadius(radius);
                                        handleDistanceChange(radius);
                                    }}
                                >
                                    <Text style={[
                                        styles.filterText,
                                        { color: distanceRadius === radius ? '#ffffff' : '#94a3b8' }
                                    ]}>
                                        {radius}km
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </>
                    ) : (
                        CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.filterChip,
                                    selectedCategory === cat.id && styles.filterChipActive
                                ]}
                                onPress={() => setSelectedCategory(cat.id)}
                            >
                                <cat.icon size={16} color={selectedCategory === cat.id ? '#ffffff' : '#94a3b8'} />
                                <Text style={[
                                    styles.filterText,
                                    { color: selectedCategory === cat.id ? '#ffffff' : '#94a3b8', marginLeft: 8 }
                                ]}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        ))
                    )}
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
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    backgroundGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    gradientLayer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    gridPattern: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.1,
    },
    gridLine: {
        position: 'absolute',
        backgroundColor: '#af25f4',
    },
    headerSection: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#ffffff',
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
        paddingHorizontal: 20,
        marginBottom: 20,
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
    filterContainer: {
        paddingHorizontal: 4,
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
        paddingHorizontal: 12,
        paddingTop: 8,
    },
    gridItemWrapper: {
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
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
});

export default FeedScreen;
