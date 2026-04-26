import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import api from '../utils/api';
import { useToast } from '../components/ui/Toast';
import PostCard from '../components/ui/PostCard';
import PostSkeleton from '../components/ui/PostSkeleton';
import Button from '../components/ui/Button';
import {
    Search, Map as MapIcon, MapPin, Package,
    Briefcase, Wrench, Tag, Key, Sparkles, Plus, X,
    Filter, Navigation, ZoomIn, ZoomOut, Crosshair, ChevronRight,
    Bell, User, Loader2, RefreshCw, SlidersHorizontal, Clock, List as ListIcon,
    CheckCircle2, AlertCircle, ChevronLeft, Maximize2, Minimize2, Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { useCurrencySymbol } from '../context/CurrencySymbolContext';
import './Explore.css';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, CircleMarker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MAP_STYLES = `
  .custom-marker {
    background: transparent !important;
    border: none !important;
  }
  .marker-pin-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .marker-pin-wrapper:hover {
    transform: scale(1.15) translateY(-5px);
    z-index: 1000 !important;
  }
  .marker-pin {
    width: 40px;
    height: 40px;
    border-radius: 50% 50% 50% 0;
    background: var(--marker-color);
    transform: rotate(-45deg);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    border: 2px solid white;
  }
  .marker-pin span {
    transform: rotate(45deg);
    font-size: 20px;
  }
  .marker-price {
    position: absolute;
    top: -15px;
    background: white;
    color: var(--marker-color);
    padding: 2px 6px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 800;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    border: 1px solid var(--marker-color);
    white-space: nowrap;
    z-index: 10;
  }
  .leaflet-popup-content-wrapper {
    padding: 0 !important;
    overflow: hidden;
    border-radius: 16px !important;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
  }
  .leaflet-popup-content {
    margin: 0 !important;
    width: 220px !important;
  }
  .leaflet-popup-tip {
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
  }
  .user-location-marker {
    animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
  }
  @keyframes pulse-ring {
    0% { transform: scale(0.33); opacity: 1; }
    80%, 100% { opacity: 0; }
  }
`;

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
        map.setView([parsedCenter.lat, parsedCenter.lng], normalizedZoom, { 
            animate: true,
            duration: 1
        });
    }, [center, zoom, map]);
    return null;
};

const EnhancedMapControls = ({ map }) => {
    const [zoom, setZoom] = useState(map.getZoom());
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleZoom = () => setZoom(map.getZoom());
        map.on('zoom', handleZoom);
        return () => map.off('zoom', handleZoom);
    }, [map]);

    useEffect(() => {
        const handleFullscreen = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullscreen);
        return () => document.removeEventListener('fullscreenchange', handleFullscreen);
    }, []);

    const zoomIn = () => map.zoomIn();
    const zoomOut = () => map.zoomOut();
    const locateUser = () => {
        const el = document.querySelector('.leaflet-marker-pane circle[r="8"]');
        if (el) {
            const bounds = map.getBounds();
            const userMarker = el.closest('circle');
            if (userMarker) {
                const lat = Number(userMarker.getAttribute('cy'));
                const lng = Number(userMarker.getAttribute('cx'));
                if (Number.isFinite(lat) && Number.isFinite(lng)) {
                    map.setView([20.5937, 78.9629], 13, { animate: true });
                }
            }
        }
    };

    const fitBounds = () => {
        let allMarkers = [];
        document.querySelectorAll('.custom-marker-enhanced').forEach(marker => {
            const parent = marker.closest('path, circle');
            if (parent) {
                const c = map.latLngToContainerPoint([20.59, 78.96]);
                if (c) allMarkers.push([20.59, 78.96]);
            }
        });
        if (allMarkers.length > 0) {
            map.fitBounds(allMarkers, { padding: [50, 50] });
        }
    };

    const toggleFullscreen = () => {
        if (!isFullscreen) {
            map.getContainer().requestFullscreen?.().catch(() => {});
        } else {
            document.exitFullscreen?.();
        }
    };

    return (
        <div className="enhanced-map-controls">
            <button onClick={zoomIn} className="map-ctrl-btn" title="Zoom In">
                <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={zoomOut} className="map-ctrl-btn" title="Zoom Out">
                <ZoomOut className="w-4 h-4" />
            </button>
            <div className="ctrl-divider" />
            <button onClick={locateUser} className="map-ctrl-btn" title="Locate Me">
                <Target className="w-4 h-4" />
            </button>
            <button onClick={fitBounds} className="map-ctrl-btn" title="Fit All">
                <Maximize2 className="w-4 h-4" />
            </button>
            {document.fullscreenEnabled && (
                <button onClick={toggleFullscreen} className="map-ctrl-btn" title={isFullscreen ? "Exit FS" : "Fullscreen"}>
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
            )}
            <div className="zoom-display">{zoom}×</div>
        </div>
    );
};

const EnhancedPopupContent = ({ post, cat, currencySymbol }) => {
    const navigate = useNavigate();
    return (
        <div className="enhanced-popup-content">
            {post.images?.[0] ? (
                <img src={post.images[0]} alt={post.title} className="popup-img" />
            ) : (
                <div className="popup-img placeholder" style={{ background: `${cat?.color || '#6366f1'}20` }}>
                    {cat?.emoji || '📍'}
                </div>
            )}
            <div className="popup-body">
                <span className="popup-category" style={{ background: `${cat?.color || '#6366f1'}20`, color: cat?.color || '#6366f1' }}>
                    {cat?.label}
                </span>
                <h3 className="popup-title">{post.title}</h3>
                {post.price > 0 && (
                    <p className="popup-price">{currencySymbol}{post.price.toLocaleString()}</p>
                )}
                <p className="popup-desc">{post.description}</p>
                <div className="popup-meta">
                    <span><MapPin size={12} /> {post.location || 'Unknown'}</span>
                    <span className="text-foreground-muted">•</span>
                    <span>{timeAgo(post.createdAt)}</span>
                </div>
                <button 
                    onClick={() => { 
                        navigate(`/post/${post._id}`); 
                        document.querySelectorAll('.enhanced-popup-content').forEach(el => el.click());
                    }} 
                    className="popup-btn"
                >
                    View Details
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
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
    const { success } = useToast();
    const { currencySymbol } = useCurrencySymbol();
    const { socket } = useSocket();

    const [showRadiusCircle, setShowRadiusCircle] = useState(true);

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategories, setSelectedCategories] = useState(['all']);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, _setSortOrder] = useState('latest');
    const [userLocation, setUserLocation] = useState(null);
    const [locationStatus, setLocationStatus] = useState('idle');
    const [mapZoom, setMapZoom] = useState(13);
    const [radius, setRadius] = useState(10);
    const [timeFilter, _setTimeFilter] = useState('latest');
    const [quickViewPost, setQuickViewPost] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const [priceMin, setPriceMin] = useState('');
    const [priceMax, setPriceMax] = useState('');
    const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

    const mapRef = useRef<L.Map>(null);
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



    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const serverCategory = selectedCategories.includes('all') ? undefined : selectedCategories.join(',');
            const params = {
                limit: 100,
                type: serverCategory,
                q: searchTerm.trim() || undefined,
                sort: sortOrder,
                distance: radius,
                ...(userLocation && { lat: userLocation.lat, lng: userLocation.lng }),
                time: timeFilter !== 'latest' ? timeFilter : undefined,
                priceMin: priceMin ? Number(priceMin) : undefined,
                priceMax: priceMax ? Number(priceMax) : undefined,
            };
            const res = await api.get('/posts', { params });
            setPosts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [selectedCategories, searchTerm, sortOrder, radius, timeFilter, userLocation, priceMin, priceMax]);

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

    const handleFilterChange = (newFilter) => {
        setSelectedCategories([newFilter]);
    };

    const toggleCategory = (catId) => {
        if (catId === 'all') {
            setSelectedCategories(['all']);
        } else {
            setSelectedCategories(prev => {
                const filtered = prev.filter(c => c !== 'all');
                if (filtered.includes(catId)) {
                    const newCats = filtered.filter(c => c !== catId);
                    return newCats.length === 0 ? ['all'] : newCats;
                } else {
                    return [...filtered, catId];
                }
            });
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedCategories(['all']);
        setPriceMin('');
        setPriceMax('');
        _setSortOrder('latest');
        _setTimeFilter('latest');
        setRadius(10);
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            void fetchPosts();
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [fetchPosts, selectedCategories, radius, searchTerm, sortOrder, timeFilter, userLocation]);

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
            .filter(Boolean)
            .sort((a, b) => {
                if (a.distance && b.distance) return a.distance - b.distance;
                if (a.distance) return -1;
                if (b.distance) return 1;
                return 0;
            }),
    [posts, safeUserLocation]);

    const handlePostClick = (postId) => navigate(`/post/${postId}`);

    const openMapForPost = useCallback((postId) => {
        const post = mapPosts.find(p => p._id === postId);
        if (post) setQuickViewPost(post);
    }, [mapPosts]);

    // Filter posts by radius
    const filteredMapPosts = useMemo(() => 
        mapPosts.filter(p => !p.distance || p.distance <= radius),
    [mapPosts, radius]);

    return (
        <div className="min-h-screen bg-background">
            <style>{MAP_STYLES}</style>
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
                                    className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-card border border-card-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    {searchTerm && (
                                        <button onClick={() => setSearchTerm('')} className="p-1 hover:bg-card-hover rounded-full">
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                    <select 
                                        value={timeFilter}
                                        onChange={(e) => _setTimeFilter(e.target.value)}
                                        className="text-xs bg-card-hover rounded px-1.5 py-1 border-0 focus:outline-none"
                                    >
                                        {TIME_FILTERS.map(f => (
                                            <option key={f.id} value={f.id}>{f.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Price Filter Toggle */}
                            <button
                                onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                                className={cn(
                                    'flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all',
                                    isFiltersExpanded || priceMin || priceMax
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-card border border-card-border hover:border-primary/50'
                                )}
                            >
                                <span className="text-lg font-bold">{currencySymbol}</span>
                                {(priceMin || priceMax) && (
                                    <span className="w-4 h-4 rounded-full bg-primary-foreground/20 text-[10px] flex items-center justify-center">
                                        {(priceMin ? 1 : 0) + (priceMax ? 1 : 0)}
                                    </span>
                                )}
                            </button>
                            
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
                            {CATEGORIES.map((cat) => {
                                const isSelected = selectedCategories.includes(cat.id);
                                const count = selectedCategories.length;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => toggleCategory(cat.id)}
                                        className={cn(
                                            'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all duration-200',
                                            isSelected
                                                ? 'bg-primary text-primary-foreground shadow-sm'
                                                : 'bg-card border border-card-border hover:border-primary/50'
                                        )}
                                    >
                                        <cat.icon className="w-3.5 h-3.5" />
                                        {cat.label}
                                        {isSelected && count > 1 && count < 5 && (
                                            <span className="w-4 h-4 rounded-full bg-primary-foreground/20 text-[10px] flex items-center justify-center">
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                            
                    <div className="flex items-center gap-2 ml-auto pl-2 border-l border-card-border">
                                <button
                                    onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
                                    className={cn(
                                        'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors',
                                        viewMode === 'map' 
                                            ? 'bg-primary text-primary-foreground' 
                                            : 'bg-card border border-card-border'
                                    )}
                                >
                                    {viewMode === 'list' ? (
                                        <><MapIcon className="w-4 h-4" /> Map</>
                                    ) : (
                                        <><ListIcon className="w-4 h-4" /> List</>
                                    )}
                                </button>
                                <Navigation className="w-3.5 h-3.5 text-foreground-muted" />
                                <button
                                    onClick={() => setShowRadiusCircle(!showRadiusCircle)}
                                    className={cn(
                                        "p-2.5 rounded-xl shadow-xl transition-all active:scale-95",
                                        showRadiusCircle ? "bg-accent text-accent-foreground" : "bg-background/80 backdrop-blur-md border border-card-border"
                                    )}
                                    title="Toggle Radius"
                                >
                                    <Sparkles className="w-4 h-4" />
                                </button>
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

                        {/* Price Range Filter Expanded */}
                        {isFiltersExpanded && (
                            <div className="flex items-center gap-2 pt-2 border-t border-card-border">
                                <div className="flex items-center gap-2 flex-1">
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-foreground-muted">Min</span>
                                        <input
                                            type="number"
                                            placeholder="Min price"
                                            value={priceMin}
                                            onChange={(e) => setPriceMin(e.target.value)}
                                            className="w-full pl-12 pr-3 py-2 rounded-lg bg-card border border-card-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                    <span className="text-foreground-muted">-</span>
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-foreground-muted">Max</span>
                                        <input
                                            type="number"
                                            placeholder="Max price"
                                            value={priceMax}
                                            onChange={(e) => setPriceMax(e.target.value)}
                                            className="w-full pl-12 pr-3 py-2 rounded-lg bg-card border border-card-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={clearFilters}
                                    className="px-3 py-2 text-xs font-medium text-error hover:bg-error/10 rounded-lg transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content - List or Map */}
            {viewMode === 'list' ? (
                <div className="container mx-auto p-3">
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
                        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                            {[1,2,3,4,5,6].map(i => <PostSkeleton key={i} />)}
                        </div>
                    ) : filteredMapPosts.length === 0 ? (
                        <EmptyState onClear={clearFilters} />
                    ) : (
                        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
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
                                        onMarkerClick={() => openMapForPost(post._id)}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* Map View - Full screen */
            <div className="map-container">
                    <MapContainer
                        center={mapCenter}
                        zoom={mapZoom}
                        scrollWheelZoom={true}
                        zoomControl={false}
                        className="w-full h-[calc(100vh-150px)] sm:h-[calc(100vh-180px)] z-0"
                        whenCreated={setMapRef}
                    >
                        <MapUpdater center={safeUserLocation ? [safeUserLocation.lat, safeUserLocation.lng] : null} zoom={mapZoom} />
                        <TileLayer
                            attribution='&copy; <a href=\"https://openstreetmap.org\">OpenStreetMap</a>'
                            url={isDark ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'}
                        />
                        
                         {/* Custom Map Controls */}
                        <div className="enhanced-map-controls">
                            <button onClick={() => setMapZoom(prev => Math.min(prev + 1, 18))} className="map-ctrl-btn" title="Zoom In">
                                <ZoomIn className="w-4 h-4" />
                            </button>
                            <button onClick={() => setMapZoom(prev => Math.max(prev - 1, 1))} className="map-ctrl-btn" title="Zoom Out">
                                <ZoomOut className="w-4 h-4" />
                            </button>
                            <div className="ctrl-divider" />
                            <button onClick={() => safeUserLocation && setMapZoom(15)} className="map-ctrl-btn" title="Locate Me">
                                <Target className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => {
                                    if (filteredMapPosts.length > 0) {
                                        const lats = filteredMapPosts.map(p => p.displayLat);
                                        const lngs = filteredMapPosts.map(p => p.displayLng);
                                        const bounds = lats.map((lat, i) => [lat, lngs[i]]);
                                        mapRef.current?.fitBounds(bounds, { padding: [50, 50] });
                                    }
                                }} 
                                className="map-ctrl-btn" title="Fit All"
                            >
                                <Maximize2 className="w-4 h-4" />
                            </button>
                            {document.fullscreenEnabled && (
                                <button onClick={() => {
                                    if (!document.fullscreenElement) {
                                        document.querySelector('.map-container')?.requestFullscreen?.();
                                    } else {
                                        document.exitFullscreen?.();
                                    }
                                }} className="map-ctrl-btn" title="Toggle Fullscreen">
                                    <Maximize2 className="w-4 h-4" />
                                </button>
                            )}
                            <div className="zoom-display">{mapZoom}×</div>
                        </div>

                        {/* Legend */}
                        <div className="map-legend-overlay">
                            <div className="legend-title">Categories</div>
                            {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                                <div key={cat.id} className="legend-item">
                                    <div className="legend-dot" style={{ background: cat.color }}>{cat.emoji}</div>
                                    <span>{cat.label}</span>
                                    <span className="legend-count">{filteredMapPosts.filter(p => p.type === cat.id).length}</span>
                                </div>
                            ))}
                        </div>

                        {/* User Location */}
                        {safeUserLocation && (
                            <>
                                {showRadiusCircle && (
                                    <Circle
                                        center={[safeUserLocation.lat, safeUserLocation.lng]}
                                        radius={radius * 1000}
                                        pathOptions={{ 
                                            color: '#6366f1', 
                                            fillColor: '#6366f1', 
                                            fillOpacity: 0.08,
                                            weight: 1.5,
                                            dashArray: '10, 5'
                                        }}
                                    />
                                )}
                                <CircleMarker
                                    center={[safeUserLocation.lat, safeUserLocation.lng]}
                                    radius={12}
                                    pathOptions={{ 
                                        color: '#6366f1',
                                        fillColor: '#fff',
                                        fillOpacity: 1,
                                        weight: 3
                                    }}
                                    className="user-location-marker"
                                >
                                    <CircleMarker 
                                        center={[safeUserLocation.lat, safeUserLocation.lng]}
                                        radius={20}
                                        pathOptions={{ 
                                            color: '#6366f1',
                                            fillColor: '#6366f1',
                                            fillOpacity: 0,
                                            weight: 2
                                        }}
                                        className="user-location-ring"
                                    />
                                    <Popup closeButton={false}>
                                        <div className="text-xs font-bold px-2 py-1">📍 You are here</div>
                                    </Popup>
                                </CircleMarker>
                            </>
                        )}

                        {/* Enhanced Markers */}
                        {filteredMapPosts.map((post, idx) => {
                            const cat = CATEGORIES.find(c => c.id === post.type) || CATEGORIES[0];
                            const markerColor = cat?.color || '#6366f1';
                            const formattedPrice = post.price > 999 ? (post.price / 1000).toFixed(1) + 'k' : post.price;
                            const isDimmed = post.distance != null && post.distance > radius;
                            
                            return (
                                <Marker
                                    key={post._id}
                                    position={[post.displayLat, post.displayLng]}
                                    eventHandlers={{
                                        click: () => setQuickViewPost(post),
                                    }}
                                    icon={L.divIcon({
                                        className: isDimmed ? 'dimmed-marker' : 'custom-marker',
                                        html: `
                                            <div class="marker-pin-wrapper" style="--marker-color: ${markerColor}">
                                                <div class="marker-pin">
                                                    <span class="marker-emoji">${cat?.emoji || '📍'}</span>
                                                    ${post.price > 0 ? `<span class="marker-price">${currencySymbol}${formattedPrice}</span>` : ''}
                                                </div>
                                                ${post.isVerified ? '<div class="verified-badge"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></div>' : ''}
                                            </div>
                                        `,
                                        iconSize: [40, 40], 
                                        iconAnchor: [20, 40], 
                                        popupAnchor: [0, -45]
                                    })}
                                >
                                    <Popup closeButton={false} offset={[0, -45]}>
                                        <div className="enhanced-popup-content">
                                            {post.images?.[0] ? (
                                                <img src={post.images[0]} alt={post.title} className="popup-img" />
                                            ) : (
                                                <div className="popup-img placeholder" style={{ background: `${markerColor}33` }}>
                                                    {cat?.emoji || '📍'}
                                                </div>
                                            )}
                                            <div className="popup-body">
                                                <span className="popup-category" style={{ background: `${markerColor}33`, color: markerColor }}>
                                                    {cat?.label}
                                                </span>
                                                <h3 className="popup-title">{post.title}</h3>
                                                {post.price > 0 && (
                                                    <p className="popup-price">{currencySymbol}{post.price.toLocaleString()}</p>
                                                )}
                                                {post.description && (
                                                    <p className="popup-desc">{post.description}</p>
                                                )}
                                                <div className="popup-meta">
                                                    <span><MapPin size={12} /> {post.location || 'Unknown'}</span>
                                                    <span className="text-foreground-muted">•</span>
                                                    <span>{timeAgo(post.createdAt)}</span>
                                                </div>
                                                <button onClick={() => {
                                                    setQuickViewPost(null);
                                                    navigate(`/post/${post._id}`);
                                                }} className="popup-btn">
                                                    View Details
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>

                    {/* Post List Drawer */}
                    {viewMode === 'map' && filteredMapPosts.length > 0 && (
                        <div className="map-posts-drawer">
                            <div className="drawer-header">
                                <span className="text-sm font-medium">Nearby Posts</span>
                                <span className="text-xs text-foreground-muted">{filteredMapPosts.length} total</span>
                            </div>
                            <div className="drawer-content">
                                {filteredMapPosts.slice(0, 5).map(post => {
                                    const cat = CATEGORIES.find(c => c.id === post.type);
                                    return (
                                        <div key={post._id} className="drawer-post-item" onClick={() => setQuickViewPost(post)}>
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0" style={{ background: cat?.color + '33', color: cat?.color }}>
                                                {cat?.emoji}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-medium truncate">{post.title}</p>
                                                <p className="text-[10px] text-foreground-muted">
                                                    {post.distance != null && post.distance > 0
                                                        ? `${post.distance < 1 ? Math.round(post.distance * 1000) + 'm' : post.distance.toFixed(1) + 'km'} away`
                                                        : post.location || 'Unknown'
                                                    }
                                                </p>
                                            </div>
                                            {post.price > 0 && (
                                                <span className="text-xs font-bold text-primary whitespace-nowrap">
                                                    {currencySymbol}{post.price.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                                {filteredMapPosts.length > 5 && (
                                    <button className="drawer-more-btn" onClick={() => setViewMode('list')}>
                                        View all {filteredMapPosts.length} posts
                                    </button>
                                )}
                            </div>
                        </div>
                     )}
                 </div>
            )}

            {/* FAB */}
            <AnimatePresence>
                {quickViewPost && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4"
                        onClick={() => setQuickViewPost(null)}
                    >
                        <div className="absolute inset-0 z-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative z-10 w-full sm:max-w-lg bg-background rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
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
                                    {(cat => {
                                        const color = cat?.color || '#6366f1';
                                        return (
                                            <span 
                                                className="text-xs font-bold px-2.5 py-1 rounded-full" 
                                                style={{ backgroundColor: `${color}33`, color }}
                                            >
                                                {cat?.label}
                                            </span>
                                        );
                                    })(CATEGORIES.find(c => c.id === quickViewPost.type))}
                                    {quickViewPost.isVerified && (
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Verified
                                        </span>
                                    )}
                                </div>
                                
                                <h2 className="text-xl font-bold">{quickViewPost.title}</h2>
                                {quickViewPost.price > 0 && (
                                    <p className="text-2xl font-bold text-primary mt-1">{currencySymbol}{quickViewPost.price.toLocaleString()}</p>
                                )}
                                
                                <div className="flex items-center gap-3 mt-3 text-sm text-foreground-muted">
                                    {quickViewPost.distance != null && quickViewPost.distance > 0 && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" /> {quickViewPost.distance < 1 ? `${Math.round(quickViewPost.distance * 1000)}m` : `${quickViewPost.distance.toFixed(1)}km`}
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
                                                {(quickViewPost.user?.displayName || 'Anonymous')[0]?.toUpperCase() || '?'}
                                            </div>
                                            <p className="text-sm font-medium truncate">{quickViewPost.user?.displayName || 'Anonymous'}</p>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-card rounded-xl border border-card-border">
                                        <p className="text-xs text-foreground-muted">Location</p>
                                        <p className="text-sm font-medium mt-1 truncate">{quickViewPost.location || 'Unknown'}</p>
                                    </div>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex gap-3 mt-5">
                                    {quickViewPost.user?._id !== user?._id && (
                                        <Button 
                                            variant="outline"
                                            className="flex-1 gap-2 text-primary border-primary/20 hover:bg-primary/5"
                                            onClick={() => navigate(`/chat/${quickViewPost._id}`)}
                                        >
                                            Message
                                        </Button>
                                    )}
                                    <Button 
                                        className="flex-1 gap-2"
                                        onClick={() => { setQuickViewPost(null); navigate(`/post/${quickViewPost._id}`); }}
                                    >
                                        View Full
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
