import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Search, X, Package, Briefcase, Wrench, Tag, Key, Sparkles
} from 'lucide-react';

import api from '../utils/api';
import { useToast } from '../components/ui/Toast';
import PostCard from '../components/ui/PostCard';
import PostSkeleton from '../components/ui/PostSkeleton';
import { useAuth } from '../context/AuthContext';

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
            setPosts(Array.isArray(res.data) ? res.data : (res.data.posts || []));
        } catch (err) {
            console.error(err);
            showError('Failed to fetch posts');
        } finally {
            setLoading(false);
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
                {/* Sticky Header (Dashboard Mode) */}
                <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md pt-2 pb-6 border-b border-slate-100 mb-6">
                    <div className="flex flex-col gap-6">
                        <div className="flex items-end justify-between px-1">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Discover Your Circle</h1>
                                <p className="text-slate-500 font-medium mt-1">
                                    {loading ? 'Loading market data...' : `${filteredPosts.length} active listings in your area`}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="relative group w-full md:w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search for jobs, items, services..."
                                    className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-full pl-10 pr-10 py-3 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none shadow-sm placeholder:text-slate-400 hover:border-slate-300 transition-all"
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900">
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
                                                ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10'
                                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-900 hover:bg-slate-50'
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
                                    currentUserId={user?._id}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Package className="text-slate-400 w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No listings found</h3>
                        <p className="text-slate-500 text-sm">Try adjusting your filters or search terms</p>
                    </div>
                )}
            </div>
        );
    }

    // Standalone Feed for non-logged-in users
    return (
        <div className="min-h-screen bg-white font-sans">
            {/* Navbar */}
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

            {/* Hero Section */}
            <section className="pt-32 pb-12 px-6">
                <div className="container mx-auto max-w-6xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-12"
                    >
                        <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-slate-50 border border-slate-100 text-slate-600 text-xs font-bold tracking-widest uppercase mb-6 shadow-sm">
                            <Sparkles className="w-3 h-3" />
                            Browse Local Listings
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
                            Discover Your Circle
                        </h1>
                        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                            {loading ? 'Loading listings...' : `${filteredPosts.length} active opportunities in your community`}
                        </p>
                    </motion.div>

                    {/* Search and Filters */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="max-w-4xl mx-auto mb-12"
                    >
                        {/* Search Bar */}
                        <div className="relative group mb-6">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search jobs, services, items to buy or rent..."
                                className="w-full bg-white border-2 border-slate-200 text-slate-900 text-base font-medium rounded-2xl pl-14 pr-14 py-4 focus:ring-4 focus:ring-slate-900/10 focus:border-slate-900 outline-none shadow-sm placeholder:text-slate-400 hover:border-slate-300 transition-all"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 p-1">
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        {/* Category Filters */}
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            {categories.map((cat) => {
                                const Icon = cat.icon;
                                const isActive = filter === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setFilter(cat.id)}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all border-2 ${isActive
                                            ? 'bg-black text-white border-black shadow-lg shadow-black/20'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900 hover:bg-slate-50'
                                            }`}
                                    >
                                        <Icon size={16} />
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Posts Grid */}
            <section className="pb-20 px-6">
                <div className="container mx-auto max-w-6xl">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[...Array(8)].map((_, i) => <PostSkeleton key={i} />)}
                        </div>
                    ) : filteredPosts.length > 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                        >
                            {filteredPosts.map((post, index) => (
                                <motion.div
                                    key={post._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.05 }}
                                >
                                    <PostCard
                                        post={post}
                                        currentUserId={user?._id}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-20"
                        >
                            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
                                <Package className="text-slate-400 w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">No listings found</h3>
                            <p className="text-slate-500 text-lg mb-8">Try adjusting your filters or search terms</p>
                            <button
                                onClick={() => { setSearchTerm(''); setFilter('all'); }}
                                className="px-6 py-3 bg-black text-white rounded-full text-sm font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-black/20"
                            >
                                Clear Filters
                            </button>
                        </motion.div>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-100 py-12 px-6 bg-slate-50">
                <div className="container mx-auto max-w-6xl text-center">
                    <p className="text-slate-500 text-sm">
                        © 2024 MyCircle. Building connections in your community.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Feed;