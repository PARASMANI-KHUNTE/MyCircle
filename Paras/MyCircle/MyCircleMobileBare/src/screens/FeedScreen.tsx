import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, TextInput, ScrollView, TouchableOpacity, StyleSheet, PermissionsAndroid, Platform, Modal, RefreshControl } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Briefcase, Zap, ShoppingCart, Key, MapPin, Calendar, ArrowUpDown, X, Check, MessageCircle, Bell, Wrench } from 'lucide-react-native';
import api from '../services/api';

const getCatColor = (catId: string, colors: any) => {
    return colors.primary; // Unified MyCircle Blue for all categories
};

import PostCard from '../components/ui/PostCard';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../components/ui/Toast';
import { useTheme } from '../context/ThemeContext';
import { getCurrentLocation } from '../utils/location';
import { useNotifications } from '../context/NotificationContext';
import Sound from 'react-native-sound';
import Animated, { FadeInDown } from 'react-native-reanimated';
import GlassView from '../components/ui/GlassView';

// Enable playback in silent mode
Sound.setCategory('Playback');

const CATEGORIES = [
    { id: 'all', label: 'All', icon: Zap },
    { id: 'job', label: 'Jobs', icon: Briefcase },
    { id: 'service', label: 'Services', icon: Zap },
    { id: 'sell', label: 'Sell or Rent', icon: ShoppingCart },
];

// Components like CategoryButton and AnimatedFilterChip have been integrated into the Floating Orbit UI for a more organic feel.

const FeedScreen = ({ navigation, route }: any) => {
    const initialViewMode = route?.params?.viewMode || 'list';
    const { colors } = useTheme();
    const { socket } = useSocket() as any; // Type assertion if needed
    const { success } = useToast();
    const { unreadCount } = useNotifications();
    const [posts, setPosts] = useState<any[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [unreadMsgCount, setUnreadMsgCount] = useState(0);

    // Chat Badge Logic




    // Filters
    const [sortOrder, setSortOrder] = useState<'latest' | 'oldest' | 'urgent' | 'nearest'>('latest');
    const [locationFilter, setLocationFilter] = useState('All');
    const [availableLocations, setAvailableLocations] = useState<string[]>(['All']);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [isNearby, setIsNearby] = useState(false);
    const [nearbyLoading, setNearbyLoading] = useState(false);

    // Distance filter (radius in km)
    const [distanceRadius, setDistanceRadius] = useState<number>(50); // Default 50km (All)

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
        fetchPosts();
        requestLocationPermission();
        fetchUnreadMsgCount();
    }, []);

    useEffect(() => {
        if (viewMode !== initialViewMode) {
            setViewMode(initialViewMode);
        }
    }, [initialViewMode]);

    useEffect(() => {
        if (socket) {
            socket.on('new_post', (newPost: any) => {
                setPosts((prev: any) => [newPost, ...prev]);
                success('New post added!');
            });
            socket.on('receive_message', () => fetchUnreadMsgCount());
            socket.on('messages_read', () => fetchUnreadMsgCount());
            socket.on('unread_count_update', () => fetchUnreadMsgCount());
            return () => {
                socket.off('new_post');
                socket.off('receive_message');
                socket.off('messages_read');
                socket.off('unread_count_update');
            };
        }
    }, [socket]);

    useEffect(() => {
        if (posts.length > 0) {
            const locs = Array.from(new Set(posts.map(p => p.location).filter(Boolean)));
            setAvailableLocations(['All', ...locs]);
        }
        filterPosts();
    }, [posts, searchQuery, selectedCategory, sortOrder, locationFilter, selectedDate, isNearby]);

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        if (isNearby) {
            const loc = await getCurrentLocation() as any;
            if (loc) {
                fetchPosts({ latitude: loc.latitude, longitude: loc.longitude }, distanceRadius);
                return;
            }
        }
        fetchPosts();
    };

    const requestLocationPermission = async () => {
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
    };

    const fetchUnreadMsgCount = async () => {
        try {
            const res = await api.get('/chat/unread/count');
            setUnreadMsgCount(res.data.count);
        } catch (err) {
            console.error('Failed to fetch unread messages count', err);
        }
    };

    const fetchPosts = async (locationParams?: { latitude: number, longitude: number }, radius?: number) => {
        try {
            setLoading(true);
            let url = '/posts';
            const searchRadius = radius || distanceRadius;
            if (locationParams) {
                url += `?latitude=${locationParams.latitude}&longitude=${locationParams.longitude}&radius=${searchRadius}`;
            }
            const res = await api.get(url);
            setPosts(res.data);
            setFilteredPosts(res.data);
        } catch (err) {
            console.log('API Error:', err);
            Alert.alert("Connection Error", "Could not connect to server.");
        } finally {
            setLoading(false);
            setNearbyLoading(false);
            setRefreshing(false);
        }
    };

    const handleDistanceChange = async (newRadius: number) => {
        if (isNearby) {
            setNearbyLoading(true);
            const loc = await getCurrentLocation() as any;
            if (loc) {
                fetchPosts({ latitude: loc.latitude, longitude: loc.longitude }, newRadius);
            }
        }
    };

    const handleNearbyToggle = async () => {
        if (!isNearby) {
            setNearbyLoading(true);
            const loc = await getCurrentLocation() as any;
            if (loc) {
                setIsNearby(true);
                setLocationFilter('All'); // Reset other location filters
                fetchPosts({ latitude: loc.latitude, longitude: loc.longitude }, distanceRadius);
            } else {
                setNearbyLoading(false);
            }
        } else {
            setIsNearby(false);
            fetchPosts(); // Refetch standard feed
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
        if (selectedCategory === 'barter') {
            result = result.filter((p: any) => p.acceptsBarter === true);
        } else if (selectedCategory !== 'all') {
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
            if (sortOrder === 'urgent') {
                // Sort by expiration (soonest first)
                const expiresA = a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity;
                const expiresB = b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity;
                return expiresA - expiresB;
            } else if (sortOrder === 'nearest') {
                // Sort by distance (assume dist.calculated exists from geoNear)
                const distA = a.dist?.calculated || Infinity;
                const distB = b.dist?.calculated || Infinity;
                return distA - distB;
            } else {
                // Sort by date (latest or oldest)
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
            }
        });

        setFilteredPosts(result);
    };

    const [viewMode, setViewMode] = useState<'list' | 'map'>(initialViewMode);
    const [selectedPost, setSelectedPost] = useState<any | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [mapLoading, setMapLoading] = useState(false);

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

    const toggleViewMode = async () => {
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
    };

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
                            radius: 100,
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
                <View style={styles.topBar}>
                    <Text style={[styles.title, themeStyles.text]}>Explore</Text>
                    <View style={styles.headerIcons}>
                        <TouchableOpacity onPress={() => (navigation as any).navigate('Notifications')} style={styles.iconButton}>
                            <Bell size={24} color={colors.text} />
                            {unreadCount > 0 && (
                                <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                                    <Text style={styles.badgeText}>{unreadCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => (navigation as any).navigate('ChatList')} style={styles.iconButton}>
                            <MessageCircle size={24} color={colors.text} />
                            {unreadMsgCount > 0 && (
                                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                                    <Text style={styles.badgeText}>{unreadMsgCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                    </View>
                </View>
            </View>

            {/* Discovery Orbit UI - Search and Filters */}
            <View style={styles.floatingOrbitContainer}>
                <GlassView intensity={10} style={styles.floatingOrbit}>
                    {/* Search Row */}
                    <View style={styles.orbitSearch}>
                        <Search size={18} color={colors.textSecondary} />
                        <TextInput
                            style={[styles.orbitInput, { color: colors.text, paddingVertical: 0 }]}
                            placeholder="Search your circle..."
                            placeholderTextColor={colors.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <X size={18} color={colors.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Categories and Distance Scroll - Context sensitive */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.orbitCategories}
                    >
                        {viewMode === 'map' ? (
                            <>
                                {/* Nearby / Distance Toggle for Map */}
                                <TouchableOpacity
                                    style={[
                                        styles.orbitCatChip,
                                        isNearby && styles.filterChipActive
                                    ]}
                                    onPress={handleNearbyToggle}
                                >
                                    <MapPin size={14} color={isNearby ? '#fff' : colors.textSecondary} />
                                    <Text style={[
                                        styles.orbitCatText,
                                        { color: isNearby ? '#fff' : colors.textSecondary, marginLeft: 6 }
                                    ]}>
                                        {isNearby ? `${distanceRadius}km` : 'Nearby'}
                                    </Text>
                                </TouchableOpacity>

                                {isNearby && (
                                    <View style={styles.orbitDivider} />
                                )}

                                {/* Distance Options for Map */}
                                {isNearby && [5, 10, 25, 50, 100].map(radius => (
                                    <TouchableOpacity
                                        key={radius}
                                        style={[
                                            styles.orbitCatChip,
                                            distanceRadius === radius && styles.filterChipActive
                                        ]}
                                        onPress={() => {
                                            setDistanceRadius(radius);
                                            handleDistanceChange(radius);
                                        }}
                                    >
                                        <Text style={[
                                            styles.orbitCatText,
                                            { color: distanceRadius === radius ? '#fff' : colors.textSecondary }
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
                                        styles.orbitCatChip,
                                        selectedCategory === cat.id && styles.filterChipActive
                                    ]}
                                    onPress={() => setSelectedCategory(cat.id)}
                                >
                                    <cat.icon size={14} color={selectedCategory === cat.id ? '#fff' : colors.textSecondary} />
                                    <Text style={[
                                        styles.orbitCatText,
                                        { color: selectedCategory === cat.id ? '#fff' : colors.textSecondary, marginLeft: 6 }
                                    ]}>
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                </GlassView>
            </View>

            {viewMode === 'list' ? (
                loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={filteredPosts}
                        keyExtractor={item => item._id}
                        numColumns={1}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={colors.primary}
                                colors={[colors.primary]} // Android
                            />
                        }
                        renderItem={({ item, index }) => (
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
                                <Text style={styles.emptyText}>Nothing here yet...</Text>
                                <TouchableOpacity onPress={() => { setSearchQuery(''); setSelectedCategory('all'); setLocationFilter('All'); setSelectedDate(null); }}>
                                    <Text style={styles.clearFilterText}>Reset Discovery</Text>
                                </TouchableOpacity>
                            </View>
                        }
                    />
                )
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
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
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
    title: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    floatingOrbit: {
        borderRadius: 24,
        marginVertical: 12,
        padding: 8,
        flexDirection: 'column',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    orbitSearch: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 44,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginBottom: 8,
    },
    orbitInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        fontWeight: '600',
    },
    orbitCategories: {
        paddingHorizontal: 4,
        gap: 8,
    },
    orbitCatChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    filterChipActive: {
        backgroundColor: '#2e1065', // violet-950
        borderColor: '#8b5cf6',
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
        paddingHorizontal: 12,
        paddingTop: 8,
    },
    gridColumnWrapper: {
        justifyContent: 'space-between',
        gap: 12,
    },
    gridItemWrapper: {
        flex: 1,
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
    orbitCatText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    orbitDivider: {
        width: 1,
        height: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginHorizontal: 8,
        alignSelf: 'center',
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
    bottomSheet: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
        backgroundColor: '#18181b', // zinc-900
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
        color: '#4ade80', // green-400
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
    floatingOrbitContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
        zIndex: 10,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        paddingHorizontal: 12,
        fontSize: 16,
    },
    filterScrollContainer: {
        flexDirection: 'row',
    },
    filterDataContainer: {
        alignItems: 'center',
        paddingRight: 20,
        gap: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        minHeight: 40,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
    },
    filterDivider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginHorizontal: 8,
    },
});

export default FeedScreen;
