import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useToast } from '../components/ui/Toast';
import { useDialog } from '../hooks/useDialog';
import PostCard from '../components/ui/PostCard';
import Button from '../components/ui/Button';
import { Plus, Filter, LayoutGrid, List as ListIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyPosts = () => {
    const { success, error: showError } = useToast();
    const dialog = useDialog();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, active, inactive, sold
    const [viewMode, setViewMode] = useState('grid'); // grid, list

    useEffect(() => {
        fetchMyPosts();
    }, []);

    const fetchMyPosts = async () => {
        try {
            console.log("MyPosts: Fetching from /posts/my-posts");
            const res = await api.get('/posts/my-posts');
            console.log("MyPosts: Data received:", res.data);
            setPosts(res.data);
            setLoading(false);
        } catch (err) {
            console.error("MyPosts: Error:", err);
            showError('Failed to fetch your posts');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (postId, newStatus) => {
        try {
            await api.patch(`/posts/${postId}/status`, { status: newStatus });
            fetchMyPosts(); // Refresh list
        } catch (err) {
            console.error(err);
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

    if (loading) return <div className="text-white text-center py-20">Loading posts...</div>;

    return (
        <div className="container mx-auto px-6 py-24 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-heading mb-2">My Posts</h1>
                    <p className="text-text-muted">Manage your listings and services</p>
                </div>
            </div>

            {/* Filters & Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-card p-4 rounded-xl border border-card-border mb-8 gap-4 shadow-card">
                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                    {['all', 'active', 'inactive', 'sold'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-black uppercase tracking-widest transition-all
                                ${filter === f ? 'bg-primary text-primary-foreground shadow-button' : 'text-text-muted hover:text-text-heading hover:bg-hover-bg'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-text-muted hover:text-text-heading hover:bg-hover-bg'}`}
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-text-muted hover:text-text-heading hover:bg-hover-bg'}`}
                    >
                        <ListIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Posts Grid/List */}
            {filteredPosts.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-2xl border border-card-border border-dashed shadow-card">
                    <Filter className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-text-heading mb-2">No posts found</h3>
                    <p className="text-text-muted mb-6">You haven't created any posts with this status yet.</p>
                </div>
            ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                    {filteredPosts.map(post => (
                        <PostCard
                            key={post._id}
                            post={post}
                            isOwnPost={true}
                            onStatusChange={(newStatus) => handleStatusChange(post._id, newStatus)}
                            onDelete={() => handleDelete(post._id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyPosts;
