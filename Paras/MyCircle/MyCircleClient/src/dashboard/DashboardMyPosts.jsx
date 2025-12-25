import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useToast } from '../components/ui/Toast';
import { useDialog } from '../hooks/useDialog';
import PostCard from '../components/ui/PostCard';
import PostSkeleton from '../components/ui/PostSkeleton';
import { Filter, LayoutGrid, List as ListIcon, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DashboardMyPosts = ({ onViewPost }) => {
    const { user } = useAuth();
    const { success, error: showError } = useToast();
    const dialog = useDialog();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [viewMode, setViewMode] = useState('grid');

    useEffect(() => {
        if (user) fetchMyPosts();
    }, [user]);

    const fetchMyPosts = async () => {
        try {
            const res = await api.get('/posts/my-posts');
            setPosts(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleStatusChange = async (postId, newStatus) => {
        try {
            await api.patch(`/posts/${postId}/status`, { status: newStatus });
            fetchMyPosts();
            success(`Post status updated to ${newStatus}`);
        } catch (err) {
            console.error(err);
            showError('Failed to update post status');
        }
    };

    const handleDelete = async (postId) => {
        const confirmed = await dialog.confirm('Are you sure you want to delete this post?', 'Delete Post');
        if (!confirmed) return;

        try {
            await api.delete(`/posts/${postId}`);
            setPosts(posts.filter(p => p._id !== postId));
            success('Post deleted successfully!');
        } catch (err) {
            console.error(err);
            showError('Failed to delete post.');
        }
    };

    const filteredPosts = posts.filter(post => {
        if (filter === 'all') return true;
        if (filter === 'active') return post.status === 'active';
        if (filter === 'inactive') return post.status === 'inactive';
        if (filter === 'sold') return post.status === 'sold';
        return true;
    });

    const statusFilters = [
        { id: 'all', label: 'All', count: posts.length },
        { id: 'active', label: 'Active', count: posts.filter(p => p.status === 'active').length },
        { id: 'inactive', label: 'Inactive', count: posts.filter(p => p.status === 'inactive').length },
        { id: 'sold', label: 'Sold', count: posts.filter(p => p.status === 'sold').length }
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Posts</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage your listings and services</p>
                </div>
                <div className="text-sm text-slate-500">
                    <span className="font-semibold text-slate-900">{filteredPosts.length}</span> post{filteredPosts.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center justify-between">
                {/* Status Filters */}
                <div className="inline-flex items-center bg-slate-100 rounded-lg p-1 gap-1">
                    {statusFilters.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${filter === f.id
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            {f.label}
                            <span className="ml-1.5 text-xs opacity-60">({f.count})</span>
                        </button>
                    ))}
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
                        <LayoutGrid size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'list'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                            }`}
                        title="List View"
                    >
                        <ListIcon size={16} />
                    </button>
                </div>
            </div>

            {/* Posts Grid/List */}
            <div>
                {loading ? (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                        {[1, 2, 3, 4, 5, 6].map(i => <PostSkeleton key={i} />)}
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 mx-auto">
                            <Package className="text-slate-300" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No posts found</h3>
                        <p className="text-slate-500 text-sm">
                            {filter === 'all'
                                ? "You haven't created any posts yet."
                                : `You don't have any ${filter} posts.`}
                        </p>
                    </div>
                ) : (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr' : 'space-y-4'}>
                        {filteredPosts.map(post => (
                            <div key={post._id} className={viewMode === 'grid' ? 'h-full' : ''}>
                                <PostCard
                                    post={post}
                                    isOwnPost={true}
                                    currentUserId={user?._id}
                                    onStatusChange={(newStatus) => handleStatusChange(post._id, newStatus)}
                                    onDelete={() => handleDelete(post._id)}
                                    onClick={onViewPost}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardMyPosts;
