import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import PostCard from '../components/ui/PostCard';
import PostSkeleton from '../components/ui/PostSkeleton';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { cn } from '../utils/cn';

const CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'service', label: 'Services' },
    { id: 'hire', label: 'Hiring' },
    { id: 'trade', label: 'Trade' },
    { id: 'rent', label: 'Rent' },
];

const SORT_OPTIONS = [
    { id: 'latest', label: 'Newest' },
    { id: 'oldest', label: 'Oldest' },
];

const Feed = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [category, setCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sort, setSort] = useState('latest');
    const [showFilters, setShowFilters] = useState(false);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = {
                limit: 50,
                sort,
                ...(category !== 'all' ? { type: category } : {}),
                ...(searchTerm.trim() ? { q: searchTerm.trim() } : {}),
            };
            const res = await api.get('/posts', { params });
            setPosts(Array.isArray(res.data) ? res.data : res.data?.posts || []);
        } catch {
            setError('Could not load posts. Please try again.');
            setPosts([]);
        } finally {
            setLoading(false);
        }
    }, [category, searchTerm, sort]);

    useEffect(() => {
        const timer = window.setTimeout(fetchPosts, 250);
        return () => window.clearTimeout(timer);
    }, [fetchPosts]);

    useEffect(() => {
        if (!socket) return;
        const refresh = () => fetchPosts();
        socket.on('new_post', refresh);
        socket.on('post_updated', refresh);
        return () => {
            socket.off('new_post', refresh);
            socket.off('post_updated', refresh);
        };
    }, [socket, fetchPosts]);

    const hasPosts = posts.length > 0;

    const emptyState = useMemo(() => (
        <div className="col-span-full rounded-2xl border border-dashed border-card-border px-6 py-16 text-center">
            <p className="text-sm font-medium text-foreground">No posts yet</p>
            <p className="mt-1 text-sm text-foreground-muted">
                Be the first to offer a service, hire someone, or trade an item.
            </p>
            <Link to="/create-post" className="mt-4 inline-block">
                <Button size="sm">
                    <Plus className="mr-1.5 h-4 w-4" />
                    Create a post
                </Button>
            </Link>
        </div>
    ), []);

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
                <header className="mb-6">
                    <h1 className="text-2xl font-semibold text-foreground">Explore</h1>
                    <p className="mt-1 text-sm text-foreground-muted">
                        Discover services, opportunities, and items near you.
                    </p>
                </header>

                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search posts, services, items..."
                            className="input-modern pl-9"
                            aria-label="Search posts"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowFilters((v) => !v)}
                        className={cn(
                            'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors',
                            showFilters
                                ? 'border-primary/40 bg-primary/10 text-primary'
                                : 'border-card-border text-foreground-muted hover:text-foreground'
                        )}
                        aria-expanded={showFilters}
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters
                    </button>
                </div>

                {showFilters && (
                    <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-card-border bg-card p-3">
                        <span className="mr-1 text-xs font-medium text-foreground-muted">Sort</span>
                        {SORT_OPTIONS.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => setSort(option.id)}
                                className={cn(
                                    'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                                    sort === option.id
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-foreground-muted hover:bg-card-hover hover:text-foreground'
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}

                <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {CATEGORIES.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setCategory(item.id)}
                            className={cn(
                                'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                                category === item.id
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-card-border text-foreground-muted hover:border-card-border-hover hover:text-foreground'
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="mb-4 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {loading
                        ? Array.from({ length: 6 }).map((_, i) => <PostSkeleton key={i} />)
                        : hasPosts
                            ? posts.map((post) => (
                                <PostCard
                                    key={post._id}
                                    post={post}
                                    currentUserId={user?._id}
                                />
                            ))
                            : emptyState}
                </div>
            </div>
        </div>
    );
};

export default Feed;
