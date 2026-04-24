import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useToast } from '../components/ui/Toast';
import PostCard from '../components/ui/PostCard';
import PostSkeleton from '../components/ui/PostSkeleton';
import Button from '../components/ui/Button';
import {
    Search, Map as MapIcon, List as ListIcon, MapPin, Package,
    Briefcase, Wrench, Tag, Key, Sparkles, Plus, X,
    Filter, Navigation, ZoomIn, ZoomOut, Layers, Crosshair, ChevronRight,
    Bell, User, Loader2, RefreshCw, SlidersHorizontal, Clock,
    CheckCircle2, AlertCircle, ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../utils/cn';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CATEGORIES = [
    { id: 'all', label: 'All', icon: Package, color: '#6366f1' },
    { id: 'job', label: 'Jobs', icon: Briefcase, color: '#22c55e', emoji: '💼' },
    { id: 'sell', label: 'For Sale', icon: Tag, color: '#f97316', emoji: '🛒' },
    { id: 'rent', label: 'For Rent', icon: Key, color: '#a855f7', emoji: '🏠' },
    { id: 'request', label: 'Requests', icon: Wrench, color: '#3b82f6', emoji: '🙋' }
];

const RADIUS_OPTIONS = [
    { id: 1, label: '1 km' },
    { id: 5, label: '5 km' },
    { id: 10, label: '10 km' },
    { id: 25, label: '25 km' },
    { id: 50, label: '50 km' }
];

const TIME_FILTERS = [
    { id: 'latest', label: 'Latest' },
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' }
];

const toValidCoords = (lat, lng) => {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) return null;
    if (parsedLat < -90 || parsedLat > 90) return null;
    if (parsedLng < -180 || parsedLng > 180) return null;
    return { lat: parsedLat, lng: parsedLng };
};

const MapUpdater = ({ center, zoom }) => {
    const map = useMap();
    const lastTargetRef = useRef('');

    useEffect(() => {
        const parsedCenter = Array.isArray(center) && center.length === 2
            ? toValidCoords(center[0], center[1])
            : null;
        const parsedZoom = Number(zoom);
        const normalizedZoom = Number.isFinite(parsedZoom) ? Math.max(1, Math.min(parsedZoom, 18)) : null;
        if (!parsedCenter || normalizedZoom === null) return;

        const mapSize = map.getSize?.();
        if (!mapSize || !Number.isFinite(mapSize.x) || !Number.isFinite(mapSize.y) || mapSize.x <= 0 || mapSize.y <= 0) {
            return;
        }

        const targetKey = `${parsedCenter.lat.toFixed(6)}:${parsedCenter.lng.toFixed(6)}:${normalizedZoom}`;
        if (lastTargetRef.current === targetKey) return;

        lastTargetRef.current = targetKey;
        map.setView([parsedCenter.lat, parsedCenter.lng], normalizedZoom, { animate: false });
    }, [center, zoom, map]);
    return null;
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
};

const Explore = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDark } = useTheme();
    const { success, error: showError } = useToast();
    const { socket } = useSocket();
    const searchTimeoutRef = useRef(null);
    const mapRef = useRef(null);

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('latest');
    const [viewMode, setViewMode] = useState('split');
    const [userLocation, setUserLocation] = useState(null);
    const [locationStatus, setLocationStatus] = useState('idle'); // idle, loading, denied, success
    const [mapZoom, setMapZoom] = useState(13);
    const [selectedMarkerId, setSelectedMarkerId] = useState(null);
    const [radius, setRadius] = useState(10);
    const [timeFilter, setTimeFilter] = useState('latest');
    const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
    const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
    const [quickViewPost, setQuickViewPost] = useState(null);

    const fallbackUserLocation = useMemo(
        () => toValidCoords(user?.latitude, user?.longitude),
        [user?.latitude, user?.longitude]
    );

    const safeUserLocation = useMemo(
        () => (userLocation ? toValidCoords(userLocation.lat, userLocation.lng) : null),
        [userLocation]
    );

    const mapCenter = useMemo(() => {
        if (safeUserLocation) return [safeUserLocation.lat, safeUserLocation.lng];
        if (fallbackUserLocation) return [fallbackUserLocation.lat, fallbackUserLocation.lng];
        const defaultCenter = toValidCoords(20.5937, 78.9629);
        return defaultCenter ? [defaultCenter.lat, defaultCenter.lng] : [20, 78];
    }, [safeUserLocation, fallbackUserLocation]);

    const serverCategory = filter === 'all' ? undefined : filter;

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                limit: 100,
                type: serverCategory,
                q: searchTerm.trim() || undefined,
                sort: sortOrder,
                distance: radius,
                ...(userLocation && { lat: userLocation.lat, lng: userLocation.lng }),
                time: timeFilter !== 'latest' ? timeFilter : undefined,
            };
            const res = await api.get('/posts', { params });
            setPosts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [serverCategory, searchTerm, sortOrder, radius, timeFilter, userLocation]);

    // Detect user location
    useEffect(() => {
        if (!userLocation && locationStatus === 'idle') {
            setLocationStatus('loading');
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const coords = toValidCoords(pos.coords.latitude, pos.coords.longitude);
                    if (coords) {
                        setUserLocation(coords);
                        setMapZoom(13);
                        setLocationStatus('success');
                        return;
                    }
                    setLocationStatus('denied');
                },
                () => {
                    if (fallbackUserLocation) {
                        setUserLocation(fallbackUserLocation);
                        setLocationStatus('success');
                    } else {
                        setLocationStatus('denied');
                    }
                }
            );
        }
    }, [userLocation, locationStatus, fallbackUserLocation]);

    // Debounced search
    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => fetchPosts(), 300);
        return () => clearTimeout(searchTimeoutRef.current);
    }, [searchTerm, radius, timeFilter, sortOrder]);

    // Socket real-time updates
    useEffect(() => {
        if (!socket) return;
        const handleNewPost = (newPost) => {
            setPosts(prev => [newPost, ...prev]);
            success('New post nearby!');
        };
        socket.on('new_post', handleNewPost);
        return () => socket.off('new_post', handleNewPost);
    }, [socket, success]);

    useEffect(() => { fetchPosts(); }, []);

    const mapPosts = useMemo(() => 
        posts
            .filter((p) => p.locationCoords?.coordinates)
            .map((p) => {
                const coords = toValidCoords(p.locationCoords.coordinates[1], p.locationCoords.coordinates[0]);
                if (!coords) return null;
                return {
                    ...p,
                    displayLat: coords.lat,
                    displayLng: coords.lng,
                    distance: safeUserLocation ? calculateDistance(
                        safeUserLocation.lat,
                        safeUserLocation.lng,
                        coords.lat,
                        coords.lng
                    ) : null
                };
            })
            .filter(Boolean),
    [posts, safeUserLocation]);

    const handlePostClick = (postId) => navigate(`/post/${postId}`);
    const handleMarkerClick = (postId) => setSelectedMarkerId(postId);

    // Filter posts by radius
    const filteredMapPosts = useMemo(() => 
        mapPosts.filter(p => !p.distance || p.distance <= radius),
    [mapPosts, radius]);

    return (
        <div className="min-h-screen bg-background">
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-card-border">
                <div className="container mx-auto px-3 py-3">
                    <div className="flex flex-col gap-3">
                        
                        {/* Search and Location Row */}
                        <div className="flex gap-2 items-center">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                                <input
                                    type="text"
                                    placeholder="Search posts..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-card border border-card-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-card-hover rounded-full">
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                            
                            {/* Location Status */}
                            {locationStatus === 'success' ? (
                                <div className="flex items-center gap-1.5 px-3 py-2.5 bg-green-500/10 text-green-500 rounded-xl text-xs font-medium">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <MapPin className="w-3 h-3" />
                                </div>
                            ) : locationStatus === 'loading' ? (
                                <div className="flex items-center gap-1.5 px-3 py-2.5 bg-card border border-card-border rounded-xl text-xs font-medium">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                </div>
                            ) : (
                                <button onClick={() => {
                                    setLocationStatus('loading');
                                    navigator.geolocation.getCurrentPosition(
                                        (pos) => {
                                            const coords = toValidCoords(pos.coords.latitude, pos.coords.longitude);
                                            if (!coords) {
                                                setLocationStatus('denied');
                                                return;
                                            }
                                            setUserLocation(coords);
                                            setMapZoom(13);
                                            setLocationStatus('success');
                                        },
                                        () => setLocationStatus('denied')
                                    );
                                }} className="flex items-center gap-1.5 px-3 py-2.5 bg-red-500/10 text-red-500 rounded-xl text-xs font-medium">
                                    <AlertCircle className="w-3 h-3" />
                                </button>
                            )}
                        </div>

                        
                        {/* Category Pills and Radius Slider */}
                        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1 items-center">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setFilter(cat.id)}
                                    className={cn(
                                        'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all duration-200',
                                        filter === cat.id
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'bg-card border border-card-border hover:border-primary/50'
                                    )}
                                >
                                    <cat.icon className="w-3.5 h-3.5" />
                                    {cat.label}
                                </button>
                            ))}
                            
                            <div className="flex items-center gap-2 ml-auto pl-2 border-l border-card-border">
                                <Navigation className="w-3.5 h-3.5 text-foreground-muted" />
                                <input
                                    type="range"
                                    min="1"
                                    max="50"
                                    value={radius}
                                    onChange={(e) => setRadius(Number(e.target.value))}
                                    className="w-20 h-1.5 bg-card-border rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
                                />
                                <span className="text-xs font-semibold text-primary min-w-[35px]">{radius}km</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* View Toggle */}
            <div className="flex bg-card-border/50 border-b border-card-border">
                <button onClick={() => setViewMode('split')} className={cn('flex-1 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5', viewMode === 'split' ? 'bg-background border-b-2 border-primary text-primary' : '')}>
                    <Layers className="w-4 h-4" /> Split
                </button>
                <button onClick={() => setViewMode('list')} className={cn('flex-1 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5', viewMode === 'list' ? 'bg-background border-b-2 border-primary text-primary' : '')}>
                    <ListIcon className="w-4 h-4" /> List
                </button>
                <button onClick={() => setViewMode('map')} className={cn('flex-1 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5', viewMode === 'map' ? 'bg-background border-b-2 border-primary text-primary' : '')}>
                    <MapIcon className="w-4 h-4" /> Map
                </button>
            </div>

            {/* Main Content */}
            <div className="container mx-auto">
                <div className={cn('flex', viewMode === 'split' ? 'flex-col lg:flex-row' : 'flex-col')}>
                    
                    {/* Post Feed */}
                    <div className={cn('p-3', viewMode === 'split' ? 'lg:w-1/2 lg:border-r' : 'w-full', viewMode === 'map' ? 'hidden' : '')}>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-foreground-muted">
                                {loading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</span> : `${filteredMapPosts.length} results`}
                            </p>
                            {userLocation && (
                                <span className="text-xs text-foreground-muted flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> Within {radius}km
                                </span>
                            )}
                        </div>

                        {loading ? (
                            <div className={cn('grid gap-3', viewMode === 'list' ? 'grid-cols-3' : 'grid-cols-2')}>
                                {[1,2,3,4,5,6].map(i => <PostSkeleton key={i} />)}
                            </div>
                        ) : filteredMapPosts.length === 0 ? (
                            <EmptyState onClear={() => { setSearchTerm(''); setFilter('all'); setRadius(10); fetchPosts(); }} />
                        ) : (
                            <div className={cn('grid gap-3', viewMode === 'list' ? 'grid-cols-3' : 'grid-cols-2')}>
                                {filteredMapPosts.map((post) => (
                                    <motion.div
                                        key={post._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="group"
                                    >
                                        <PostCard 
                                            post={post} 
                                            currentUserId={user?._id} 
                                            onClick={() => handlePostClick(post._id)}
                                            onMarkerClick={() => {
                                                setSelectedMarkerId(post._id);
                                                setViewMode('map');
                                            }}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Map */}
                    <div className={cn('w-full', viewMode === 'map' ? 'h-[calc(100vh-280px)]' : 'hidden lg:block lg:min-h-[50vh]', viewMode === 'split' ? 'lg:h-[calc(100vh-120px)] lg:sticky lg:top-[120px]' : '')}>
                        <div className={cn('h-full', viewMode === 'map' ? 'sticky top-[120px]' : '')}>
                            <MapContainer
                                ref={mapRef}
                                center={mapCenter}
                                zoom={mapZoom}
                                scrollWheelZoom={true}
                                className="w-full h-full"
                                zoomControl={false}
                            >
                                <MapUpdater center={safeUserLocation ? [safeUserLocation.lat, safeUserLocation.lng] : null} zoom={mapZoom} />
                                <TileLayer
                                    attribution='&copy; OpenStreetMap'
                                    url={isDark ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'}
                                />
                                
                                {/* User Location with Pulse */}
                                {safeUserLocation && (
                                    <>
                                        <Circle
                                            center={[safeUserLocation.lat, safeUserLocation.lng]}
                                            radius={radius * 1000}
                                            path={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.1, weight: 1, dashArray: '5, 10' }}
                                        />
                                        <Marker position={[safeUserLocation.lat, safeUserLocation.lng]} icon={L.divIcon({
                                            className: 'user-marker',
                                            html: `
                                                <div class="relative">
                                                    <div class="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg"></div>
                                                    <div class="absolute -inset-2 bg-blue-500/30 rounded-full animate-ping"></div>
                                                </div>
                                            `,
                                            iconSize: [16, 16], iconAnchor: [8, 8]
                                        })} />
                                    </>
                                )}

                                {/* Post Markers */}
                                {filteredMapPosts.map(post => {
                                    const cat = CATEGORIES.find(c => c.id === post.type);
                                    const isSelected = selectedMarkerId === post._id;
                                    const markerColor = post.type === 'job' ? '#22c55e' : post.type === 'sell' ? '#f97316' : post.type === 'rent' ? '#a855f7' : '#3b82f6';
                                    return (
                                        <Marker 
                                            key={post._id}
                                            position={[post.displayLat, post.displayLng]}
                                            eventHandlers={{ click: () => setSelectedMarkerId(post._id) }}
                                            icon={L.divIcon({
                                                className: 'post-marker',
                                                html: `
                                                    <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-lg cursor-pointer transform transition-all ${isSelected ? 'scale-125 ring-4 ring-white ring-offset-2 z-50' : 'hover:scale-110'}" style="background: ${markerColor};">
                                                        <span>${cat?.emoji || '📍'}</span>
                                                    </div>
                                                `,
                                                iconSize: [40, 40], iconAnchor: [20, 20]
                                            })}
                                        >
                                            <Popup>
                                                <div className="w-56 p-0! rounded-xl overflow-hidden shadow-lg">
                                                    ${post.images?.[0] ? `<img src="${post.images[0]}" alt="${post.title}" class="w-full h-24 object-cover" />` : `
                                                    <div class="w-full h-24 flex items-center justify-center text-4xl" style="background: linear-gradient(135deg, ${markerColor}20, ${markerColor}40);">
                                                        ${cat?.emoji || '📍'}
                                                    </div>
                                                    `}
                                                    <div className="p-3">
                                                        <span className="text-[10px] font-bold px-2 py-1 rounded-full" style="background: ${markerColor}20; color: ${markerColor};">
                                                            ${cat?.label}
                                                        </span>
                                                        <h3 className="font-bold text-sm mt-2 leading-tight line-clamp-2">${post.title}</h3>
                                                        ${post.price > 0 ? `<p class="text-lg font-bold text-primary mt-1">₹${post.price.toLocaleString()}</p>` : ''}
                                                        <div className="flex items-center justify-between mt-2 text-[10px] text-foreground-muted">
                                                            ${post.distance ? `<span>📍 ${post.distance.toFixed(1)}km</span>` : ''}
                                                            <span>${timeAgo(post.createdAt)}</span>
                                                        </div>
                                                        <button onclick="window.dispatchEvent(new CustomEvent('openQuickView', { detail: '${post._id}' }))" className="w-full mt-2 py-2 bg-primary text-primary-foreground text-xs rounded-xl font-semibold flex items-center justify-center gap-1">
                                                            View Details <ChevronRight className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    );
                                })}
                            </MapContainer>

                            {/* Map Controls */}
                            <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5">
                                <button onClick={() => setMapZoom(z => Math.min(z + 1, 18))} className="p-2 bg-card border border-card-border rounded-lg shadow-sm hover:bg-card-hover">
                                    <ZoomIn className="w-4 h-4" />
                                </button>
                                <button onClick={() => setMapZoom(z => Math.max(z - 1, 5))} className="p-2 bg-card border border-card-border rounded-lg shadow-sm hover:bg-card-hover">
                                    <ZoomOut className="w-4 h-4" />
                                </button>
                                <button onClick={() => navigator.geolocation.getCurrentPosition((p) => {
                                    const coords = toValidCoords(p.coords.latitude, p.coords.longitude);
                                    if (!coords) {
                                        showError('Invalid location coordinates');
                                        return;
                                    }
                                    setUserLocation(coords);
                                    setMapZoom(14);
                                }, () => showError('Location denied'))} className="p-2 bg-card border border-card-border rounded-lg shadow-sm hover:bg-card-hover">
                                    <Crosshair className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Floating Chip - Selected Marker */}
                            <AnimatePresence>
                                {selectedMarkerId && (() => {
                                    const selected = filteredMapPosts.find(p => p._id === selectedMarkerId);
                                    if (!selected) return null;
                                    return (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 20, scale: 0.9 }}
                                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                                            className="absolute bottom-4 left-4 right-4 z-[1000] max-w-md mx-auto"
                                        >
                                            <div 
                                                onClick={() => setQuickViewPost(selected)}
                                                className="flex items-center gap-3 px-4 py-3 bg-card rounded-2xl shadow-lg cursor-pointer transition-all border border-card-border hover:border-card-border-hover"
                                            >
                                                {selected.images?.[0] ? (
                                                    <img src={selected.images[0]} alt={selected.title} className="w-14 h-14 rounded-xl object-cover" />
                                                ) : (
                                                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br from-primary/20 to-accent/20">
                                                        {selected.type === 'job' ? '💼' : selected.type === 'sell' ? '🛒' : selected.type === 'rent' ? '🏠' : '🙋'}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: CATEGORIES.find(c => c.id === selected.type)?.color + '20', color: CATEGORIES.find(c => c.id === selected.type)?.color }}>
                                                            {CATEGORIES.find(c => c.id === selected.type)?.label}
                                                        </span>
                                                    </div>
                                                    <p className="font-bold text-sm truncate mt-0.5">{selected.title}</p>
                                                    {selected.price > 0 && <p className="text-sm font-bold text-primary">₹{selected.price.toLocaleString()}</p>}
                                                    <p className="text-xs text-foreground-muted flex items-center gap-1">
                                                        {selected.distance && <>📍 {selected.distance.toFixed(1)}km</>}
                                                        <span>•</span>
                                                        {timeAgo(selected.createdAt)}
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setSelectedMarkerId(null); }}
                                                    className="p-2 rounded-full bg-card-hover hover:bg-background-tertiary transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })()}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick View Modal */}
            <AnimatePresence>
                {quickViewPost && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
                        onClick={() => setQuickViewPost(null)}
                    >
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full sm:max-w-lg bg-background rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
                        >
                            {/* Header with Image */}
                            <div className="relative h-40 sm:h-48">
                                {quickViewPost.images?.[0] ? (
                                    <img src={quickViewPost.images[0]} alt={quickViewPost.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
                                        {quickViewPost.type === 'job' ? '💼' : quickViewPost.type === 'sell' ? '🛒' : quickViewPost.type === 'rent' ? '🏠' : '🙋'}
                                    </div>
                                )}
                                <button 
                                    onClick={() => setQuickViewPost(null)}
                                    className="absolute top-3 right-3 p-2 bg-black/40 backdrop-blur rounded-full hover:bg-black/60 transition-colors"
                                >
                                    <X className="w-5 h-5 text-primary-foreground" />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
                            </div>
                            
                            {/* Content */}
                            <div className="p-4 sm:p-5 -mt-8 relative">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: CATEGORIES.find(c => c.id === quickViewPost.type)?.color + '20', color: CATEGORIES.find(c => c.id === quickViewPost.type)?.color }}>
                                        {CATEGORIES.find(c => c.id === quickViewPost.type)?.label}
                                    </span>
                                    {quickViewPost.isVerified && (
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Verified
                                        </span>
                                    )}
                                </div>
                                
                                <h2 className="text-xl font-bold">{quickViewPost.title}</h2>
                                {quickViewPost.price > 0 && (
                                    <p className="text-2xl font-bold text-primary mt-1">₹{quickViewPost.price.toLocaleString()}</p>
                                )}
                                
                                <div className="flex items-center gap-3 mt-3 text-sm text-foreground-muted">
                                    {quickViewPost.distance && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" /> {quickViewPost.distance.toFixed(1)} km away
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" /> {timeAgo(quickViewPost.createdAt)}
                                    </span>
                                </div>
                                
                                {quickViewPost.description && (
                                    <p className="mt-3 text-sm text-foreground-muted line-clamp-3">{quickViewPost.description}</p>
                                )}
                                
                                {/* Quick Info Grid */}
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    <div className="p-3 bg-card rounded-xl border border-card-border">
                                        <p className="text-xs text-foreground-muted">Posted by</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                                                {quickViewPost.author?.displayName?.[0] || '?'}
                                            </div>
                                            <p className="text-sm font-medium truncate">{quickViewPost.author?.displayName || 'Anonymous'}</p>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-card rounded-xl border border-card-border">
                                        <p className="text-xs text-foreground-muted">Location</p>
                                        <p className="text-sm font-medium mt-1 truncate">{quickViewPost.locationName || 'Unknown'}</p>
                                    </div>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex gap-3 mt-5">
                                    <Button 
                                        variant="outline" 
                                        className="flex-1"
                                        onClick={() => setQuickViewPost(null)}
                                    >
                                        Close
                                    </Button>
                                    <Button 
                                        className="flex-1 gap-2"
                                        onClick={() => { setQuickViewPost(null); navigate(`/post/${quickViewPost._id}`); }}
                                    >
                                        View Full Post
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/create-post')}
                className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-full shadow-md font-semibold text-sm hover:bg-primary-hover transition-colors"
            >
                <Plus className="w-4 h-4" />
                <span>Create</span>
            </motion.button>
        </div>
    );
};

const EmptyState = ({ onClear }) => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <MapIcon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-base font-bold mb-1">No results found</h3>
            <p className="text-sm text-foreground-muted mb-4">Try increasing the search radius or changing filters</p>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onClear}>Clear Filters</Button>
                <Button size="sm" onClick={() => navigate('/create-post')}>Create Post</Button>
            </div>
        </div>
    );
};

export default Explore;
