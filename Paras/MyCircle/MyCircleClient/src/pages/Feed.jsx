import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api'; // Use API
import { useToast } from '../components/ui/Toast';
import PostCard from '../components/ui/PostCard';
import PostSkeleton from '../components/ui/PostSkeleton';
import {
    Filter, Search, Map as MapIcon,
    List as ListIcon, MapPin, Package,
    Briefcase, Wrench, Tag, Key,
    ChevronDown, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIconRetina,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const categories = [
    { id: 'all', label: 'All Circles', icon: Package },
    { id: 'job', label: 'Jobs', icon: Briefcase },
    { id: 'service', label: 'Services', icon: Wrench },
    { id: 'sell', label: 'Sell', icon: Tag },
    { id: 'rent', label: 'Rent', icon: Key }
];


// Helper to update map center programmatically
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
    const { isDark } = useTheme(); // Theme awareness
    const { success, error: showError } = useToast();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('latest');
    const [locationFilter, setLocationFilter] = useState('all');
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
    const [userLocation, setUserLocation] = useState(null);
    const [loadingLocation, setLoadingLocation] = useState(false); // New state for geolocation loading
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);

    const { socket } = useSocket(); // Get socket from context

    useEffect(() => {
        if (socket) {
            socket.on('new_post', (newPost) => {
                setPosts(prev => [newPost, ...prev]);
                success('New post added!');
            });
            return () => socket.off('new_post');
        }
    }, [socket]);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const res = await api.get('/posts');
            setPosts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Get unique locations for filter dropdown
    const availableLocations = React.useMemo(() => {
        const locations = [...new Set(posts.map(p => p.location).filter(Boolean))];
        return locations.sort();
    }, [posts]);

    const filteredPosts = React.useMemo(() => {
        let result = posts.filter(post => {
            const matchesFilter = filter === 'all' || post.type === filter;
            const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                post.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesLocation = locationFilter === 'all' || post.location === locationFilter;
            return matchesFilter && matchesSearch && matchesLocation;
        });

        // Sort posts
        result.sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [posts, filter, searchTerm, locationFilter, sortOrder]);

    // Map Specific logic
    const mapPosts = React.useMemo(() => {
        return filteredPosts
            .filter(p => p.locationCoords?.coordinates)
            .map(p => {
                // Fuzz coordinates slightly for privacy (+/- ~250m) as in mobile
                const fuzzLat = (Math.random() - 0.5) * 0.005;
                const fuzzLng = (Math.random() - 0.5) * 0.005;
                return {
                    ...p,
                    displayLat: p.locationCoords.coordinates[1] + fuzzLat,
                    displayLng: p.locationCoords.coordinates[0] + fuzzLng
                };
            });
    }, [filteredPosts]);

    const toggleViewMode = () => {
        if (viewMode === 'list' && !userLocation) {
            setLoadingLocation(true);
            // Try to get user location
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserLocation({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    });
                    setLoadingLocation(false);
                },
                (err) => {
                    console.log("Location denied", err);
                    setLoadingLocation(false);
                    showError("Could not access your location. Showing default map.");
                }
            );
        }
        setViewMode(viewMode === 'list' ? 'map' : 'list');
    };

    const handlePostClick = (postId) => {
        navigate(`/post/${postId}`);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Premium Header Section */}
            <div className="flex flex-col gap-10 mb-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-3">
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-5xl font-black text-foreground tracking-tight leading-none"
                        >
                            Discover <span className="text-primary italic">Circles</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-lg text-muted-foreground font-medium max-w-md leading-relaxed"
                        >
                            Explore hyper-local opportunities, services, and connections in your immediate circle.
                        </motion.p>
                    </div>

                    {/* View Mode Switcher */}
                    <div className="glass rounded-2xl p-1 w-full md:w-auto">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
                        >
                            <ListIcon className="w-4 h-4" /> List
                        </button>
                        <button
                            onClick={toggleViewMode}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'map' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
                        >
                            <MapIcon className="w-4 h-4" /> Map
                        </button>
                    </div>
                </div>

                {/* Search & Filter Container */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="relative group flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by title, description or tags..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full glass rounded-2xl pl-12 pr-4 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-lg font-medium bg-transparent"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                                className={`flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-bold transition-all ${isFilterExpanded ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'glass text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
                            >
                                <Filter className="w-4 h-4" />
                                Filters
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isFilterExpanded ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {isFilterExpanded && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="glass-panel grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6"
                            >
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase px-1">Sort By</label>
                                    <select
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(e.target.value)}
                                        className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all cursor-pointer appearance-none"
                                    >
                                        <option value="latest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase px-1">Location</label>
                                    <select
                                        value={locationFilter}
                                        onChange={(e) => setLocationFilter(e.target.value)}
                                        className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all cursor-pointer appearance-none"
                                    >
                                        <option value="all">Everywhere</option>
                                        {availableLocations.map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="lg:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase px-1">Quick Action</label>
                                    <div className="flex gap-2 h-[46px]">
                                        <button
                                            onClick={() => {
                                                setSearchTerm('');
                                                setFilter('all');
                                                setLocationFilter('all');
                                            }}
                                            className="px-6 rounded-xl bg-white/5 text-xs font-bold text-muted-foreground hover:text-white hover:bg-white/10 transition-all border border-white/5"
                                        >
                                            Reset Filters
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Category Tabs */}
                    {!isFilterExpanded && (
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setFilter(cat.id)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all ${filter === cat.id ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105' : 'glass hover:bg-white/5 text-muted-foreground hover:text-foreground hover:translate-y-[-2px]'}`}
                                >
                                    <cat.icon className="w-4 h-4" />
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Grid or Map */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map((idx) => (
                        <PostSkeleton key={idx} />
                    ))}
                </div>
            ) : viewMode === 'map' ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="map-container relative z-10 rounded-[2rem] overflow-hidden border border-card-border shadow-2xl h-[600px] bg-card/5"
                >
                    <MapContainer
                        center={userLocation ? [userLocation.lat, userLocation.lng] : [20.5937, 78.9629]}
                        zoom={userLocation ? 13 : 5}
                        scrollWheelZoom={true}
                        className="w-full h-full z-0"
                    >
                        <MapUpdater center={userLocation ? [userLocation.lat, userLocation.lng] : null} zoom={userLocation ? 13 : 5} />
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url={isDark
                                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
                        />
                        {userLocation && (
                            <Marker position={[userLocation.lat, userLocation.lng]}>
                                <Popup className="font-bold">You are here</Popup>
                            </Marker>
                        )}
                        {mapPosts.map(post => (
                            <Marker
                                key={post._id}
                                position={[post.displayLat, post.displayLng]}
                            >
                                <Popup className="custom-popup">
                                    <div className="min-w-[240px] overflow-hidden">
                                        {post.images && post.images[0] && (
                                            <div className="h-32 -mx-3 -mt-3 mb-3">
                                                <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div className="flex justify-between items-start mb-2 px-1">
                                            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">{post.type}</span>
                                            {post.price && <span className="font-bold text-sm text-foreground">₹{post.price}</span>}
                                        </div>
                                        <h3 className="font-bold text-sm mb-1 text-foreground px-1">{post.title}</h3>
                                        <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed px-1">{post.description}</p>
                                        <button
                                            onClick={() => handlePostClick(post._id)}
                                            className="w-full py-2 bg-primary text-white text-[10px] font-bold rounded-lg shadow-lg shadow-primary/20 hover:tracking-widest transition-all"
                                        >
                                            VIEW CIRCLE
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>

                    {/* Loading Overlay for Geolocation */}
                    {loadingLocation && (
                        <div className="absolute inset-0 z-[1000] bg-background/50 backdrop-blur-sm flex flex-col items-center justify-center">
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-foreground font-medium animate-pulse">Locating you...</p>
                        </div>
                    )}
                </motion.div>
            ) : (
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: {
                                staggerChildren: 0.1
                            }
                        }
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {filteredPosts.length > 0 ? (
                        filteredPosts.map((post) => (
                            <motion.div
                                key={post._id}
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    visible: { opacity: 1, y: 0 }
                                }}
                                onClick={() => handlePostClick(post._id)}
                                className="cursor-pointer h-full"
                            >
                                <PostCard
                                    post={post}
                                    currentUserId={user?._id}
                                />
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-32 text-center bg-white/5 rounded-[2rem] border border-white/5 border-dashed">
                            <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">No Circles Found</h3>
                            <p className="text-gray-500 max-w-xs mx-auto">We couldn't find any circular activities matching your criteria. Try adjusting your filters!</p>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default Feed;
