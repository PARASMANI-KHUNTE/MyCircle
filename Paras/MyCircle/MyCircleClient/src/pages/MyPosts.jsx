import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Button from '../components/ui/Button';
import { Edit, Trash2, Eye, MessageCircle, Plus } from 'lucide-react';

const MyPosts = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, active, inactive

    useEffect(() => {
        fetchMyPosts();
    }, []);

    const fetchMyPosts = async () => {
        try {
            const res = await api.get('/posts/my-posts');
            setPosts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (postId) => {
        try {
            const res = await api.patch(`/posts/${postId}/toggle-status`);
            // Update local state
            setPosts(posts.map(post =>
                post._id === postId ? res.data : post
            ));
        } catch (err) {
            console.error(err);
            alert('Failed to toggle post status');
        }
    };

    const handleDelete = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;

        try {
            await api.delete(`/posts/${postId}`);
            setPosts(posts.filter(post => post._id !== postId));
        } catch (err) {
            console.error(err);
            alert('Failed to delete post');
        }
    };

    const filteredPosts = posts.filter(post => {
        if (filter === 'active') return post.isActive;
        if (filter === 'inactive') return !post.isActive;
        return true;
    });

    const typeColors = {
        job: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        service: 'bg-green-500/10 text-green-400 border-green-500/20',
        sell: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        rent: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">My Posts</h1>
                    <p className="text-gray-400">Manage all your posts in one place</p>
                </div>
                <Button variant="primary" onClick={() => navigate('/create-post')}>
                    <Plus className="w-4 h-4" />
                    Create New Post
                </Button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-4 mb-8 border-b border-white/10 pb-4">
                {['all', 'active', 'inactive'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`text-sm font-medium transition-colors capitalize ${filter === f ? 'text-primary' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        {f} ({posts.filter(p => f === 'all' || (f === 'active' ? p.isActive : !p.isActive)).length})
                    </button>
                ))}
            </div>

            {/* Posts Grid */}
            {loading ? (
                <div className="text-white text-center py-20">Loading your posts...</div>
            ) : filteredPosts.length === 0 ? (
                <div className="text-center py-20">
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-xl font-bold text-white mb-2">No posts yet</h3>
                    <p className="text-gray-400 mb-6">Create your first post to get started!</p>
                    <Button variant="primary" onClick={() => navigate('/create-post')}>
                        <Plus className="w-4 h-4" />
                        Create Post
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPosts.map((post) => (
                        <motion.div
                            key={post._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`glass rounded-2xl p-6 ${!post.isActive ? 'opacity-60' : ''
                                }`}
                        >
                            {/* Post Header */}
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${typeColors[post.type]}`}>
                                    {post.type.toUpperCase()}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs ${post.isActive
                                    ? 'bg-green-500/10 text-green-400'
                                    : 'bg-gray-500/10 text-gray-400'
                                    }`}>
                                    {post.isActive ? 'Active' : 'Inactive'}
                                </span>
                                {post.acceptsBarter && (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium border bg-pink-500/10 text-pink-400 border-pink-500/20">
                                        Barter
                                    </span>
                                )}
                            </div>

                            {/* Post Content */}
                            <h3 className="font-semibold text-white text-lg mb-2 line-clamp-2">
                                {post.title}
                            </h3>
                            <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                                {post.description}
                            </p>

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                                <div className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {post.views || 0} views
                                </div>
                                <div className="flex items-center gap-1">
                                    <MessageCircle className="w-3 h-3" />
                                    0 contacts
                                </div>
                            </div>

                            {/* Price */}
                            {post.price && (
                                <div className="text-lg font-bold text-white mb-4">
                                    ₹{post.price}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-4 border-t border-white/10">
                                <Button
                                    variant="outline"
                                    className="flex-1 text-xs"
                                    onClick={() => navigate(`/post/${post._id}`)}
                                >
                                    <Eye className="w-3 h-3" />
                                    View
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 text-xs"
                                    onClick={() => handleToggleStatus(post._id)}
                                >
                                    {post.isActive ? 'Disable' : 'Enable'}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="text-xs text-red-400 hover:bg-red-500/10"
                                    onClick={() => handleDelete(post._id)}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyPosts;
