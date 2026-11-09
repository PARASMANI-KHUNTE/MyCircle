import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    CalendarDays, MapPin, Pencil, LogOut, Mail, UserPlus, UserMinus, ThumbsUp,
} from 'lucide-react';
import api from '../utils/api';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import PostCard from '../components/ui/PostCard';
import Dialog from '../components/ui/Dialog';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { getAvatarUrl } from '../utils/avatar';
import { cn } from '../utils/cn';

const Stat = ({ label, value, onClick }) => {
    const content = (
        <>
            <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{label}</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{value ?? 0}</p>
        </>
    );

    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                className="rounded-xl border border-card-border bg-card px-4 py-3 text-left transition-colors hover:border-card-border-hover hover:bg-card-hover"
            >
                {content}
            </button>
        );
    }

    return <div className="rounded-xl border border-card-border bg-card px-4 py-3">{content}</div>;
};

const normalizeSkill = (skill) => (typeof skill === 'string' ? skill : skill?.name || '');

const Profile = () => {
    const { user: authUser, logout } = useAuth();
    const { success, error: showError } = useToast();
    const location = useLocation();
    const navigate = useNavigate();

    const userId = new URLSearchParams(location.search).get('userId');
    const isOwnProfile = !userId || userId === authUser?._id;

    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [followLoading, setFollowLoading] = useState(false);
    const [endorsingSkill, setEndorsingSkill] = useState(null);
    const [listModal, setListModal] = useState(null);
    const [listUsers, setListUsers] = useState([]);
    const [listLoading, setListLoading] = useState(false);

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
                // Recalculate authoritative counters for the signed-in user.
                const statsReq = isOwnProfile ? api.get('/user/stats') : Promise.resolve(null);

                const [profileRes, postsRes, statsRes] = await Promise.all([profileReq, postsReq, statsReq]);
                if (!active) return;

                const profileData = { ...profileRes.data };
                if (statsRes?.data?.stats) {
                    profileData.stats = { ...profileData.stats, ...statsRes.data.stats };
                }

                setProfile(profileData);
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
        // Intentionally exclude showError: it is recreated by ToastProvider
        // and including it would re-run the fetch after every toast.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authUser, isOwnProfile, userId]);

    useEffect(() => {
        if (!listModal) return undefined;
        let active = true;

        const loadList = async () => {
            setListLoading(true);
            try {
                const targetId = isOwnProfile ? authUser?._id : userId;
                const res = await api.get(`/user/${targetId}/${listModal}`);
                if (active) setListUsers(Array.isArray(res.data) ? res.data : []);
            } catch {
                if (active) {
                    setListUsers([]);
                    showError('Could not load this list.');
                }
            } finally {
                if (active) setListLoading(false);
            }
        };

        void loadList();
        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listModal]);

    const joined = useMemo(() => {
        if (!profile?.createdAt) return '—';
        return new Date(profile.createdAt).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
        });
    }, [profile]);

    const isFollowing = useMemo(() => {
        if (!authUser?._id || !profile?.followers) return false;
        return profile.followers.some((id) => String(id?._id || id) === String(authUser._id));
    }, [authUser, profile]);

    const endorsementMap = useMemo(() => {
        const map = new Map();
        (profile?.skillEndorsements || []).forEach((entry) => {
            if (entry?.skill) map.set(entry.skill.toLowerCase(), entry);
        });
        return map;
    }, [profile?.skillEndorsements]);

    const handleFollowToggle = async () => {
        if (!authUser) {
            navigate('/login');
            return;
        }
        setFollowLoading(true);
        try {
            if (isFollowing) {
                await api.delete(`/user/follow/${userId}`);
            } else {
                await api.post(`/user/follow/${userId}`);
            }

            setProfile((prev) => {
                if (!prev) return prev;
                const followers = prev.followers || [];
                const nextFollowers = isFollowing
                    ? followers.filter((id) => String(id?._id || id) !== String(authUser._id))
                    : [...followers, authUser._id];
                const baseCount = prev.stats?.followersCount ?? followers.length;
                return {
                    ...prev,
                    followers: nextFollowers,
                    stats: {
                        ...prev.stats,
                        followersCount: Math.max(0, baseCount + (isFollowing ? -1 : 1)),
                    },
                };
            });

            success(isFollowing ? 'Unfollowed.' : 'Now following.');
        } catch (err) {
            showError(err.response?.data?.msg || 'Could not update follow status.');
        } finally {
            setFollowLoading(false);
        }
    };

    const handleEndorse = async (skill) => {
        if (!authUser) {
            navigate('/login');
            return;
        }
        setEndorsingSkill(skill);
        try {
            const res = await api.post(`/user/endorse/${userId}`, { skill });
            const updated = res.data?.skillEndorsements;
            if (updated) {
                setProfile((prev) => (prev ? { ...prev, skillEndorsements: updated } : prev));
            }
            success(`Endorsed ${skill}.`);
        } catch (err) {
            showError(err.response?.data?.msg || 'Could not endorse this skill.');
        } finally {
            setEndorsingSkill(null);
        }
    };

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

    const followersCount = profile.stats?.followersCount ?? profile.followers?.length ?? 0;
    const followingCount = profile.stats?.followingCount ?? profile.following?.length ?? 0;
    const trustScore = profile.reputation?.trustScore ?? profile.trustScore;

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

                    {isOwnProfile ? (
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
                    ) : (
                        <Button
                            variant={isFollowing ? 'outline' : 'primary'}
                            size="sm"
                            onClick={handleFollowToggle}
                            loading={followLoading}
                        >
                            {isFollowing ? (
                                <>
                                    <UserMinus className="mr-1.5 h-4 w-4" />
                                    Following
                                </>
                            ) : (
                                <>
                                    <UserPlus className="mr-1.5 h-4 w-4" />
                                    Follow
                                </>
                            )}
                        </Button>
                    )}
                </div>

                {profile.bio && (
                    <p className="mt-5 border-t border-card-border pt-4 text-sm leading-relaxed text-foreground-secondary">
                        {profile.bio}
                    </p>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Stat label="Posts" value={profile.stats?.totalPosts ?? posts.length} />
                    <Stat
                        label="Followers"
                        value={followersCount}
                        onClick={() => setListModal('followers')}
                    />
                    <Stat
                        label="Following"
                        value={followingCount}
                        onClick={() => setListModal('following')}
                    />
                    <Stat label="Trust" value={trustScore ?? '—'} />
                </div>

                {profile.skills?.length > 0 && (
                    <div className="mt-5 space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                            Skills
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {profile.skills.map((skill, index) => {
                                const name = normalizeSkill(skill);
                                if (!name) return null;
                                const endorsement = endorsementMap.get(name.toLowerCase());
                                const count = endorsement?.count || 0;
                                const alreadyEndorsed = (endorsement?.endorsedBy || []).some(
                                    (id) => String(id?._id || id) === String(authUser?._id)
                                );
                                const canEndorse = !isOwnProfile && !!authUser && !alreadyEndorsed;

                                return (
                                    <span
                                        key={`${name}-${index}`}
                                        className="inline-flex items-center gap-2 rounded-full border border-card-border bg-background-secondary py-1 pl-3 pr-1.5 text-xs font-medium text-foreground"
                                    >
                                        <span>{name}</span>
                                        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                            {count}
                                        </span>
                                        {canEndorse && (
                                            <button
                                                type="button"
                                                onClick={() => handleEndorse(name)}
                                                disabled={endorsingSkill === name}
                                                className={cn(
                                                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/10',
                                                    endorsingSkill === name && 'opacity-60'
                                                )}
                                            >
                                                <ThumbsUp className="h-3 w-3" />
                                                Endorse
                                            </button>
                                        )}
                                    </span>
                                );
                            })}
                        </div>
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

            <Dialog
                isOpen={!!listModal}
                onClose={() => setListModal(null)}
                title={listModal === 'followers' ? 'Followers' : 'Following'}
                size="sm"
            >
                {listLoading ? (
                    <div className="flex justify-center py-8">
                        <Loading text="Loading..." />
                    </div>
                ) : listUsers.length === 0 ? (
                    <p className="py-6 text-center text-sm text-foreground-muted">
                        {listModal === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
                    </p>
                ) : (
                    <ul className="max-h-80 space-y-1 overflow-y-auto">
                        {listUsers.map((person) => (
                            <li key={person._id}>
                                <Link
                                    to={`/profile?userId=${person._id}`}
                                    onClick={() => setListModal(null)}
                                    className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-card-hover"
                                >
                                    <img
                                        src={getAvatarUrl(person)}
                                        alt={person.displayName || 'User'}
                                        className="h-9 w-9 rounded-full object-cover"
                                    />
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-foreground">
                                            {person.displayName || 'User'}
                                        </p>
                                        {person.bio && (
                                            <p className="truncate text-xs text-foreground-muted">{person.bio}</p>
                                        )}
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </Dialog>
        </div>
    );
};

export default Profile;
