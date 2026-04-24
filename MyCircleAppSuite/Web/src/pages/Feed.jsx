import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useToast } from '../components/ui/Toast';
import PostCard from '../components/ui/PostCard';
import ServiceCard from '../components/ui/ServiceCard';
import PostSkeleton from '../components/ui/PostSkeleton';
import Button from '../components/ui/Button';
import {
    Filter, Search, Map as MapIcon,
    List as ListIcon, MapPin, Package,
    Briefcase, Wrench, Tag, Key,
    ChevronDown, Sparkles, Plus, X, SlidersHorizontal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../utils/cn';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const categories = [
    { id: 'all', label: 'All', icon: Package },
    { id: 'job', label: 'Jobs', icon: Briefcase },
    { id: 'sell', label: 'For Sale', icon: Tag },
    { id: 'rent', label: 'For Rent', icon: Key },
    { id: 'request', label: 'Requests', icon: Wrench }
];

const MapUpdater = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, zoom);
        }
    }, [center, zoom, map]);
    return null;
};

const Feed = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDark } = useTheme();
    const { success, error: showError } = useToast();
    const [posts, setPosts] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('latest');
    const [locationFilter, setLocationFilter] = useState('all');
    const [viewMode, setViewMode] = useState('list');
    const [userLocation, setUserLocation] = useState(null);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);

    const { socket } = useSocket();

    const serverCategory = filter === 'service' ? 'all' : filter;
    const serverSort = sortOrder === 'latest' || sortOrder === 'oldest' ? sortOrder : 'latest';

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                limit: 50,
                type: serverCategory !== 'all' ? serverCategory : undefined,
                q: searchTerm.trim() || undefined,
                location: locationFilter !== 'all' ? locationFilter : undefined,
                sort: serverSort,
            };
            const res = await api.get('/posts', { params });
            setPosts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [serverCategory, searchTerm, locationFilter, serverSort]);

    const fetchServices = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('skill', searchTerm);
            params.append('sort', sortOrder === 'latest' ? 'rating' : 'endorsements');
            const res = await api.get(`/user/services?${params.toString()}`);
            setServices(res.data);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, sortOrder]);

    useEffect(() => {
        if (!socket) return;
        const handleNewPost = (newPost) => {
            setPosts(prev => [newPost, ...prev]);
            success('New post added!');
        };
        socket.on('new_post', handleNewPost);
        return () => socket.off('new_post', handleNewPost);
    }, [socket, success]);

    useEffect(() => {
        // Debounce search/filter changes to avoid API spam
        const delayBounceFn = setTimeout(() => {
            if (filter === 'service') {
                void fetchServices();
            } else {
                void fetchPosts();
            }
        }, 400);

        return () => clearTimeout(delayBounceFn);
    }, [filter, fetchPosts, fetchServices]);

    const availableLocations = React.useMemo(() => {
        const locations = Array.from(new Set(posts.map(p => p.location).filter(Boolean)));
        return locations.sort();
    }, [posts]);

    const filteredPosts = React.useMemo(() => {
        if (filter === 'service') return services;
        return posts;
    }, [posts, services, filter]);

    const mapPosts = React.useMemo(() => {
        if (filter === 'service') return [];
        return filteredPosts
            .filter(p => p.locationCoords?.coordinates)
            .map(p => ({
                ...p,
                displayLat: p.locationCoords.coordinates[1] + (Math.random() - 0.5) * 0.005,
                displayLng: p.locationCoords.coordinates[0] + (Math.random() - 0.5) * 0.005
            }));
    }, [filteredPosts, filter]);

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

    const handlePostClick = (postId) => {
        navigate(`/post/${postId}`);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setLocationFilter('all');
        setSortOrder('latest');
    };

    return (
        <div className="min-h-screen pb-20">
            {/* Hero Header */}
            <div className="relative py-12 md:py-16 overflow-hidden">
                {/* Background Glow */}
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
                </div>

                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-4">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold"
                            >
                                <Sparkles className="w-4 h-4" />
                                <span>Discover Local</span>
                            </motion.div>
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
                            >
                                Your <span className="gradient-text">Feed</span>
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-lg text-foreground-muted max-w-xl"
                            >
                                Explore trusted services, unique items, and connect with your local community.
                            </motion.p>
                        </div>

                        {/* View Toggle */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center gap-2 p-1 bg-card rounded-xl border border-card-border"
                        >
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                                    viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-foreground-muted hover:text-foreground'
                                )}
                            >
                                <ListIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={toggleViewMode}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                                    viewMode === 'map' ? 'bg-primary text-primary-foreground' : 'text-foreground-muted hover:text-foreground'
                                )}
                            >
                                <MapIcon className="w-4 h-4" />
                            </button>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="sticky top-16 md:top-20 z-40 bg-background/80 backdrop-blur-xl border-b border-card-border py-4">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                            <input
                                type="text"
                                placeholder={filter === 'service' ? "Search skills..." : "What are you looking for?"}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-card-border bg-card text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-card-hover"
                                >
                                    <X className="w-4 h-4 text-foreground-muted" />
                                </button>
                            )}
                        </div>

                        {/* Filter Toggle */}
                        <button
                            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                            className={cn(
                                'flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all border',
                                isFilterExpanded ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-card-border text-foreground hover:border-primary'
                            )}
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            <span>Filters</span>
                            {(locationFilter !== 'all' || sortOrder !== 'latest') && (
                                <span className="w-5 h-5 rounded-full bg-primary-foreground/20 text-xs flex items-center justify-center">2</span>
                            )}
                        </button>

                        {/* Create Post Button */}
                        <Button onClick={() => navigate('/create-post')} className="gap-2">
                            <Plus className="w-4 h-4" />
                            Create Post
                        </Button>
                    </div>

                    {/* Expanded Filters */}
                    <AnimatePresence>
                        {isFilterExpanded && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Sort By</label>
                                        <select
                                            value={sortOrder}
                                            onChange={(e) => setSortOrder(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-card-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        >
                                            <option value="latest">Latest First</option>
                                            <option value="oldest">Oldest First</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Location</label>
                                        <select
                                            value={locationFilter}
                                            onChange={(e) => setLocationFilter(e.target.value)}
                                            disabled={filter === 'service'}
                                            className="w-full px-4 py-3 rounded-xl border border-card-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                                        >
                                            <option value="all">All Locations</option>
                                            {availableLocations.map(loc => (
                                                <option key={loc} value={loc}>{loc}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex items-end">
                                        <button
                                            onClick={clearFilters}
                                            className="w-full px-4 py-3 rounded-xl border border-error/20 text-error font-medium hover:bg-error/10 transition-all"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Category Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 mt-4 -mx-4 px-4 scrollbar-hide">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setFilter(cat.id)}
                                    className={cn(
                                        'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                                        filter === cat.id
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'bg-card border border-card-border text-foreground-muted hover:border-primary hover:text-foreground'
                                    )}
                                >
                                <cat.icon className="w-4 h-4" />
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((idx) => (
                            <PostSkeleton key={idx} />
                        ))}
                    </div>
                ) : viewMode === 'map' && filter !== 'service' ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="relative z-10 rounded-2xl overflow-hidden border border-card-border shadow-xl h-[600px]"
                    >
                        <MapContainer
                            center={userLocation ? [userLocation.lat, userLocation.lng] : [20.5937, 78.9629]}
                            zoom={userLocation ? 13 : 5}
                            scrollWheelZoom={true}
                            className="w-full h-full"
                        >
                            <MapUpdater center={userLocation ? [userLocation.lat, userLocation.lng] : null} zoom={userLocation ? 13 : 5} />
                            <TileLayer
                                attribution='&copy; OpenStreetMap'
                                url={isDark
                                    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                                    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'}
                            />
                            {userLocation && (
                                <Marker position={[userLocation.lat, userLocation.lng]}>
                                    <Popup>You are here</Popup>
                                </Marker>
                            )}
                            {mapPosts.map(post => (
                                <Marker 
                                    key={post._id} 
                                    position={[post.displayLat, post.displayLng]}
                                    icon={L.divIcon({
                                        className: 'custom-map-marker',
                                        html: `
                                            <div style="
                                                background: rgba(255, 255, 255, 0.1);
                                                backdrop-filter: blur(8px);
                                                border: 1px solid rgba(255,255,255,0.2);
                                                border-bottom: 2px solid ${post.type === 'job' ? '#3b82f6' : post.type === 'service' ? '#06b6d4' : post.type === 'rent' ? '#8b5cf6' : '#ec4899'};
                                                padding: 4px 10px;
                                                border-radius: 12px;
                                                color: white;
                                                font-weight: bold;
                                                font-size: 12px;
                                                white-space: nowrap;
                                                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                                                transform: translate(-50%, -100%);
                                            ">
                                                <span style="text-shadow: 0 1px 2px rgba(0,0,0,0.5);">₹${post.price || 0}</span>
                                                <div style="
                                                    position: absolute;
                                                    bottom: -6px;
                                                    left: 50%;
                                                    transform: translateX(-50%);
                                                    border-left: 6px solid transparent;
                                                    border-right: 6px solid transparent;
                                                    border-top: 6px solid ${post.type === 'job' ? '#3b82f6' : post.type === 'service' ? '#06b6d4' : post.type === 'rent' ? '#8b5cf6' : '#ec4899'};
                                                "></div>
                                            </div>
                                        `,
                                        iconSize: [0, 0],
                                        iconAnchor: [0, 0]
                                    })}
                                >
                                    <Popup>
                                        <div className="min-w-[240px] p-2">
                                            {post.images?.[0] && (
                                                <img src={post.images[0]} alt={post.title} className="w-full h-32 object-cover rounded-lg mb-3" />
                                            )}
                                            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                                                {post.type}
                                            </span>
                                            <h3 className="font-bold mt-2 text-foreground">{post.title}</h3>
                                            <p className="text-sm text-foreground-muted line-clamp-2 mt-1">{post.description}</p>
                                            <button
                                                onClick={() => handlePostClick(post._id)}
                                                className="w-full mt-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors"
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                        {loadingLocation && (
                            <div className="absolute inset-0 z-[1000] bg-background/80 backdrop-blur-sm flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                    <p className="font-medium">Locating you...</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
                        }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {filter === 'service' ? (
                            filteredPosts.length > 0 ? (
                                filteredPosts.map((service) => (
                                    <motion.div key={service._id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                                        <ServiceCard user={service} searchedSkill={searchTerm} />
                                    </motion.div>
                                ))
                            ) : (
                                <EmptyState message="No professionals found" submessage="Try a different skill or keyword" />
                            )
                        ) : filteredPosts.length > 0 ? (
                            filteredPosts.map((post, index) => (
                                <motion.div
                                    key={post._id}
                                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                                    onClick={() => handlePostClick(post._id)}
                                    className="cursor-pointer"
                                >
                                    <PostCard
                                        post={post}
                                        currentUserId={user?._id}
                                        onRequestContact={() => handlePostClick(post._id)}
                                        index={index}
                                    />
                                </motion.div>
                            ))
                        ) : (
                            <EmptyState
                                message="No posts found"
                                submessage="Be the first to create a post in this category"
                                showCreate
                            />
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
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">{message}</h3>
            <p className="text-foreground-muted mb-6 max-w-sm">{submessage}</p>
            {showCreate && (
                <Button onClick={() => navigate('/create-post')} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Post
                </Button>
            )}
        </div>
    );
};

export default Feed;
