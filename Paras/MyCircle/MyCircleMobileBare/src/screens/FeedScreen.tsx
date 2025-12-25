import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, TextInput, ScrollView, TouchableOpacity, StyleSheet, Dimensions, PermissionsAndroid, Platform, Modal } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Briefcase, Zap, ShoppingCart, Key, MapPin, Calendar, ArrowUpDown, X, Check, Repeat, MessageCircle, Bell } from 'lucide-react-native';
import api from '../services/api';
import PostCard from '../components/ui/PostCard';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../components/ui/Toast';
import { useTheme } from '../context/ThemeContext';
import { getCurrentLocation } from '../utils/location';
import { useNotifications } from '../context/NotificationContext';
import Sound from 'react-native-sound';
import Animated, { useAnimatedStyle, withSpring, withTiming, interpolateColor, useSharedValue } from 'react-native-reanimated';

// Enable playback in silent mode
Sound.setCategory('Playback');

const CATEGORIES = [
    { id: 'all', label: 'All', icon: Zap },
    { id: 'job', label: 'Jobs', icon: Briefcase },
    { id: 'service', label: 'Services', icon: Zap },
    { id: 'sell', label: 'Market', icon: ShoppingCart },
    { id: 'rent', label: 'Rentals', icon: Key },
    { id: 'barter', label: 'Barter', icon: Repeat },
];

const CategoryButton = ({ cat, isSelected, onPress, catColor, colors }: any) => {
    const scale = useSharedValue(1);
    const Icon = cat.icon;

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: withSpring(isSelected ? 1.05 : 1) }],
            backgroundColor: isSelected ? catColor + '25' : colors.card,
            borderColor: isSelected ? catColor : catColor + '40',
            borderWidth: isSelected ? 1.5 : 1,
        };
    });

    const iconStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: withSpring(isSelected ? 1.2 : 1) }, { rotate: withSpring(isSelected ? '10deg' : '0deg') }],
            color: isSelected ? catColor : catColor + '90',
        };
    });

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPressIn={() => (scale.value = 0.95)}
            onPressOut={() => (scale.value = 1)}
            onPress={onPress}
        >
            <Animated.View style={[styles.categoryButton, animatedStyle]}>
                <Animated.View style={iconStyle}>
                    <Icon size={16} color={isSelected ? catColor : catColor + '90'} />
                </Animated.View>
                <Text style={[
                    styles.categoryText,
                    isSelected ? { color: catColor } : { color: colors.textSecondary }
                ]}>
                    {cat.label}
                </Text>
            </Animated.View>
        </TouchableOpacity>
    );
};

const AnimatedHeaderButton = ({ icon: Icon, badgeCount, onPress, colors }: any) => {
    const scale = useSharedValue(1);
    const badgeScale = useSharedValue(1);

    useEffect(() => {
        if (badgeCount > 0) {
            badgeScale.value = withSpring(1.2, { damping: 2 }, () => {
                badgeScale.value = withSpring(1);
            });
        }
    }, [badgeCount]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: withSpring(scale.value) }],
    }));

    const badgeStyle = useAnimatedStyle(() => ({
        transform: [{ scale: withSpring(badgeScale.value) }],
    }));

    return (
        <TouchableOpacity
            onPress={onPress}
            onPressIn={() => (scale.value = 0.9)}
            onPressOut={() => (scale.value = 1)}
            style={styles.iconButton}
        >
            <Animated.View style={animatedStyle}>
                <Icon size={24} color={colors.text} />
                {badgeCount > 0 && (
                    <Animated.View style={[styles.badge, badgeStyle]}>
                        <Text style={styles.badgeText}>
                            {badgeCount > 99 ? '99+' : badgeCount}
                        </Text>
                    </Animated.View>
                )}
            </Animated.View>
        </TouchableOpacity>
    );
};

const AnimatedFilterChip = ({ icon: Icon, label, isActive, onPress, colors, loading, hasX }: any) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: withSpring(scale.value) }],
        borderColor: isActive ? colors.primary : colors.border,
        backgroundColor: isActive ? colors.primary + '20' : colors.card,
    }));

    return (
        <TouchableOpacity
            onPress={onPress}
            onPressIn={() => (scale.value = 0.95)}
            onPressOut={() => (scale.value = 1)}
            disabled={loading}
        >
            <Animated.View style={[styles.filterChip, animatedStyle]}>
                {loading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                    <Icon size={14} color={isActive ? colors.primary : colors.textSecondary} />
                )}
                <Text style={[
                    styles.filterText,
                    isActive ? { color: colors.primary } : { color: colors.textSecondary }
                ]}>
                    {label}
                </Text>
                {hasX && <X size={12} color={colors.primary} style={{ marginLeft: 4 }} />}
            </Animated.View>
        </TouchableOpacity>
    );
};

const FeedScreen = ({ navigation }: any) => {
    const { colors } = useTheme();
    const { socket } = useSocket() as any; // Type assertion if needed
    const { success } = useToast();
    const { unreadCount } = useNotifications();
    const [posts, setPosts] = useState<any[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Chat Badge Logic
    const [unreadMsgCount, setUnreadMsgCount] = useState(0);
    const [mapLoading, setMapLoading] = useState(false);

    const fetchUnreadMsgCount = async () => {
        try {
            const res = await api.get('/chat/unread/count');
            setUnreadMsgCount(res.data.count);
        } catch (err) {
            console.error('Failed to fetch unread messages count', err);
        }
    };

    useEffect(() => {
        fetchUnreadMsgCount();
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = () => {
            fetchUnreadMsgCount();
            // Sound logic could be optional here if we don't want double sounds (if main tabs also has it running)
            // But since we are removing it from main tabs, it should be here.
            const ding = new Sound('notification.mp3', Sound.MAIN_BUNDLE, (error) => {
                if (error) {
                    return;
                }
                ding.play();
            });
        };

        const handleMessagesRead = () => {
            fetchUnreadMsgCount();
        };

        socket.on('receive_message', handleNewMessage);
        socket.on('messages_read', handleMessagesRead);
        socket.on('unread_count_update', handleMessagesRead);

        return () => {
            socket.off('receive_message', handleNewMessage);
            socket.off('messages_read', handleMessagesRead);
            socket.off('unread_count_update', handleMessagesRead);
        };
    }, [socket]);

    // Filters
    const [sortOrder, setSortOrder] = useState<'latest' | 'oldest' | 'urgent' | 'nearest'>('latest');
    const [locationFilter, setLocationFilter] = useState('All');
    const [availableLocations, setAvailableLocations] = useState<string[]>(['All']);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [isNearby, setIsNearby] = useState(false);
    const [nearbyLoading, setNearbyLoading] = useState(false);

    // Distance filter (radius in km)
    const [distanceRadius, setDistanceRadius] = useState<number>(50); // Default 50km (All)
    const distanceOptions = [
        { label: 'All', value: 50 },
        { label: '1 km', value: 1 },
        { label: '5 km', value: 5 },
        { label: '10 km', value: 10 },
        { label: '25 km', value: 25 },
    ];

    // For date, simple string match or picker? User said "select date". 
    // Implementing a simple text match for now or a list of available dates would be better but let's stick to simple "Date" sort/filter.
    // Actually, "Select Date" implies filtering by specific date.
    const [selectedDate, setSelectedDate] = useState<string | null>(null); // YYYY-MM-DD
    const [showDatePicker, setShowDatePicker] = useState(false); // Just a simulation of picker or simple list

    const getCatColor = (catId: string) => {
        switch (catId) {
            case 'job': return '#3b82f6'; // Blue
            case 'service': return '#06b6d4'; // Cyan
            case 'sell': return '#f59e0b'; // Amber
            case 'rent': return '#8b5cf6'; // Violet
            case 'barter': return '#ec4899'; // Pink
            case 'all': return colors.primary;
            default: return colors.primary;
        }
    };

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
    }, [posts, searchQuery, selectedCategory, sortOrder, locationFilter, selectedDate, isNearby]);

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

    const fetchPosts = async (locationParams?: { latitude: number, longitude: number }) => {
        try {
            setLoading(true);
            let url = '/posts';
            if (locationParams) {
                url += `?latitude=${locationParams.latitude}&longitude=${locationParams.longitude}&radius=50`;
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
        }
    };

    const handleNearbyToggle = async () => {
        if (!isNearby) {
            setNearbyLoading(true);
            const loc = await getCurrentLocation() as any;
            if (loc) {
                setIsNearby(true);
                setLocationFilter('All'); // Reset other location filters
                fetchPosts({ latitude: loc.latitude, longitude: loc.longitude });
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

    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [selectedPost, setSelectedPost] = useState<any | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    // Filter posts that have location coordinates for the map
    const mapPosts = React.useMemo(() => {
        return filteredPosts.filter(p => p.locationCoords && p.locationCoords.coordinates);
    }, [filteredPosts]);

    // Pre-fuzz coordinates to ensure stability (only re-fuzz if posts change)
    const fuzzedPosts = React.useMemo(() => {
        return mapPosts.map(p => {
            // Check if we already have cached fuzz for this ID (in a real app), here we just deterministic-ish fuzz based on ID chars or random if fresh
            // Simple random fuzzing: +/- 0.0025 degrees (~250m)
            // To keep it stable per post, we could use a hash of the ID, but for now standard random is okay as long as useMemo holds
            const latOffset = (Math.random() - 0.5) * 0.005;
            const lngOffset = (Math.random() - 0.5) * 0.005;
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
                // Fetch user location when switching to map
                const loc = await getCurrentLocation();
                if (loc) {
                    setUserLocation({ lat: loc.latitude, lng: loc.longitude });
                }
            } catch (err) {
                console.error('Error fetching location:', err);
            } finally {
                // Add a slight delay to ensure smooth transition
                setTimeout(() => {
                    setViewMode('map');
                    setMapLoading(false);
                }, 500);
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
                </style>
            </head>
            <body>
                <div id="map"></div>
                <script>
                    var userLoc = ${userLocation ? JSON.stringify(userLocation) : 'null'};
                    var defaultCenter = [28.6139, 77.2090];
                    var center = userLoc ? [userLoc.lat, userLoc.lng] : defaultCenter;

                    var map = L.map('map', {zoomControl: false }).setView(center, userLoc ? 13 : 10);

                    var isDark = ${colors.background === '#000000'};
                    var mapStyle = isDark 
                        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

                    L.tileLayer(mapStyle, {
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                        subdomains: 'abcd',
                        maxZoom: 20
                    }).addTo(map);

                    // Add user location marker with animation
                    if (userLoc) {
                        var userIcon = L.divIcon({
                            className: 'user-loc-container',
                            html: '<div class="user-loc-pulse"></div><div class="user-loc-dot"></div>',
                            iconSize: [30, 30],
                            iconAnchor: [15, 15]
                        });
                        L.marker([userLoc.lat, userLoc.lng], { icon: userIcon }).addTo(map);

                        L.circle([userLoc.lat, userLoc.lng], {
                            radius: 120,
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
                            var marker = L.circleMarker([p.lat, p.lng], {
                                radius: 8,
                                fillColor: p.color,
                                color: isDark ? "#000" : "#fff",
                                weight: 2,
                                opacity: 1,
                                fillOpacity: 0.9,
                                className: 'post-marker-anim'
                            }).addTo(map);

                            marker.on('click', function() {
                                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerClick', postId: p.id }));
                            });

                            bounds.push([p.lat, p.lng]);
                        }, index * 100); // Staggered entrance
                    });

                    if (userLoc) {
                        map.setView([userLoc.lat, userLoc.lng], 14);
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
                        <AnimatedHeaderButton
                            icon={Bell}
                            badgeCount={unreadCount}
                            onPress={() => navigation.navigate('Notifications')}
                            colors={colors}
                        />
                        <AnimatedHeaderButton
                            icon={MessageCircle}
                            badgeCount={unreadMsgCount}
                            onPress={() => navigation.navigate('ChatList')}
                            colors={colors}
                        />
                    </View>
                </View>

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
                    {CATEGORIES.map((cat) => (
                        <CategoryButton
                            key={cat.id}
                            cat={cat}
                            isSelected={selectedCategory === cat.id}
                            onPress={() => setSelectedCategory(cat.id)}
                            catColor={getCatColor(cat.id)}
                            colors={colors}
                        />
                    ))}
                </ScrollView>

                {/* Filters Row */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filtersScroll}
                    contentContainerStyle={styles.categoriesContent}
                >
                    <AnimatedFilterChip
                        icon={MapPin}
                        label={viewMode === 'map' ? 'Map' : 'List'}
                        isActive={viewMode === 'map'}
                        onPress={toggleViewMode}
                        colors={colors}
                    />

                    <AnimatedFilterChip
                        icon={ArrowUpDown}
                        label={sortOrder === 'latest' ? 'Latest' : sortOrder === 'oldest' ? 'Oldest' : sortOrder === 'urgent' ? '🔥 Urgent' : '📍 Nearest'}
                        isActive={sortOrder !== 'latest'}
                        onPress={() => {
                            const sortOptions: Array<'latest' | 'oldest' | 'urgent' | 'nearest'> = ['latest', 'oldest', 'urgent', 'nearest'];
                            const currentIdx = sortOptions.indexOf(sortOrder);
                            setSortOrder(sortOptions[(currentIdx + 1) % sortOptions.length]);
                        }}
                        colors={colors}
                    />

                    <AnimatedFilterChip
                        icon={MapPin}
                        label={distanceRadius === 50 ? 'Distance' : `${distanceRadius}km`}
                        isActive={distanceRadius !== 50}
                        onPress={() => {
                            const distances = [50, 1, 5, 10, 25];
                            const currentIdx = distances.indexOf(distanceRadius);
                            setDistanceRadius(distances[(currentIdx + 1) % distances.length]);
                        }}
                        colors={colors}
                    />

                    <AnimatedFilterChip
                        icon={MapPin}
                        label={locationFilter === 'All' ? 'Location' : locationFilter}
                        isActive={locationFilter !== 'All'}
                        onPress={() => setShowLocationModal(true)}
                        colors={colors}
                    />

                    <AnimatedFilterChip
                        icon={MapPin}
                        label="Nearby"
                        isActive={isNearby}
                        onPress={handleNearbyToggle}
                        colors={colors}
                        loading={nearbyLoading}
                    />

                    <AnimatedFilterChip
                        icon={Calendar}
                        label={selectedDate ? 'Today' : 'Date'}
                        isActive={!!selectedDate}
                        onPress={() => setSelectedDate(selectedDate ? null : new Date().toISOString().split('T')[0])}
                        colors={colors}
                        hasX={!!selectedDate}
                    />
                </ScrollView>
            </View>

            {viewMode === 'list' ? (
                loading ? (
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
                                    backgroundColor: getCatColor(selectedPost.type)
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
});

export default FeedScreen;
