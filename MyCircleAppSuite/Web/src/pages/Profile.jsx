import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, MapPin, Pencil, LogOut, Mail } from 'lucide-react';
import api from '../utils/api';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import PostCard from '../components/ui/PostCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { getAvatarUrl } from '../utils/avatar';

const Stat = ({ label, value }) => (
    <div className="rounded-xl border border-card-border bg-card px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{label}</p>
        <p className="mt-1 text-lg font-semibold text-foreground">{value ?? 0}</p>
    </div>
);

const Profile = () => {
    const { user: authUser, logout } = useAuth();
    const { error: showError } = useToast();
    const location = useLocation();
    const navigate = useNavigate();

    const userId = new URLSearchParams(location.search).get('userId');
    const isOwnProfile = !userId || userId === authUser?._id;

    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        const load = async () => {
            setLoading(true);
            try {
                const profileReq = isOwnProfile
                    ? api.get('/user/profile')
                    : api.get(`/user/${userId}`);
                const postsReq = api.get('/posts', {
                    params: { userId: isOwnProfile ? authUser?._id : userId, limit: 50 },
                });

                const [profileRes, postsRes] = await Promise.all([profileReq, postsReq]);
                if (!active) return;

                setProfile(profileRes.data);
                setPosts(Array.isArray(postsRes.data) ? postsRes.data : postsRes.data?.posts || []);
            } catch {
                if (!active) return;
                showError('Could not load this profile.');
            } finally {
                if (active) setLoading(false);
            }
        };

        if (authUser) load();

        return () => {
            active = false;
        };
    }, [authUser, isOwnProfile, userId, showError]);

    const joined = useMemo(() => {
        if (!profile?.createdAt) return '—';
        return new Date(profile.createdAt).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
        });
    }, [profile?.createdAt]);

    if (loading) {
        return <Loading fullscreen text="Loading profile..." />;
    }

    if (!profile) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-16 text-center">
                <p className="text-sm text-foreground-muted">Profile not found.</p>
                <Button className="mt-4" variant="outline" onClick={() => navigate(-1)}>
                    Go back
                </Button>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
            <section className="rounded-2xl border border-card-border bg-card p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <img
                        src={getAvatarUrl(profile)}
                        alt={profile.displayName || 'Profile'}
                        className="h-20 w-20 rounded-full object-cover ring-2 ring-background"
                    />

                    <div className="min-w-0 flex-1">
                        <h1 className="truncate text-xl font-semibold text-foreground">
                            {profile.displayName || 'User'}
                        </h1>
                        {profile.email && (
                            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-foreground-muted">
                                <Mail className="h-3.5 w-3.5" />
                                {profile.email}
                            </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground-muted">
                            <span className="inline-flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5" />
                                {profile.location || 'Location not set'}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="h-3.5 w-3.5" />
                                Joined {joined}
                            </span>
                        </div>
                    </div>

                    {isOwnProfile && (
                        <div className="flex items-center gap-2">
                            <Link to="/edit-profile">
                                <Button variant="outline" size="sm">
                                    <Pencil className="mr-1.5 h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    logout();
                                    navigate('/login', { replace: true });
                                }}
                                className="text-error hover:bg-error/10 hover:text-error"
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>

                {profile.bio && (
                    <p className="mt-5 border-t border-card-border pt-4 text-sm leading-relaxed text-foreground-secondary">
                        {profile.bio}
                    </p>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Stat label="Posts" value={posts.length} />
                    <Stat label="Followers" value={profile.stats?.followers ?? profile.followers?.length ?? 0} />
                    <Stat label="Following" value={profile.stats?.following ?? profile.following?.length ?? 0} />
                    <Stat label="Trust" value={profile.trustScore ?? '—'} />
                </div>

                {profile.skills?.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                        {profile.skills.map((skill) => (
                            <span
                                key={typeof skill === 'string' ? skill : skill.name || skill._id}
                                className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                            >
                                {typeof skill === 'string' ? skill : skill.name}
                            </span>
                        ))}
                    </div>
                )}
            </section>

            <section className="mt-6">
                <h2 className="mb-3 text-sm font-semibold text-foreground">
                    {isOwnProfile ? 'Your posts' : 'Posts'}
                </h2>

                {posts.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-card-border px-6 py-12 text-center">
                        <p className="text-sm text-foreground-muted">
                            {isOwnProfile ? 'You have not posted anything yet.' : 'No posts yet.'}
                        </p>
                        {isOwnProfile && (
                            <Link to="/create-post" className="mt-4 inline-block">
                                <Button size="sm">Create your first post</Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {posts.map((post) => (
                            <PostCard
                                key={post._id}
                                post={post}
                                currentUserId={authUser?._id}
                                isOwnPost={isOwnProfile}
                                onEdit={() => navigate(`/edit-post/${post._id}`)}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Profile;
