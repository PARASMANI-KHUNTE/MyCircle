import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Filter, Plus } from 'lucide-react';
import api from '../utils/api';
import { useToast } from '../components/ui/Toast';
import { useDialog } from '../hooks/useDialog';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/ui/PostCard';
import PostSkeleton from '../components/ui/PostSkeleton';
import Button from '../components/ui/Button';
import Dialog from '../components/ui/Dialog';
import Loading from '../components/ui/Loading';
import { cn } from '../utils/cn';

const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'inactive', label: 'Inactive' },
    { id: 'sold', label: 'Sold' },
];

const MyPosts = () => {
    const navigate = useNavigate();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const { success, error: showError } = useToast();
    const dialog = useDialog();

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [analyticsPost, setAnalyticsPost] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    const fetchMyPosts = useCallback(async () => {
        try {
            const res = await api.get('/posts/my-posts');
            setPosts(Array.isArray(res.data) ? res.data : res.data?.posts || []);
        } catch {
            showError('Failed to fetch your posts');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            void fetchMyPosts();
        }
    }, [authLoading, fetchMyPosts, isAuthenticated]);

    const handleDelete = async (post) => {
        const confirmed = await dialog.confirm('Are you sure you want to delete this post?', 'Delete Post');
        if (!confirmed) return;

        try {
            await api.delete(`/posts/${post._id}`);
            setPosts((prev) => prev.filter((p) => p._id !== post._id));
            success('Post deleted successfully!');
        } catch {
            showError('Failed to delete post.');
        }
    };

    const handleToggleStatus = async (post) => {
        try {
            const res = await api.patch(`/posts/${post._id}/toggle-status`);
            setPosts((prev) => prev.map((p) => (p._id === post._id ? { ...p, ...res.data } : p)));
            success(res.data?.isActive ? 'Post activated.' : 'Post paused.');
        } catch {
            showError('Could not update post status.');
        }
    };

    const handleAnalytics = async (post) => {
        setAnalyticsPost(post);
        setAnalytics(null);
        setAnalyticsLoading(true);
        try {
            const res = await api.get(`/posts/${post._id}/analytics`);
            setAnalytics(res.data);
        } catch {
            showError('Could not load analytics.');
            setAnalyticsPost(null);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const filteredPosts = posts.filter((post) => {
        if (filter === 'all') return true;
        return post.status === filter;
    });

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">My posts</h1>
                    <p className="mt-1 text-sm text-foreground-muted">
                        Manage everything you have posted.
                    </p>
                </div>
                <Link to="/create-post">
                    <Button size="sm">
                        <Plus className="mr-1.5 h-4 w-4" />
                        New post
                    </Button>
                </Link>
            </header>

            <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {FILTERS.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => setFilter(item.id)}
                        className={cn(
                            'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                            filter === item.id
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-card-border text-foreground-muted hover:border-card-border-hover hover:text-foreground'
                        )}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <PostSkeleton key={i} />
                    ))}
                </div>
            ) : filteredPosts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-card-border px-6 py-16 text-center">
                    <Filter className="mx-auto mb-3 h-8 w-8 text-foreground-muted/50" />
                    <p className="text-sm font-medium text-foreground">No posts found</p>
                    <p className="mt-1 text-sm text-foreground-muted">
                        You have not created any posts with this status yet.
                    </p>
                    <Link to="/create-post" className="mt-4 inline-block">
                        <Button size="sm">
                            <Plus className="mr-1.5 h-4 w-4" />
                            Create a post
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredPosts.map((post) => (
                        <PostCard
                            key={post._id}
                            post={post}
                            isOwnPost
                            onEdit={() => navigate(`/edit-post/${post._id}`)}
                            onDelete={handleDelete}
                            onToggleStatus={handleToggleStatus}
                            onAnalytics={handleAnalytics}
                        />
                    ))}
                </div>
            )}

            <Dialog
                isOpen={!!analyticsPost}
                onClose={() => setAnalyticsPost(null)}
                title="Post analytics"
                description={analyticsPost?.title}
                size="sm"
            >
                {analyticsLoading ? (
                    <div className="flex justify-center py-8">
                        <Loading text="Loading analytics..." />
                    </div>
                ) : analytics ? (
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Views', value: analytics.views ?? 0 },
                            { label: 'Likes', value: analytics.likes ?? 0 },
                            { label: 'Shares', value: analytics.shares ?? 0 },
                            { label: 'Days active', value: analytics.daysActive ?? 0 },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="rounded-xl border border-card-border bg-background-secondary px-4 py-3"
                            >
                                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                                    {item.label}
                                </p>
                                <p className="mt-1 text-lg font-semibold text-foreground">{item.value}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="py-6 text-center text-sm text-foreground-muted">
                        Analytics are unavailable for this post.
                    </p>
                )}
            </Dialog>
        </div>
    );
};

export default MyPosts;
