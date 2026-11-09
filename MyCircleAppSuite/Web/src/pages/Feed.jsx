import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import { useToast } from '../components/ui/Toast';
import PostCard from '../components/ui/PostCard';
import Button from '../components/ui/Button';
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
    { id: 'all', label: 'All' },
    { id: 'service', label: 'Earn' },
    { id: 'hire', label: 'Hire' },
    { id: 'trade', label: 'Trade' },
    { id: 'rent', label: 'Rent' }
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
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('latest');
    const [locationFilter, setLocationFilter] = useState('all');
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const { socket } = useSocket();

    const serverSort = sortOrder === 'latest' || sortOrder === 'oldest' ? sortOrder : 'latest';

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                limit: 50,
                type: filter !== 'all' ? filter : undefined,
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
    }, [filter, searchTerm, locationFilter, sortOrder]);

    const handleSearch = useCallback(() => {
        fetchPosts();
    }, [fetchPosts]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-6">
                {/* Search and Filters */}
                <div className="mb-6 border-b border-border pb-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search posts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                            />
                        </div>
                        <div className="hidden sm:block">
                            <select
                                value={filter}
                                onChange={(e) => { setFilter(e.target.value); handleSearch(); }}
                                className="px-4 py-3 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                            >
                                <option value="all">All Posts</option>
                                <option value="service">Earn</option>
                                <option value="hire">Hire</option>
                                <option value="trade">Trade</option>
                                <option value="rent">Rent</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Posts Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {posts.map((post) => (
                        <PostCard key={post._id} post={post} currentUserId={user?._id} />
                    ))}
                </div>

                {/* Loading state */}
                {loading && (
                    <div className="col-span-12 text-center py-8">
                        <div className="flex justify-center items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-background/50 animate-pulse">
                                <i className="spinner-icon" style="width:2rem;height:2rem;" />
                            </div>
                            <span className="text-sm text-muted-foreground">Loading posts...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Feed;