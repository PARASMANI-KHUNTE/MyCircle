import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useToast } from '../components/ui/Toast';
import PostCard from '../components/ui/PostCard';
import PostSkeleton from '../components/ui/PostSkeleton';
import {
    Filter, Search, Map as MapIcon,
    List as ListIcon, MapPin, Package,
    Briefcase, Wrench, Tag, Key,
    ChevronDown, SlidersHorizontal, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
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
    { id: 'all', label: 'All', icon: Package },
    { id: 'job', label: 'Jobs', icon: Briefcase },
    { id: 'service', label: 'Services', icon: Wrench },
    { id: 'sell', label: 'Buy/Sell', icon: Tag },
    { id: 'rent', label: 'Rentals', icon: Key }
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
    const { success, error: showError } = useToast();
    const [posts, setPosts] = useState([]);
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

        result.sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [posts, filter, searchTerm, locationFilter, sortOrder]);

    const mapPosts = React.useMemo(() => {
        return filteredPosts
            .filter(p => p.locationCoords?.coordinates)
            .map(p => {
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
        <div className="min-h-screen bg-white text-slate-900">
            {/* --- Minimal Navbar --- */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 font-bold text-xl tracking-tighter cursor-pointer"
                        >
                            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
                                <span className="text-lg">M</span>
                            </div>
                            MyCircle.
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {user && (
                            <button
                                onClick={() => navigate('/create')}
                                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-bold rounded-full hover:bg-slate-800 transition-all"
                            >
                                + Create Post
                            </button>
                        )}
                        {user ? (
                            <img
                                src={`https://ui-avatars.com/api/?name=${user.displayName}&background=000&color=fff`}
                                alt="Profile"
                                className="w-8 h-8 rounded-full cursor-pointer hover:ring-2 hover:ring-slate-100 transition-all"
                                onClick={() => navigate('/profile')}
                            />
                        ) : (
                            <button onClick={() => navigate('/auth')} className="text-sm font-bold hover:underline">Sign In</button>
                        )}
                    </div>
                </div>
            </nav>

            <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
                {/* --- Control Bar --- */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
                    <div className="relative w-full md:max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-black transition-colors" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 border border-transparent focus:border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium transition-all focus:outline-none focus:bg-white focus:ring-4 focus:ring-slate-50"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setFilter(cat.id)}
                                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all border ${filter === cat.id
                                    ? 'bg-black text-white border-black'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-black'
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-black' : 'text-slate-500 hover:text-black'}`}
                            >
                                <ListIcon size={16} />
                            </button>
                            <button
                                onClick={toggleViewMode}
                                className={`p-2 rounded-md transition-all ${viewMode === 'map' ? 'bg-white shadow-sm text-black' : 'text-slate-500 hover:text-black'}`}
                            >
                                <MapIcon size={16} />
                            </button>
                        </div>
                        <button
                            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                            className={`p-2.5 rounded-xl border transition-all ${isFilterExpanded ? 'bg-slate-50 border-slate-300 text-black' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                        >
                            <SlidersHorizontal size={16} />
                        </button>
                    </div>
                </div>

                {/* --- Expanded Filters --- */}
                <AnimatePresence>
                    {isFilterExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginBottom: 40 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            className="bg-slate-50 rounded-2xl p-6 border border-slate-100 overflow-hidden"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort By</label>
                                    <select
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-black transition-colors"
                                    >
                                        <option value="latest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</label>
                                    <select
                                        value={locationFilter}
                                        onChange={(e) => setLocationFilter(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-black transition-colors"
                                    >
                                        <option value="all">Everywhere</option>
                                        {availableLocations.map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2 flex flex-col justify-end">
                                    <button
                                        onClick={() => {
                                            setSearchTerm('');
                                            setFilter('all');
                                            setLocationFilter('all');
                                            setSortOrder('latest');
                                        }}
                                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:text-red-500 hover:border-red-200 transition-all"
                                    >
                                        Clear All Filters
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* --- Content Grid --- */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
                            <PostSkeleton key={idx} />
                        ))}
                    </div>
                ) : viewMode === 'map' ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.99 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="h-[600px] w-full rounded-2xl overflow-hidden border border-slate-200 relative z-0"
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
                                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
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
                                        <div className="min-w-[200px]">
                                            <h3 className="font-bold text-sm mb-1">{post.title}</h3>
                                            <button
                                                onClick={() => handlePostClick(post._id)}
                                                className="text-xs font-bold text-blue-600 hover:underline"
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                        {loadingLocation && (
                            <div className="absolute inset-0 z-[1000] bg-white/60 backdrop-blur-sm flex items-center justify-center">
                                <div className="text-sm font-bold text-black animate-pulse">Locating...</div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredPosts.length > 0 ? (
                                filteredPosts.map((post) => (
                                    <motion.div
                                        key={post._id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
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
                                <div className="col-span-full py-40 text-center">
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">No circles found</h3>
                                    <p className="text-slate-500 text-sm">Try adjusting your filters or search terms.</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Feed;
