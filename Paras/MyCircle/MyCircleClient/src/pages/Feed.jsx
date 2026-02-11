import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api'; // Use API
import { useToast } from '../components/ui/Toast';
import PostCard from '../components/ui/PostCard';
import ServiceCard from '../components/ui/ServiceCard'; // Import ServiceCard
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
    const [services, setServices] = useState([]); // State for services
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
        if (filter === 'service') {
            fetchServices();
        } else {
            fetchPosts();
        }
    }, [filter]); // Re-fetch when filter changes (especially switching to/from Services)

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/posts');
            setPosts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchServices = async () => {
        setLoading(true);
        try {
            // Fetch services with flexible search if term exists
            const params = new URLSearchParams();
            if (searchTerm) params.append('skill', searchTerm);
            params.append('sort', sortOrder === 'latest' ? 'rating' : 'endorsements'); // Map sort order to service sort

            const res = await api.get(`/user/services?${params.toString()}`);
            setServices(res.data);
        } catch (err) {
            console.error('Failed to fetch services:', err);
            if (err.response) {
                console.error('Error response:', err.response.data);
                console.error('Error status:', err.response.status);
                showError(`Search failed: ${err.response.data.msg || 'Server Error'}`);
            } else {
                showError("Network error. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Trigger service fetch on search/sort change if in service mode
    useEffect(() => {
        if (filter === 'service') {
            fetchServices();
        }
    }, [searchTerm, sortOrder]);


    // Get unique locations for filter dropdown
    const availableLocations = React.useMemo(() => {
        const locations = Array.from(new Set(posts.map(p => p.location).filter(Boolean)));
        return locations.sort();
    }, [posts]);

    const filteredPosts = React.useMemo(() => {
        if (filter === 'service') return services; // Pass through services if in service mode

        let result = posts.filter(post => {
            const matchesFilter = filter === 'all' || post.type === filter;
            const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                post.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesLocation = locationFilter === 'all' || post.location === locationFilter;
            return matchesFilter && matchesSearch && matchesLocation;
        });

        // Sort posts
        result.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [posts, services, filter, searchTerm, locationFilter, sortOrder]);

    // Map Specific logic
    const mapPosts = React.useMemo(() => {
        if (filter === 'service') return []; // No map for services yet

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
    }, [filteredPosts, filter]);

    const toggleViewMode = () => {
        if (filter === 'service') {
            showError("Map view not available for Services yet.");
            return;
        }

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
            <header className="relative mb-12 py-10 overflow-hidden">
                {/* Decorative Background Elements */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, 0],
                            x: [0, 10, 0]
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-[10%] -left-[5%] w-[40%] h-[120%] bg-primary/5 blur-[100px] rounded-full"
                    />
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, -5, 0],
                            x: [0, -15, 0]
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute top-[20%] -right-[10%] w-[30%] h-[100%] bg-secondary/5 blur-[120px] rounded-full"
                    />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div className="space-y-4 max-w-2xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-2"
                        >
                            <Sparkles className="w-3 h-3" />
                            <span>Hyper-Local Networking</span>
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-6xl md:text-7xl font-black text-text-heading tracking-tight leading-[0.9] flex flex-col"
                        >
                            <span>Discover Your</span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-500 to-secondary italic">Inner Circle</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg text-text-muted font-medium max-w-lg leading-relaxed pt-2"
                        >
                            Find trusted services, trade items, and explore unique local opportunities in our modern minimalist marketplace.
                        </motion.p>
                    </div>

                    {/* View Mode Switcher */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="glass-panel p-1.5 flex gap-1 shadow-xl hover:shadow-2xl transition-all duration-500"
                    >
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "relative flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black tracking-wide transition-all duration-300",
                                viewMode === 'list'
                                    ? "bg-primary text-primary-foreground shadow-button scale-105"
                                    : "text-text-muted hover:text-text-heading hover:bg-hover-bg"
                            )}
                        >
                            <ListIcon className="w-4 h-4" />
                            <span>LIST</span>
                            {viewMode === 'list' && (
                                <motion.div layoutId="view-blob" className="absolute inset-0 bg-primary rounded-xl -z-10" />
                            )}
                        </button>
                        <button
                            onClick={toggleViewMode}
                            className={cn(
                                "relative flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black tracking-wide transition-all duration-300",
                                viewMode === 'map'
                                    ? "bg-primary text-white shadow-button scale-105"
                                    : "text-text-muted hover:text-text-heading hover:bg-hover-bg"
                            )}
                        >
                            <MapIcon className="w-4 h-4" />
                            <span>MAP</span>
                            {viewMode === 'map' && (
                                <motion.div layoutId="view-blob" className="absolute inset-0 bg-primary rounded-xl -z-10" />
                            )}
                        </button>
                    </motion.div>
                </div>
            </header>

            {/* Main Action Bar */}
            <div className="sticky top-24 z-40 mb-12">
                <div className="glass-panel p-2 shadow-2xl flex flex-col gap-4">
                    <div className="flex flex-col lg:flex-row gap-3">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder={filter === 'service' ? "Search for skills (e.g. Graphic Designer)..." : "What are you looking for?"}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-background/50 border border-card-border rounded-2xl pl-14 pr-6 py-5 text-text-heading placeholder:text-text-muted focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-[15px] font-bold"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                                className={cn(
                                    "flex items-center gap-2 px-8 py-4 rounded-2xl text-[13px] font-black tracking-widest uppercase transition-all duration-300 border border-card-border",
                                    isFilterExpanded
                                        ? "bg-text-heading text-primary-foreground"
                                        : "bg-card text-text-heading hover:bg-hover-bg"
                                )}
                            >
                                <Filter className="w-4 h-4" />
                                {isFilterExpanded ? 'Close' : 'Filter'}
                                <ChevronDown className={cn("w-4 h-4 transition-transform duration-500", isFilterExpanded && "rotate-180")} />
                            </button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {isFilterExpanded && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 pt-0">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black tracking-widest text-text-muted uppercase px-1">Sort By Priority</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['latest', 'oldest'].map((order) => (
                                                <button
                                                    key={order}
                                                    onClick={() => setSortOrder(order)}
                                                    className={cn(
                                                        "py-3 rounded-xl text-xs font-bold uppercase transition-all tracking-wide border",
                                                        sortOrder === order
                                                            ? "bg-primary text-primary-foreground border-primary/20"
                                                            : "bg-background-section border-card-border text-text-muted hover:bg-hover-bg"
                                                    )}
                                                >
                                                    {order}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black tracking-widest text-text-muted uppercase px-1">Local Reach</label>
                                        <select
                                            value={locationFilter}
                                            onChange={(e) => setLocationFilter(e.target.value)}
                                            className="w-full bg-background-section border border-card-border rounded-xl px-4 py-3 text-sm text-text-heading font-bold focus:outline-none focus:border-primary/30 transition-all appearance-none cursor-pointer"
                                            disabled={filter === 'service'}
                                        >
                                            <option value="all">EVERYWHERE</option>
                                            {availableLocations.map(loc => (
                                                <option key={loc} value={loc}>{loc.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex items-end">
                                        <button
                                            onClick={() => {
                                                setSearchTerm('');
                                                setLocationFilter('all');
                                                setSortOrder('latest');
                                            }}
                                            className="w-full py-3.5 rounded-xl border border-red-500/20 text-red-500 text-[11px] font-black tracking-widest uppercase hover:bg-red-500/10 transition-all"
                                        >
                                            Clear All Filters
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Category Selection Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-2 px-2">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setFilter(cat.id)}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 uppercase tracking-wider group",
                                    filter === cat.id
                                        ? "bg-primary text-primary-foreground shadow-button"
                                        : "text-text-muted hover:text-text-heading hover:bg-hover-bg"
                                )}
                            >
                                <cat.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", filter === cat.id ? "scale-110" : "")} />
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid or Map */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map((idx) => (
                        <PostSkeleton key={idx} />
                    ))}
                </div>
            ) : viewMode === 'map' && filter !== 'service' ? (
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
                                    <div className="min-w-[280px] p-1">
                                        {post.images && post.images[0] && (
                                            <div className="h-40 -mx-1 -mt-1 mb-4 rounded-xl overflow-hidden">
                                                <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/20">
                                                {post.type}
                                            </span>
                                            {post.price && (
                                                <span className="font-bold text-base text-text-heading">₹{post.price}</span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-base mb-1 text-text-heading leading-snug">{post.title}</h3>
                                        <p className="text-xs text-text-muted line-clamp-2 mb-4 leading-relaxed font-medium">
                                            {post.description}
                                        </p>
                                        <button
                                            onClick={() => handlePostClick(post._id)}
                                            className="w-full py-3 bg-primary text-primary-foreground text-[11px] font-black rounded-xl shadow-xl hover:bg-primary-hover transition-all uppercase tracking-widest"
                                        >
                                            Explore Circle
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
                    {filter === 'service' ? (
                        // Render Service Cards
                        filteredPosts.length > 0 ? (
                            filteredPosts.map((user, index) => (
                                <motion.div
                                    key={user._id}
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        visible: { opacity: 1, y: 0 }
                                    }}
                                    className="h-full"
                                >
                                    <ServiceCard user={user} searchedSkill={searchTerm} />
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full py-32 text-center bg-card/10 rounded-[2.5rem] border border-card-border/30 border-dashed">
                                <Search className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-30" />
                                <h3 className="text-xl font-black text-text-heading mb-2 uppercase">No Professionals Found</h3>
                                <p className="text-text-muted max-w-xs mx-auto font-medium">Try searching for a different skill or keyword.</p>
                            </div>
                        )
                    ) : (
                        // Render Post Cards
                        filteredPosts.length > 0 ? (
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
                                        onRequestContact={() => handlePostClick(post._id)}
                                    />
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full py-32 flex flex-col items-center text-center">
                                <div className="relative mb-10">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                        className="absolute -inset-10 border-2 border-dashed border-primary/20 rounded-full"
                                    />
                                    <div className="w-32 h-32 rounded-full bg-primary/5 flex items-center justify-center border border-primary/20 shadow-inner">
                                        <Sparkles className="w-12 h-12 text-primary/30" />
                                    </div>
                                </div>
                                <h3 className="text-3xl font-black text-text-heading mb-3 tracking-tight uppercase">Circle Unknown</h3>
                                <p className="text-text-muted max-w-sm mx-auto mb-10 font-bold leading-relaxed">
                                    We couldn't find any circular activities in this orbit. Try a different skill or create your own gravity.
                                </p>
                                <button
                                    onClick={() => navigate('/create-post')}
                                    className="px-10 py-4 bg-primary text-primary-foreground text-[13px] font-black rounded-2xl shadow-button hover:scale-105 active:scale-95 transition-all tracking-widest uppercase"
                                >
                                    Begin a Circle
                                </button>
                            </div>
                        )
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default Feed;
