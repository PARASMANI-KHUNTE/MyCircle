import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useToast } from '../components/ui/Toast';
import PostCard from '../components/ui/PostCard';
import PostSkeleton from '../components/ui/PostSkeleton';
import { useAuth } from '../context/AuthContext';
import {
    Package, Grid3x3, List,
    Home as HomeIcon
} from 'lucide-react';

const DashboardHome = ({ onViewPost }) => {
    const { user } = useAuth();
    const { success, error: showError } = useToast();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

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

    const handleCreateContactRequest = async (postId, e) => {
        e.stopPropagation();
        if (!user) return;
        try {
            await api.post(`/requests/${postId}`);
            success('Contact request sent!');
        } catch (err) {
            showError(err.response?.data?.msg || 'Failed to send request');
        }
    };



    const filteredPosts = filter === 'all'
        ? posts
        : posts.filter(post => post.type === filter);

    const categories = [
        { id: 'all', label: 'All' },
        { id: 'job', label: 'Jobs' },
        { id: 'service', label: 'Services' },
        { id: 'sell', label: 'Buy/Sell' },
        { id: 'rent', label: 'Rentals' },
    ];

    return (
        <div className="space-y-8">




            {/* Filter Bar - Modern Segmented Control */}
            <div className="flex items-center justify-between">
                <div className="inline-flex items-center bg-slate-100 rounded-lg p-1 gap-1">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setFilter(cat.id)}
                            className={`px-5 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 ${filter === cat.id
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    {/* Item Count */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-sm font-medium text-slate-600">{filteredPosts.length} items</span>
                    </div>

                    {/* View Toggle */}
                    <div className="inline-flex items-center bg-slate-100 rounded-lg p-1 gap-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'grid'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                            title="Grid View"
                        >
                            <Grid3x3 size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'list'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                            title="List View"
                        >
                            <List size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Posts Grid */}
            <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Package size={20} className="text-teal-600" />
                    All Listings
                </h2>

                {loading ? (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                        {[1, 2, 3, 4, 5, 6].map(i => <PostSkeleton key={i} />)}
                    </div>
                ) : filteredPosts.length > 0 ? (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr' : 'space-y-4'}>
                        {filteredPosts.map(post => (
                            <div key={post._id} className={viewMode === 'grid' ? 'h-full' : ''}>
                                <PostCard
                                    post={post}
                                    currentUserId={user?._id}
                                    onRequestContact={handleCreateContactRequest}
                                    onClick={onViewPost}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 mx-auto">
                            <HomeIcon className="text-slate-300" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No listings found</h3>
                        <p className="text-slate-500 text-sm">
                            Try adjusting your filters or check back later for new content.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardHome;
