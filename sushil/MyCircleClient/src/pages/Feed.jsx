import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api'; // Use API
import { useToast } from '../components/ui/Toast';
import PostCard from '../components/ui/PostCard';
import { Filter, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

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

    const handlePostClick = (postId) => {
        navigate(`/post/${postId}`);
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Explore Tasks</h1>
                    <p className="text-gray-400">Find opportunities and services near you.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    {/* Sort Dropdown */}
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer"
                    >
                        <option value="latest" className="bg-zinc-900">Latest First</option>
                        <option value="oldest" className="bg-zinc-900">Oldest First</option>
                    </select>

                    {/* Location Dropdown */}
                    <select
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer"
                    >
                        <option value="all" className="bg-zinc-900">All Locations</option>
                        {availableLocations.map(loc => (
                            <option key={loc} value={loc} className="bg-zinc-900">{loc}</option>
                        ))}
                    </select>

                    <div className="relative group flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                        />
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0">
                        {/* Simple Filter Buttons */}
                        {['all', 'job', 'service', 'sell', 'rent', 'barter'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${filter === f
                                    ? 'bg-white text-black'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-white text-center py-20">Loading tasks...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPosts.map((post) => (
                        <div key={post._id} onClick={() => handlePostClick(post._id)} className="cursor-pointer">
                            <PostCard
                                post={post}
                                currentUserId={user?._id}
                            // onRequestContact removed to force navigation
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Feed;
