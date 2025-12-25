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

    // Dashboard mode - render inside dashboard layout
    if (isDashboard) {
        return (
            <div className="flex flex-col h-full">
                {/* --- Sticky Header (Dashboard Mode) --- */}
                <div className="sticky top-0 z-30 bg-[#FAFAF9]/95 backdrop-blur-md pt-2 pb-6 border-b border-zinc-200/50 mb-6 transition-all">
                    <div className="flex flex-col gap-6">
                        <div className="flex items-end justify-between px-1">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Discover Your Circle</h1>
                                <p className="text-zinc-500 font-medium mt-1">
                                    {loading ? 'Loading market data...' : `${filteredPosts.length} active listings in your area`}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-4">
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
                                    <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

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

                {/* Feed Grid */}
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
    }

    // Standalone mode - full page with navbar
    return (
        <div className="min-h-screen bg-white">
            {/* Navbar - Home Style */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
                            <span className="text-xl">M</span>
                        </div>
                        MyCircle.
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => window.location.href = 'http://localhost:5000/auth/google'}
                            className="px-5 py-2.5 bg-black text-white rounded-full text-sm font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-black/20"
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content with top padding */}
            <div className="pt-24 container mx-auto">
                {/* Centered Title Section */}
                <div className="flex flex-col items-center justify-center gap-4 mb-8 text-center pt-8">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Live Feed</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-zinc-900">Discover Your Circle.</h1>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col items-center gap-6 max-w-5xl mx-auto mb-12">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search circles..."
                            className="w-full bg-white border border-zinc-200 text-zinc-900 text-sm font-medium rounded-xl pl-10 pr-10 py-3 shadow-sm hover:shadow focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                        {categories.map((cat) => {
                            const Icon = cat.icon;
                            const isActive = filter === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setFilter(cat.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive
                                        ? 'bg-zinc-900 text-white shadow-sm'
                                        : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-300'
                                        }`}
                                >
                                    <Icon size={16} />
                                    {cat.label}
                                </button>
                            );
                        })}

                        <div className="flex items-center gap-1 ml-2 border border-zinc-200 rounded-xl p-1 bg-white">
                            <button className="p-2 rounded-lg bg-zinc-100 text-zinc-900">
                                <LayoutGrid size={16} />
                            </button>
                            <button className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600">
                                <Grid3x3 size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Feed Grid */}
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
                            We couldn't find any listings. Try different keywords or browse all categories.
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
        </div>
    );
};

export default Feed;