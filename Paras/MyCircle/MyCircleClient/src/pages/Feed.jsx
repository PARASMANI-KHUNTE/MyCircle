import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Search, Map as MapIcon,
    List as ListIcon, Package,
    Briefcase, Wrench, Tag, Key,
    SlidersHorizontal, X, ArrowUpRight, Grid3x3, LayoutGrid
} from 'lucide-react';

import api from '../utils/api';
import { useToast } from '../components/ui/Toast';
import PostCard from '../components/ui/PostCard';
import PostSkeleton from '../components/ui/PostSkeleton';
import { useAuth } from '../context/AuthContext';
import { getAvatarUrl } from '../utils/avatar';

// --- Constants ---
const categories = [
    { id: 'all', label: 'All', icon: Package },
    { id: 'job', label: 'Jobs', icon: Briefcase },
    { id: 'service', label: 'Services', icon: Wrench },
    { id: 'sell', label: 'Buy/Sell', icon: Tag },
    { id: 'rent', label: 'Rentals', icon: Key }
];

const Feed = ({ isDashboard = false }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { success, error: showError } = useToast();

    // State
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'map' (though map is handled separately in dashboard often, keeping generic view toggle)

    // Redirect logged-in users to dashboard (Feed is for guests only when standalone)
    useEffect(() => {
        if (!isDashboard && user) {
            navigate('/dashboard');
        }
    }, [user, isDashboard, navigate]);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const res = await api.get('/posts');
            // API returns array directly or { posts: [] } - handling both for robustness
            setPosts(Array.isArray(res.data) ? res.data : (res.data.posts || []));
        } catch (err) {
            console.error(err);
            showError('Failed to fetch posts');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateContactRequest = async (postId, e) => {
        e.stopPropagation();
        if (!user) return; // Should be handled by UI guard, but double check
        try {
            await api.post(`/requests/${postId}`);
            success('Contact request sent!');
        } catch (err) {
            showError(err.response?.data?.msg || 'Failed to send request');
        }
    };

    // Filter Logic
    const filteredPosts = posts.filter(post => {
        const matchesCategory = filter === 'all' || post.type === filter;
        const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return isDashboard ? (
        <div className="flex flex-col h-full">
            {/* --- Sticky Header (Dashboard Mode) --- */}
            {isDashboard ? (
                <div className="sticky top-0 z-30 bg-[#FAFAF9]/95 backdrop-blur-md pt-2 pb-6 border-b border-zinc-200/50 mb-6 transition-all">
                    <div className="flex flex-col gap-6">

                        {/* Title & Stats */}
                        <div className="flex items-end justify-between px-1">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Discover Your Circle</h1>
                                <p className="text-zinc-500 font-medium mt-1">
                                    {loading ? 'Loading market data...' : `${filteredPosts.length} active listings in your area`}
                                </p>
                            </div>
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            {/* Search Input */}
                            <div className="relative group w-full md:w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search for jobs, items, services..."
                                    className="w-full bg-white border border-zinc-200 text-zinc-900 text-sm font-medium rounded-full pl-10 pr-10 py-3 focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none shadow-sm placeholder:text-zinc-400 hover:border-zinc-300 transition-all"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Filter Chips */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full md:w-auto no-scrollbar">
                                {categories.map((cat) => {
                                    const Icon = cat.icon;
                                    const isActive = filter === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => setFilter(cat.id)}
                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap ${isActive
                                                ? 'bg-zinc-900 text-white border-zinc-900 shadow-lg shadow-zinc-900/10'
                                                : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300 hover:text-zinc-900 hover:bg-zinc-50'
                                                }`}
                                        >
                                            <Icon size={14} />
                                            {cat.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* --- Standalone Header (Public / No-Dashboard Mode) --- */
                <div className="w-full pb-8 pt-2">
                    <div className="flex flex-col items-center justify-center gap-6 mb-8 text-center">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900">Explore Listings</h1>
                        <p className="text-lg text-zinc-500 max-w-xl">
                            Find trusted services, jobs, and items in your local community.
                        </p>
                    </div>

                    {/* Integrated Search & Filters (Centered) */}
                    <div className="flex flex-col items-center gap-4 max-w-4xl mx-auto">
                        <div className="relative group w-full md:w-2/3">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search everything..."
                                className="w-full bg-white border border-zinc-200 text-zinc-900 text-base font-medium rounded-full pl-12 pr-12 py-4 shadow-sm hover:shadow-md focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900"><X size={16} /></button>
                            )}
                        </div>

                        <div className="flex flex-wrap justify-center gap-2">
                            {categories.map((cat) => {
                                const Icon = cat.icon;
                                const isActive = filter === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setFilter(cat.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border ${isActive
                                            ? 'bg-black text-white border-black'
                                            : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
                                            }`}
                                    >
                                        <Icon size={14} />
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* --- Feed Grid --- */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                    {[...Array(6)].map((_, i) => <PostSkeleton key={i} />)}
                </div>
            ) : filteredPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20 auto-rows-fr">
                    {filteredPosts.map(post => (
                        <div key={post._id} className="h-full">
                            <PostCard
                                post={post}
                                onRequestContact={handleCreateContactRequest}
                                currentUserId={user?._id}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                    <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
                        <Search className="w-8 h-8 text-zinc-300" />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 mb-2">No results found</h3>
                    <p className="text-zinc-500 max-w-sm">
                        We couldn't find any listings matches your search. Try different keywords or browse all categories.
                    </p>
                    <button
                        onClick={() => { setFilter('all'); setSearchTerm(''); }}
                        className="mt-6 text-indigo-600 font-semibold hover:underline"
                    >
                        Clear all filters
                    </button>
                </div>
            )}
        </div>
    );
};

export default Feed;