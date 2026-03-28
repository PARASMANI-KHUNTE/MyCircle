import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useToast } from '../components/ui/Toast';
import PostCard from '../components/ui/PostCard';
import ServiceCard from '../components/ui/ServiceCard';
import PostSkeleton from '../components/ui/PostSkeleton';
import Button from '../components/ui/Button';
import { getAvatarUrl } from '../utils/avatar';
import {
    Filter, Search, Map as MapIcon,
    List as ListIcon, MapPin, Package,
    Briefcase, Wrench, Tag, Key,
    Sparkles, Plus, X, SlidersHorizontal,
    Clock, Heart, Star, Zap, Shield, Trophy,
    Navigation, Crosshair, Eye, MessageCircle,
    ChevronLeft, ZoomIn, ZoomOut, Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../utils/cn';
import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const categories = [
    { id: 'all', label: 'All', icon: Package, color: '#8b5cf6' },
    { id: 'job', label: 'Jobs', icon: Briefcase, color: '#22c55e' },
    { id: 'service', label: 'Services', icon: Wrench, color: '#3b82f6' },
    { id: 'sell', label: 'For Sale', icon: Tag, color: '#f97316' },
    { id: 'rent', label: 'For Rent', icon: Key, color: '#a855f7' }
];

const typeEmojis = {
    job: '💼',
    service: '⚔️',
    sell: '💰',
    rent: '🏠',
    barter: '🔄'
};

const typeLabels = {
    job: 'Quest',
    service: 'Adventure',
    sell: 'Treasure',
    rent: 'Sanctuary',
    barter: 'Exchange'
};

const getRarity = (post) => {
    if (post.isUrgent) return { tier: 'legendary', color: '#f59e0b', label: 'Legendary', icon: '🔥' };
    if (post.likes?.length > 10) return { tier: 'epic', color: '#a855f7', label: 'Epic', icon: '⭐' };
    if (post.likes?.length > 5) return { tier: 'rare', color: '#3b82f6', label: 'Rare', icon: '✨' };
    return { tier: 'common', color: '#6b7280', label: 'Common', icon: '📍' };
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
};

const createQuestIcon = (type, rarity, isSelected) => {
    const emoji = typeEmojis[type] || '📍';
    const color = rarity.color;
    const size = isSelected ? 56 : 44;
    const innerSize = size - 8;
    
    return L.divIcon({
        html: `
            <div style="
                width: ${size}px;
                height: ${size}px;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                ${isSelected ? `<div style="
                    position: absolute;
                    width: ${size + 16}px;
                    height: ${size + 16}px;
                    border: 3px solid ${color};
                    border-radius: 50%;
                    animation: pulse-ring 1.5s ease-out infinite;
                "></div>` : ''}
                <div style="
                    width: ${innerSize}px;
                    height: ${innerSize}px;
                    background: linear-gradient(145deg, ${color}, ${color}aa);
                    border-radius: 50%;
                    border: 3px solid white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: ${innerSize * 0.45}px;
                    box-shadow: 0 4px 16px ${color}66;
                    animation: ${isSelected ? 'bounce-selected 1s infinite' : 'bounce 2s infinite'};
                    position: relative;
                    z-index: 1;
                ">
                    ${emoji}
                </div>
                ${rarity.tier !== 'common' ? `<div style="
                    position: absolute;
                    top: -2px;
                    right: -2px;
                    font-size: 14px;
                    z-index: 2;
                    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
                ">${rarity.icon}</div>` : ''}
            </div>
        `,
        className: 'quest-icon',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
    });
};

const userIcon = L.divIcon({
    html: `
        <div style="
            width: 36px;
            height: 36px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <div style="
                position: absolute;
                width: 52px;
                height: 52px;
                border: 2px solid rgba(236, 72, 153, 0.3);
                border-radius: 50%;
                animation: radar-pulse 2s ease-out infinite;
            "></div>
            <div style="
                width: 36px;
                height: 36px;
                background: linear-gradient(135deg, #ec4899, #f472b6);
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 4px 16px rgba(236, 72, 153, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                z-index: 1;
            ">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(-45deg);">
                    <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                </svg>
            </div>
        </div>
    `,
    className: 'user-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
});

function MapController({ center, zoom, posts }) {
    const map = useMap();
    
    useEffect(() => {
        if (center) {
            map.setView(center, zoom, { animate: true });
        }
    }, [center, zoom, map]);
    
    useEffect(() => {
        if (posts && posts.length > 0) {
            const coords = posts.map(p => [p.displayLat, p.displayLng]).filter(c => c[0] && c[1]);
            if (coords.length > 0) {
                const bounds = L.latLngBounds(coords);
                if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
                }
            }
        }
    }, [posts, map]);
    
    useEffect(() => {
        const handleZoomIn = () => map.zoomIn();
        const handleZoomOut = () => map.zoomOut();
        
        window.mapZoomIn = handleZoomIn;
        window.mapZoomOut = handleZoomOut;
        
        return () => {
            delete window.mapZoomIn;
            delete window.mapZoomOut;
        };
    }, [map]);
    
    return null;
}

const Explore = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDark } = useTheme();
    const { success, error: showError } = useToast();
    const mapInstanceRef = useRef(null);
    
    const [posts, setPosts] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder] = useState('distance');
    const [locationFilter] = useState('all');
    const [viewMode, setViewMode] = useState('map');
    const [userLocation, setUserLocation] = useState(null);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [selectedQuest, setSelectedQuest] = useState(null);
    const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]);
    const [mapZoom, setMapZoom] = useState(4);

    const { socket } = useSocket();

    const serverCategory = filter === 'service' ? 'all' : filter;

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                limit: 100,
                type: serverCategory !== 'all' ? serverCategory : undefined,
                q: searchTerm.trim() || undefined,
                location: locationFilter !== 'all' ? locationFilter : undefined,
                sort: sortOrder === 'distance' ? 'latest' : sortOrder,
            };
            const res = await api.get('/posts', { params });
            const activePosts = res.data.filter(p => p.isActive !== false);
            setPosts(activePosts);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [locationFilter, searchTerm, serverCategory, sortOrder]);

    const fetchServices = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('skill', searchTerm);
            params.append('sort', 'rating');
            const res = await api.get(`/user/services?${params.toString()}`);
            setServices(res.data);
        } catch {
            showError('Search failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [searchTerm, showError]);

    useEffect(() => {
        if (!socket) return;
        const handleNewPost = (newPost) => {
            if (newPost.isActive !== false) {
                setPosts(prev => {
                    if (prev.find(p => p._id === newPost._id)) return prev;
                    return [newPost, ...prev];
                });
                success('New quest appeared!');
            }
        };
        socket.on('new_post', handleNewPost);
        return () => socket.off('new_post', handleNewPost);
    }, [socket, success]);

    useEffect(() => {
        if (filter === 'service') {
            void fetchServices();
        } else {
            void fetchPosts();
        }
    }, [fetchPosts, fetchServices, filter]);

    useEffect(() => {
        if (filter === 'service') {
            void fetchServices();
        }
    }, [fetchServices, filter, searchTerm, sortOrder]);

    useEffect(() => {
        if (navigator.geolocation) {
            setLoadingLocation(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setUserLocation(loc);
                    setMapCenter([loc.lat, loc.lng]);
                    setMapZoom(12);
                    setLoadingLocation(false);
                },
                () => {
                    setLoadingLocation(false);
                }
            );
        }
    }, []);

    const filteredPosts = useMemo(() => {
        if (filter === 'service') return services;
        let result = posts;
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(p => 
                p.title?.toLowerCase().includes(term) || 
                p.description?.toLowerCase().includes(term)
            );
        }
        
        if (locationFilter !== 'all') {
            result = result.filter(p => p.location === locationFilter);
        }
        
        if (sortOrder === 'distance' && userLocation) {
            result = result
                .map(p => ({
                    ...p,
                    _distance: calculateDistance(
                        userLocation.lat, userLocation.lng,
                        p.locationCoords?.coordinates?.[1],
                        p.locationCoords?.coordinates?.[0]
                    )
                }))
                .filter(p => p._distance !== null)
                .sort((a, b) => parseFloat(a._distance) - parseFloat(b._distance));
        }
        
        return result;
    }, [posts, services, filter, searchTerm, locationFilter, sortOrder, userLocation]);

    const mapPosts = useMemo(() => {
        if (filter === 'service') return [];
        
        const postsWithCoords = filteredPosts.filter(p => p.locationCoords?.coordinates?.length === 2);
        const postsWithoutCoords = filteredPosts.filter(p => !p.locationCoords?.coordinates?.length === 2);
        
        const jitter = 0.02;
        
        return [
            ...postsWithCoords.map(p => {
                const coords = p.locationCoords.coordinates;
                return {
                    ...p,
                    displayLat: coords[1] + (Math.random() - 0.5) * jitter,
                    displayLng: coords[0] + (Math.random() - 0.5) * jitter,
                    hasCoords: true,
                    rarity: getRarity(p),
                    distance: userLocation ? calculateDistance(
                        userLocation.lat, userLocation.lng,
                        coords[1], coords[0]
                    ) : null
                };
            }),
            ...postsWithoutCoords.map((p) => {
                const baseLat = 20.5937 + (Math.random() - 0.5) * 30;
                const baseLng = 78.9629 + (Math.random() - 0.5) * 60;
                return {
                    ...p,
                    displayLat: baseLat,
                    displayLng: baseLng,
                    hasCoords: false,
                    rarity: getRarity(p),
                    distance: null
                };
            })
        ];
    }, [filteredPosts, filter, userLocation]);

    const stats = useMemo(() => ({
        total: mapPosts.length,
        jobs: mapPosts.filter(p => p.type === 'job').length,
        forSale: mapPosts.filter(p => p.type === 'sell').length,
        nearby: userLocation ? mapPosts.filter(p => p.distance && parseFloat(p.distance) < 10).length : 0
    }), [mapPosts, userLocation]);

    const toggleViewMode = () => {
        if (filter === 'service') {
            showError('Map view not available for Services.');
            return;
        }
        if (viewMode === 'list' && !userLocation) {
            setLoadingLocation(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setLoadingLocation(false);
                },
                () => {
                    setLoadingLocation(false);
                    showError('Could not access your location.');
                }
            );
        }
        setViewMode(viewMode === 'list' ? 'map' : 'list');
    };

    const handleLocateMe = () => {
        setLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLocation(loc);
                setMapCenter([loc.lat, loc.lng]);
                setMapZoom(13);
                setLoadingLocation(false);
            },
            () => {
                setLoadingLocation(false);
                showError('Could not access your location.');
            }
        );
    };

    const handlePostClick = (postId) => {
        navigate(`/post/${postId}`);
    };

    const handleQuestClick = (quest) => {
        setSelectedQuest(quest);
        setMapCenter([quest.displayLat, quest.displayLng]);
        setMapZoom(15);
    };

    const handleZoomIn = () => window.mapZoomIn?.();
    const handleZoomOut = () => window.mapZoomOut?.();

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="relative py-6 md:py-8 overflow-hidden bg-gradient-to-b from-primary/5 to-transparent">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                                <Crosshair className="w-4 h-4" />
                                <span>Quest Map</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                                Explore <span className="gradient-text">Adventures</span>
                            </h1>
                            <p className="text-foreground-muted">
                                Discover quests and treasures near you
                            </p>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex items-center gap-3">
                            {[
                                { label: 'Total', value: stats.total, color: 'text-primary' },
                                { label: 'Nearby', value: stats.nearby, color: 'text-accent' },
                            ].map(stat => (
                                <div key={stat.label} className="px-4 py-2 rounded-xl bg-card border border-card-border">
                                    <div className={`text-xs font-medium ${stat.color}`}>{stat.label}</div>
                                    <div className="text-xl font-bold">{stat.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Controls Bar */}
            <div className="sticky top-16 md:top-20 z-30 bg-background/95 backdrop-blur-md border-b border-card-border py-3">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                            <input
                                type="text"
                                placeholder="Search quests..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-card-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        {/* Category Pills */}
                        <div className="hidden md:flex items-center gap-1">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setFilter(cat.id)}
                                    className={cn(
                                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                                        filter === cat.id
                                            ? 'text-white'
                                            : 'bg-card border border-card-border text-foreground-muted hover:border-primary'
                                    )}
                                    style={filter === cat.id ? { backgroundColor: cat.color } : {}}
                                >
                                    <cat.icon className="w-3.5 h-3.5" />
                                    <span>{cat.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* View Toggle */}
                        <div className="flex items-center gap-1 p-1 bg-card rounded-lg border border-card-border">
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    'p-2 rounded-md transition-all',
                                    viewMode === 'list' ? 'bg-primary text-white' : 'text-foreground-muted hover:bg-card-hover'
                                )}
                            >
                                <ListIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={toggleViewMode}
                                className={cn(
                                    'p-2 rounded-md transition-all',
                                    viewMode === 'map' ? 'bg-primary text-white' : 'text-foreground-muted hover:bg-card-hover'
                                )}
                            >
                                <MapIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Mobile Categories */}
                    <div className="flex md:hidden gap-2 mt-3 overflow-x-auto pb-1 -mx-4 px-4">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setFilter(cat.id)}
                                className={cn(
                                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0',
                                    filter === cat.id
                                        ? 'text-white'
                                        : 'bg-card border border-card-border text-foreground-muted'
                                )}
                                style={filter === cat.id ? { backgroundColor: cat.color } : {}}
                            >
                                <cat.icon className="w-3.5 h-3.5" />
                                <span>{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((idx) => <PostSkeleton key={idx} />)}
                    </div>
                ) : viewMode === 'map' && filter !== 'service' ? (
                    <div className="relative">
                        {/* Map Container */}
                        <div className="relative rounded-2xl overflow-hidden border border-card-border shadow-xl" style={{ height: 'calc(100vh - 280px)', minHeight: '450px' }}>
                            <MapContainer
                                center={mapCenter}
                                zoom={mapZoom}
                                scrollWheelZoom={true}
                                className="w-full h-full"
                                zoomControl={false}
                                whenReady={(map) => {
                                    mapInstanceRef.current = map;
                                }}
                            >
                                <TileLayer
                                    url={isDark
                                        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                                        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'}
                                />
                                
                                {userLocation && (
                                    <>
                                        <Circle
                                            center={[userLocation.lat, userLocation.lng]}
                                            radius={10000}
                                            pathOptions={{
                                                color: '#ec4899',
                                                fillColor: '#ec4899',
                                                fillOpacity: 0.08,
                                                weight: 2
                                            }}
                                        />
                                        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} />
                                    </>
                                )}
                                
                                {mapPosts.map(post => (
                                    <Marker 
                                        key={post._id}
                                        position={[post.displayLat, post.displayLng]}
                                        icon={createQuestIcon(post.type, post.rarity, selectedQuest?._id === post._id)}
                                        eventHandlers={{ click: () => handleQuestClick(post) }}
                                    />
                                ))}
                                
                                <MapController center={mapCenter} zoom={mapZoom} posts={mapPosts} />
                            </MapContainer>

                            {/* Map Controls - Top Right */}
                            <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2">
                                <button
                                    onClick={handleLocateMe}
                                    className="w-10 h-10 rounded-xl bg-card border border-card-border shadow-lg flex items-center justify-center hover:bg-card-hover transition-colors"
                                    title="Find my location"
                                >
                                    <Crosshair className="w-5 h-5 text-primary" />
                                </button>
                                <button
                                    onClick={handleZoomIn}
                                    className="w-10 h-10 rounded-xl bg-card border border-card-border shadow-lg flex items-center justify-center hover:bg-card-hover transition-colors"
                                >
                                    <ZoomIn className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleZoomOut}
                                    className="w-10 h-10 rounded-xl bg-card border border-card-border shadow-lg flex items-center justify-center hover:bg-card-hover transition-colors"
                                >
                                    <ZoomOut className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Quest Counter - Top Left */}
                            <div className="absolute top-3 left-3 z-[400]">
                                <div className="px-3 py-2 rounded-xl bg-card/95 backdrop-blur-sm border border-card-border shadow-lg">
                                    <div className="flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-primary" />
                                        <span className="text-sm font-semibold">{mapPosts.length} quests nearby</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quest Details Panel - Left Side */}
                            <AnimatePresence>
                                {selectedQuest && (
                                    <motion.div
                                        initial={{ x: -320, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: -320, opacity: 0 }}
                                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                        className="absolute top-3 left-3 bottom-3 w-72 z-[500] flex flex-col bg-card rounded-2xl border border-card-border shadow-2xl overflow-hidden"
                                    >
                                        {/* Header */}
                                        <div 
                                            className="p-4 text-white shrink-0"
                                            style={{ background: `linear-gradient(135deg, ${selectedQuest.rarity.color}ee 0%, ${selectedQuest.rarity.color}99 100%)` }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">{typeEmojis[selectedQuest.type]}</span>
                                                    <div>
                                                        <div className="text-xs opacity-80">{typeLabels[selectedQuest.type]}</div>
                                                        <div className="font-bold">{selectedQuest.rarity.label}</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedQuest(null)}
                                                    className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Scrollable Content */}
                                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                            <div>
                                                <h3 className="text-lg font-bold">{selectedQuest.title}</h3>
                                                
                                                {selectedQuest.images?.[0] && (
                                                    <img 
                                                        src={selectedQuest.images[0]} 
                                                        alt={selectedQuest.title}
                                                        className="w-full h-32 object-cover rounded-xl mt-2"
                                                    />
                                                )}
                                            </div>

                                            {/* Mini Stats */}
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="bg-card-hover rounded-xl p-2 text-center">
                                                    <Heart className="w-4 h-4 mx-auto text-red-400" />
                                                    <div className="text-sm font-bold">{selectedQuest.likes?.length || 0}</div>
                                                </div>
                                                <div className="bg-card-hover rounded-xl p-2 text-center">
                                                    <Eye className="w-4 h-4 mx-auto text-blue-400" />
                                                    <div className="text-sm font-bold">{selectedQuest.views || 0}</div>
                                                </div>
                                                <div className="bg-card-hover rounded-xl p-2 text-center">
                                                    <Clock className="w-4 h-4 mx-auto text-green-400" />
                                                    <div className="text-sm font-bold">{selectedQuest.shares || 0}</div>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <p className="text-sm text-foreground-muted line-clamp-3">
                                                {selectedQuest.description}
                                            </p>

                                            {/* Poster */}
                                            {selectedQuest.user && (
                                                <div className="flex items-center gap-3 p-3 bg-card-hover rounded-xl">
                                                    <img
                                                        src={getAvatarUrl(selectedQuest.user)}
                                                        alt={selectedQuest.user.displayName}
                                                        className="w-10 h-10 rounded-full border-2 border-primary"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-sm truncate">{selectedQuest.user.displayName}</div>
                                                        {selectedQuest.user.rating > 0 && (
                                                            <div className="flex items-center gap-1 text-xs">
                                                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                                                <span>{selectedQuest.user.rating.toFixed(1)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Location */}
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <MapPin className="w-4 h-4 text-primary" />
                                                    <span>{selectedQuest.location}</span>
                                                </div>
                                                {selectedQuest.distance && (
                                                    <div className="flex items-center gap-2 text-sm text-accent font-semibold">
                                                        <Navigation className="w-4 h-4" />
                                                        <span>{selectedQuest.distance} km away</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Price */}
                                            {selectedQuest.price && (
                                                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl">
                                                    <span className="text-sm text-foreground-muted">Reward</span>
                                                    <span className="text-xl font-bold gradient-text">${selectedQuest.price.toLocaleString()}</span>
                                                </div>
                                            )}

                                            {/* Urgent */}
                                            {selectedQuest.isUrgent && (
                                                <div className="flex items-center gap-2 p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                                                    <Zap className="w-5 h-5 text-orange-500" />
                                                    <span className="font-bold text-orange-500 text-sm">URGENT</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action */}
                                        <div className="p-4 border-t border-card-border shrink-0">
                                            <button
                                                onClick={() => handlePostClick(selectedQuest._id)}
                                                className="w-full py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                                            >
                                                <Shield className="w-5 h-5" />
                                                Accept Quest
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Quest Chips - Bottom */}
                            {mapPosts.length > 0 && (
                                <div className="absolute bottom-3 left-3 right-3 z-[400]">
                                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                        {mapPosts.slice(0, 8).map(post => (
                                            <button
                                                key={post._id}
                                                onClick={() => handleQuestClick(post)}
                                                className={cn(
                                                    'shrink-0 px-3 py-2 rounded-xl border transition-all flex items-center gap-2 backdrop-blur-sm',
                                                    selectedQuest?._id === post._id
                                                        ? 'bg-primary text-white border-primary'
                                                        : 'bg-card/95 border-card-border hover:border-primary'
                                                )}
                                            >
                                                <span>{typeEmojis[post.type]}</span>
                                                <span className="text-xs font-medium whitespace-nowrap max-w-[100px] truncate">
                                                    {post.title}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Loading */}
                            {loadingLocation && (
                                <div className="absolute inset-0 z-[600] bg-background/80 backdrop-blur-sm flex items-center justify-center">
                                    <div className="bg-card rounded-2xl p-6 shadow-2xl text-center">
                                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                        <p className="font-semibold">Finding your location...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        {filter === 'service' ? (
                            filteredPosts.length > 0 ? (
                                filteredPosts.map((service) => (
                                    <motion.div key={service._id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                                        <ServiceCard user={service} searchedSkill={searchTerm} />
                                    </motion.div>
                                ))
                            ) : (
                                <EmptyState message="No adventurers found" submessage="Try a different skill" />
                            )
                        ) : filteredPosts.length > 0 ? (
                            filteredPosts.map((post, index) => (
                                <motion.div
                                    key={post._id}
                                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                                    onClick={() => handlePostClick(post._id)}
                                    className="cursor-pointer"
                                >
                                    <PostCard post={post} currentUserId={user?._id} index={index} />
                                </motion.div>
                            ))
                        ) : (
                            <EmptyState message="No quests found" submessage="Be the first to post!" showCreate />
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

const EmptyState = ({ message, submessage, showCreate }) => {
    const navigate = useNavigate();
    return (
        <div className="col-span-full py-20 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-1">{message}</h3>
            <p className="text-foreground-muted mb-4">{submessage}</p>
            {showCreate && (
                <Button onClick={() => navigate('/create-post')} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Quest
                </Button>
            )}
        </div>
    );
};

export default Explore;
