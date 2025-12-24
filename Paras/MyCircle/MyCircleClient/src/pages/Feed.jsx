import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Icons
import {
    Search, Map as MapIcon,
    List as ListIcon, Package,
    Briefcase, Wrench, Tag, Key,
    SlidersHorizontal, X
} from 'lucide-react';

// Contexts & Components
import api from '../utils/api';
import { useToast } from '../components/ui/Toast';
import PostCard from '../components/ui/PostCard';
import PostSkeleton from '../components/ui/PostSkeleton';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

// --- Leaflet Icon Fix ---
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
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

// --- Constants ---
const categories = [
    { id: 'all', label: 'All', icon: Package },
    { id: 'job', label: 'Jobs', icon: Briefcase },
    { id: 'service', label: 'Services', icon: Wrench },
    { id: 'sell', label: 'Buy/Sell', icon: Tag },
    { id: 'rent', label: 'Rentals', icon: Key }
];

// --- Helper Components ---

const MapUpdater = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom, { duration: 1.5 });
        }
    }, [center, zoom, map]);
    return null;
};

// --- Navbar (Matches Home.jsx) ---
const Navbar = ({ user, navigate }) => {
    const [imgError, setImgError] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all duration-300">
            <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
                        <span className="text-xl">M</span>
                    </div>
                    MyCircle.
                </div>

                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            <button
                                onClick={() => navigate('/create-post')}
                                className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-semibold rounded-full hover:bg-slate-800 transition-all shadow-lg shadow-black/20"
                            >
                                + Create Post
                            </button>
                            <img
                                src={!imgError && user.avatar ? user.avatar : `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=000&color=fff`}
                                alt="Profile"
                                className="w-10 h-10 rounded-full cursor-pointer ring-2 ring-white shadow-sm hover:ring-slate-200 transition-all object-cover"
                                onClick={() => navigate('/profile')}
                                onError={() => setImgError(true)}
                                referrerPolicy="no-referrer"
                            />
                        </>
                    ) : (
                        <button
                            onClick={() => window.location.href = 'http://localhost:5000/auth/google'}
                            className="px-5 py-2.5 bg-black text-white rounded-full text-sm font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-black/20"
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};

// --- 2. Control Bar with Integrated Search ---
const ControlSubBar = ({
    filter, setFilter,
    viewMode, toggleViewMode,
    isFilterExpanded, setIsFilterExpanded,
    searchTerm, setSearchTerm
}) => (
    <div className="w-full pb-4 pt-2 px-4">
        <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-[1400px] mx-auto">

            {/* Search Input - Pill Style */}
            <div className="relative group flex-grow sm:flex-grow-0 w-full sm:w-auto min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search circles..."
                    className="w-full sm:w-64 bg-white border border-slate-200 text-slate-900 text-sm font-semibold rounded-xl pl-9 pr-8 py-2.5 transition-all focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none shadow-sm placeholder:text-slate-400"
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            <div className="hidden sm:block w-px h-6 bg-slate-200 mx-1" />

            {/* Categories */}
            <div className="flex flex-wrap items-center justify-center gap-2">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setFilter(cat.id)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${filter === cat.id
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md transform scale-105'
                            : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300 hover:text-slate-900'
                            }`}
                    >
                        <cat.icon size={14} />
                        {cat.label}
                    </button>
                ))}
            </div>

            <div className="hidden sm:block w-px h-6 bg-slate-200 mx-1" />

            {/* View & Filter Toggles */}
            <div className="flex items-center gap-2 ml-auto sm:ml-0">
                {/* View Toggle */}
                <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
                    <button
                        onClick={() => viewMode !== 'list' && toggleViewMode()}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-100 text-slate-900 shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <ListIcon size={16} />
                    </button>
                    <button
                        onClick={() => viewMode !== 'map' && toggleViewMode()}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-slate-100 text-slate-900 shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <MapIcon size={16} />
                    </button>
                </div>

                {/* Filter Toggle */}
                <button
                    onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                    className={`p-2.5 rounded-xl border transition-all ${isFilterExpanded ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-100 text-slate-400 hover:text-slate-900'}`}
                >
                    <SlidersHorizontal size={18} />
                </button>
            </div>
        </div>
    </div>
);

// --- Main Component ---
const Feed = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { success, error: showError } = useToast();
    const { socket } = useSocket();

    // State
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('latest');
    const [locationFilter, setLocationFilter] = useState('all');
    const [viewMode, setViewMode] = useState('list');
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);

    // Map State
    const [userLocation, setUserLocation] = useState(null);
    const [loadingLocation, setLoadingLocation] = useState(false);

    // Fetch Posts
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const res = await api.get('/posts');
                setPosts(res.data);
            } catch (err) {
                console.error(err);
                if (showError) showError('Failed to load feed');
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, [showError]);

    // Socket Listener
    useEffect(() => {
        if (!socket) return;
        const handleNewPost = (newPost) => {
            setPosts(prev => [newPost, ...prev]);
            if (success) success('New circle added near you!');
        };
        socket.on('new_post', handleNewPost);
        return () => socket.off('new_post', handleNewPost);
    }, [socket, success]);

    // Derived State
    const availableLocations = useMemo(() => {
        return [...new Set(posts.map(p => p.location).filter(Boolean))].sort();
    }, [posts]);

    const filteredPosts = useMemo(() => {
        let result = posts.filter(post => {
            const matchesFilter = filter === 'all' || post.type === filter;
            const matchesSearch = !searchTerm ||
                post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                post.description?.toLowerCase().includes(searchTerm.toLowerCase());
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

    // Deterministic Fuzzing for Map Markers
    const mapPosts = useMemo(() => {
        return filteredPosts
            .filter(p => p.locationCoords?.coordinates)
            .map(p => {
                const idHash = p._id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const fuzzLat = ((idHash % 100) / 10000) - 0.005;
                const fuzzLng = ((idHash % 50) / 10000) - 0.0025;

                return {
                    ...p,
                    displayLat: p.locationCoords.coordinates[1] + fuzzLat,
                    displayLng: p.locationCoords.coordinates[0] + fuzzLng
                };
            });
    }, [filteredPosts]);

    // Toggle View Handler
    const toggleViewMode = () => {
        if (viewMode === 'list' && !userLocation) {
            setLoadingLocation(true);
            if (!navigator.geolocation) {
                setLoadingLocation(false);
                setViewMode('map');
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setLoadingLocation(false);
                    setViewMode('map');
                },
                (err) => {
                    console.error("Location access denied", err);
                    setLoadingLocation(false);
                    if (showError) showError("Could not locate you. Showing default map.");
                    setViewMode('map');
                }
            );
        } else {
            setViewMode(prev => prev === 'list' ? 'map' : 'list');
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAF9] text-slate-900 selection:bg-emerald-200 selection:text-emerald-900 font-sans pb-20">

            {/* Navbar */}
            <Navbar user={user} navigate={navigate} />

            <div className="pt-28 px-4 md:px-8 max-w-[1600px] mx-auto">

                {/* Header Title */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold uppercase tracking-widest text-emerald-700 shadow-sm mb-4"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Live Feed
                    </motion.div>
                    <h1 className="font-serif text-4xl md:text-5xl font-bold text-slate-900 mb-2">
                        Discover Your Circle.
                    </h1>
                </div>

                {/* Control Bar with Search */}
                <ControlSubBar
                    filter={filter} setFilter={setFilter}
                    viewMode={viewMode} toggleViewMode={toggleViewMode}
                    setIsFilterExpanded={setIsFilterExpanded} isFilterExpanded={isFilterExpanded}
                    searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                />

                {/* Filters Drawer */}
                <AnimatePresence>
                    {isFilterExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden max-w-2xl mx-auto"
                        >
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mt-4 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort By</label>
                                    <select
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(e.target.value)}
                                        className="w-full bg-slate-50 border-transparent rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-slate-900"
                                    >
                                        <option value="latest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</label>
                                    <select
                                        value={locationFilter}
                                        onChange={(e) => setLocationFilter(e.target.value)}
                                        className="w-full bg-slate-50 border-transparent rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-slate-900"
                                    >
                                        <option value="all">Everywhere</option>
                                        {availableLocations.map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Content Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
                        {[...Array(8)].map((_, i) => <PostSkeleton key={i} />)}
                    </div>
                ) : viewMode === 'map' ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="h-[65vh] w-full rounded-[2rem] overflow-hidden border border-slate-200 shadow-xl relative z-0 mt-8"
                    >
                        <MapContainer
                            center={userLocation ? [userLocation.lat, userLocation.lng] : [20.5937, 78.9629]}
                            zoom={userLocation ? 13 : 5}
                            scrollWheelZoom={true}
                            className="w-full h-full z-0"
                        >
                            <MapUpdater center={userLocation ? [userLocation.lat, userLocation.lng] : null} zoom={userLocation ? 13 : 5} />
                            <TileLayer
                                attribution='&copy; OpenStreetMap contributors'
                                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                            />
                            {userLocation && (
                                <Marker position={[userLocation.lat, userLocation.lng]}>
                                    <Popup>You are here</Popup>
                                </Marker>
                            )}
                            {mapPosts.map(post => (
                                <Marker key={post._id} position={[post.displayLat, post.displayLng]}>
                                    <Popup className="custom-popup">
                                        <div className="w-48">
                                            <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{post.type}</span>
                                            <h3 className="font-bold text-sm my-1 leading-tight">{post.title}</h3>
                                            <Link to={`/post/${post._id}`} className="text-xs text-blue-600 font-bold hover:underline">View Details →</Link>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                        {loadingLocation && (
                            <div className="absolute inset-0 z-[1001] bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                <span className="font-bold text-emerald-800 animate-pulse">Locating...</span>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
                        <AnimatePresence mode="popLayout">
                            {filteredPosts.length > 0 ? (
                                filteredPosts.map((post) => (
                                    <motion.div
                                        key={post._id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        onClick={() => navigate(`/post/${post._id}`)}
                                        className="cursor-pointer h-full"
                                    >
                                        <PostCard post={post} currentUserId={user?._id} />
                                    </motion.div>
                                ))
                            ) : (
                                <div className="col-span-full py-20 text-center">
                                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="text-slate-400" size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">No circles found</h3>
                                    <p className="text-slate-500 mt-2">Try adjusting your filters.</p>
                                    <button
                                        onClick={() => { setSearchTerm(''); setFilter('all'); setLocationFilter('all'); }}
                                        className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-full text-sm font-bold"
                                    >
                                        Reset Filters
                                    </button>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Mobile FAB */}
            {user && (
                <button
                    onClick={() => navigate('/create-post')}
                    className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-xl flex items-center justify-center z-50 hover:scale-110 active:scale-95 transition-all"
                >
                    <span className="text-2xl font-light">+</span>
                </button>
            )}
        </div>
    );
};

export default Feed;