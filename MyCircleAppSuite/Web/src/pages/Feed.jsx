import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, Plus, Users, MapPin, Sparkles, ArrowRight, ShieldCheck, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import PostCard from '../components/ui/PostCard';
import PostSkeleton from '../components/ui/PostSkeleton';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getAvatarUrl } from '../utils/avatar';
import { cn } from '../utils/cn';

const CATEGORIES = [
    { id: 'all', label: 'All Listings' },
    { id: 'sell', label: 'For Sale' },
    { id: 'service', label: 'Services' },
    { id: 'hire', label: 'Hiring' },
    { id: 'rent', label: 'Rentals' },
    { id: 'barter', label: 'Barter' },
    { id: 'request', label: 'Requests' },
];

const SORT_OPTIONS = [
    { id: 'latest', label: 'Newest' },
    { id: 'oldest', label: 'Oldest' },
];

const PEOPLE_SORT_OPTIONS = [
    { id: 'relevance', label: 'Relevance' },
    { id: 'rating', label: 'Top Rated' },
    { id: 'endorsements', label: 'Endorsed' },
];

const PersonCard = ({ person }) => {
    const skills = Array.isArray(person.skills) ? person.skills.slice(0, 4) : [];

    return (
        <Link
            to={`/profile?userId=${person._id}`}
            className="group flex flex-col rounded-2xl border border-card-border bg-card p-4 transition-all duration-200 hover:border-card-border-hover hover:shadow-sm"
        >
            <div className="flex items-center gap-3">
                <img
                    src={getAvatarUrl(person)}
                    alt={person.displayName || 'User'}
                    className="h-11 w-11 rounded-full object-cover border border-card-border"
                />
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {person.displayName || 'User'}
                    </p>
                    <p className="inline-flex items-center gap-1 text-[11px] text-foreground-muted">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{person.location || 'Location not set'}</span>
                    </p>
                </div>
            </div>

            {person.bio && (
                <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-foreground-muted">{person.bio}</p>
            )}

            {skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                    {skills.map((skill) => {
                        const name = typeof skill === 'string' ? skill : skill?.name;
                        if (!name) return null;
                        return (
                            <span
                                key={name}
                                className="rounded-md border border-card-border/80 bg-background-secondary px-2 py-0.5 text-[10px] font-medium text-foreground-muted"
                            >
                                {name}
                            </span>
                        );
                    })}
                </div>
            )}

            <div className="mt-auto flex items-center justify-between pt-3 border-t border-card-border/60 text-[11px] text-foreground-muted">
                <div className="flex items-center gap-1 text-primary font-semibold">
                    <Star className="h-3 w-3 fill-primary" />
                    <span>{person.rating > 0 ? Number(person.rating).toFixed(1) : 'New'}</span>
                </div>
                {person.stats?.followersCount > 0 && (
                    <span>{person.stats.followersCount} followers</span>
                )}
            </div>
        </Link>
    );
};

const Feed = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [tab, setTab] = useState('posts');

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [category, setCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sort, setSort] = useState('latest');
    const [showFilters, setShowFilters] = useState(false);

    const [people, setPeople] = useState([]);
    const [peopleLoading, setPeopleLoading] = useState(false);
    const [peopleError, setPeopleError] = useState('');
    const [skillTerm, setSkillTerm] = useState('');
    const [peopleSort, setPeopleSort] = useState('relevance');

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

    const fetchPeople = useCallback(async () => {
        setPeopleLoading(true);
        setPeopleError('');
        try {
            const params = {
                ...(skillTerm.trim() ? { skill: skillTerm.trim() } : {}),
                ...(peopleSort !== 'relevance' ? { sort: peopleSort } : {}),
            };
            const res = await api.get('/user/services', { params });
            setPeople(Array.isArray(res.data) ? res.data : []);
        } catch {
            setPeopleError('Could not load community members.');
            setPeople([]);
        } finally {
            setPeopleLoading(false);
        }
    }, [peopleSort, skillTerm]);

    useEffect(() => {
        const timer = window.setTimeout(fetchPosts, 200);
        return () => window.clearTimeout(timer);
    }, [fetchPosts]);

    useEffect(() => {
        if (tab !== 'people') return undefined;
        const timer = window.setTimeout(fetchPeople, 200);
        return () => window.clearTimeout(timer);
    }, [tab, fetchPeople]);

    useEffect(() => {
        if (!socket) return undefined;
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
        <div className="col-span-full rounded-2xl border border-dashed border-card-border p-12 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Plus className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">No listings found</p>
            <p className="mt-1 text-xs text-foreground-muted max-w-sm mx-auto">
                Be the first in your circle to list an item, offer a service, or post a request.
            </p>
            <Link to="/create-post" className="mt-4 inline-block">
                <Button size="sm" className="gap-1.5 text-xs font-semibold">
                    <Plus className="h-3.5 w-3.5" />
                    Create a post
                </Button>
            </Link>
        </div>
    ), []);

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8 space-y-5">
                {/* Header & View Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">Marketplace</h1>
                        <p className="text-xs text-foreground-muted">
                            Explore verified items, local skills, and community peers.
                        </p>
                    </div>

                    <div className="flex items-center gap-1 self-start sm:self-auto bg-secondary/70 border border-card-border/60 p-1 rounded-xl">
                        {[
                            { id: 'posts', label: 'Listings' },
                            { id: 'people', label: 'People' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setTab(item.id)}
                                className={cn(
                                    'rounded-lg px-3.5 py-1 text-xs font-medium transition-all duration-150',
                                    tab === item.id
                                        ? 'bg-card text-foreground font-semibold shadow-sm border border-card-border/80'
                                        : 'text-foreground-muted hover:text-foreground'
                                )}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {tab === 'posts' ? (
                    <>
                        {/* Search and Filters */}
                        <div className="flex flex-col sm:flex-row items-center gap-2.5">
                            <div className="relative flex-1 w-full">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
                                <input
                                    type="search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search listings, keywords, items, services..."
                                    className="w-full h-9 rounded-xl border border-input-border bg-card px-3 pl-8 text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                                    aria-label="Search listings"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowFilters((v) => !v)}
                                className={cn(
                                    'h-9 px-3.5 inline-flex items-center gap-1.5 rounded-xl border text-xs font-medium transition-colors shrink-0 w-full sm:w-auto justify-center',
                                    showFilters
                                        ? 'border-primary/40 bg-primary/10 text-primary'
                                        : 'border-card-border bg-card text-foreground-muted hover:text-foreground hover:bg-card-hover'
                                )}
                                aria-expanded={showFilters}
                            >
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                                <span>Filter &amp; Sort</span>
                            </button>
                        </div>

                        {/* Filter Drawer */}
                        {showFilters && (
                            <div className="rounded-xl border border-card-border bg-card/60 p-3 flex flex-wrap items-center gap-2 text-xs">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted mr-1">Sort:</span>
                                {SORT_OPTIONS.map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setSort(option.id)}
                                        className={cn(
                                            'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                                            sort === option.id
                                                ? 'bg-secondary text-foreground font-semibold border border-card-border'
                                                : 'text-foreground-muted hover:text-foreground hover:bg-card-hover'
                                        )}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Category Chips */}
                        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                            {CATEGORIES.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setCategory(item.id)}
                                    className={cn(
                                        'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150',
                                        category === item.id
                                            ? 'border-primary bg-primary text-primary-foreground font-semibold shadow-xs'
                                            : 'border-card-border bg-card text-foreground-muted hover:border-card-border-hover hover:text-foreground'
                                    )}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        {error && (
                            <div className="rounded-xl border border-error/30 bg-error/10 px-3.5 py-2.5 text-xs text-error">
                                {error}
                            </div>
                        )}

                        {/* Listings Grid */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {loading
                                ? Array.from({ length: 8 }).map((_, i) => <PostSkeleton key={i} />)
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
                    </>
                ) : (
                    <>
                        {/* People Tab */}
                        <div className="flex flex-col sm:flex-row items-center gap-2.5">
                            <div className="relative flex-1 w-full">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
                                <input
                                    type="search"
                                    value={skillTerm}
                                    onChange={(e) => setSkillTerm(e.target.value)}
                                    placeholder="Search people by skill (e.g. Photography, React, Tutoring)..."
                                    className="w-full h-9 rounded-xl border border-input-border bg-card px-3 pl-8 text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                                    aria-label="Search people by skill"
                                />
                            </div>
                            <div className="flex items-center gap-1 self-start sm:self-auto">
                                {PEOPLE_SORT_OPTIONS.map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setPeopleSort(option.id)}
                                        className={cn(
                                            'h-9 rounded-xl px-3 py-1 text-xs font-medium transition-colors border',
                                            peopleSort === option.id
                                                ? 'bg-secondary border-card-border text-foreground font-semibold'
                                                : 'border-card-border bg-card text-foreground-muted hover:text-foreground hover:bg-card-hover'
                                        )}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {peopleError && (
                            <div className="rounded-xl border border-error/30 bg-error/10 px-3.5 py-2.5 text-xs text-error">
                                {peopleError}
                            </div>
                        )}

                        {peopleLoading ? (
                            <div className="flex justify-center py-16">
                                <Loading text="Finding community peers..." />
                            </div>
                        ) : people.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-card-border p-12 text-center">
                                <Users className="mx-auto mb-3 h-8 w-8 text-foreground-muted/40" />
                                <p className="text-sm font-semibold text-foreground">No peers found</p>
                                <p className="mt-1 text-xs text-foreground-muted">
                                    Try searching for a different skill or clear filters.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                                {people.map((person) => (
                                    <PersonCard key={person._id} person={person} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Feed;
