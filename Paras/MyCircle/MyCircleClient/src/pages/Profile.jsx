import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
    MapPin, Calendar, Edit2, Settings, LogOut,
    Plus, LayoutGrid, Package, Mail
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import LoginRequired from '../components/LoginRequired';
import PostCard from '../components/ui/PostCard';
import PostSkeleton from '../components/ui/PostSkeleton';
import { getAvatarUrl } from '../utils/avatar';

const Profile = () => {
    const { user: authUser, logout } = useAuth();
    const [profile, setProfile] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [posts, setPosts] = React.useState([]);
    const [postsLoading, setPostsLoading] = React.useState(true);
    const { success, error: showError } = useToast();
    const location = useLocation();
    const navigate = useNavigate();

    // Determine target user (Self vs Other)
    const queryParams = new URLSearchParams(location.search);
    const userId = queryParams.get('userId');
    const isOwnProfile = !userId || userId === authUser?._id;

    // --- Data Fetching ---
    React.useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const endpoint = isOwnProfile ? '/user/profile' : `/user/${userId}`;
                const res = await api.get(endpoint);

                // Fetch extra stats if own profile
                let statsRes = { data: { stats: res.data.stats || {} } };
                if (isOwnProfile) {
                    try {
                        statsRes = await api.get('/user/stats');
                    } catch (e) { console.warn("Stats fetch failed", e); }
                }

                const userData = res.data;
                setProfile({
                    ...userData,
                    location: userData.location || 'Remote',
                    joined: userData.createdAt ? new Date(userData.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Unknown',
                    bio: userData.bio || 'No bio provided.',
                    role: userData.role || 'Member', // Assuming role field exists or defaulting
                    stats: isOwnProfile ? statsRes.data.stats : (userData.stats || {}),
                });
            } catch (err) {
                console.error(err);
                showError('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        if (authUser || userId) fetchProfile();
    }, [userId, authUser, isOwnProfile]);

    React.useEffect(() => {
        const fetchUserPosts = async () => {
            try {
                setPostsLoading(true);
                const targetId = userId || authUser?._id;
                // If dashboard/own profile, we might want 'my-posts' endpoint for comprehensive list, 
                // but public posts endpoint is safer for general 'profile view' compatibility. 
                // Let's stick to generic posts query for now unless strictly 'my-posts' needed.
                const res = await api.get('/posts', { params: { userId: targetId } });
                setPosts(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setPostsLoading(false);
            }
        };

        if (authUser || userId) fetchUserPosts();
    }, [userId, authUser]);

    // --- Handlers ---
    const handleLogout = () => {
        if (window.confirm('Are you sure you want to sign out?')) {
            logout();
            navigate('/');
        }
    };

    const handleCreateContactRequest = async (postId, e) => {
        e.stopPropagation();
        if (!authUser) return;
        try {
            await api.post(`/requests/${postId}`);
            success('Contact request sent!');
        } catch (err) {
            showError(err.response?.data?.msg || 'Failed to send request');
        }
    };

    // --- Loading State ---
    if (loading) {
        return (
            <div className="flex flex-col gap-6 max-w-5xl mx-auto p-8 animate-pulse">
                <div className="h-64 bg-zinc-100 rounded-2xl w-full"></div>
                <div className="grid grid-cols-3 gap-6">
                    <div className="h-40 bg-zinc-100 rounded-xl"></div>
                    <div className="h-40 bg-zinc-100 rounded-xl"></div>
                    <div className="h-40 bg-zinc-100 rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (!profile) return <div className="p-8 text-center text-zinc-500">Profile not found.</div>;

    // --- Render ---
    return (
        <div className="flex flex-col gap-10 max-w-6xl mx-auto px-6 py-10 w-full min-h-full">

            {/* 1. Header Card: Identity & Controls */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">

                {/* Identity Section */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 w-full">
                    {/* Avatar */}
                    <div className="relative group shrink-0">
                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-zinc-100">
                            <img
                                src={getAvatarUrl(profile)}
                                alt={profile.displayName}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {/* Status Dot */}
                        <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full"></div>
                    </div>

                    {/* Meta Info */}
                    <div className="text-center md:text-left flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row items-center md:items-baseline gap-3 mb-2">
                            <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight truncate">
                                {profile.displayName}
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-xs font-semibold tracking-wide border border-zinc-200 uppercase">
                                {profile.role || 'Member'}
                            </span>
                        </div>

                        <p className="text-zinc-500 text-sm md:text-base max-w-lg mb-4 leading-relaxed">
                            {profile.bio}
                        </p>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-medium text-zinc-500">
                            <div className="flex items-center gap-1.5">
                                <MapPin size={14} className="text-zinc-400" />
                                {profile.location}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Calendar size={14} className="text-zinc-400" />
                                Joined {profile.joined}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Mail size={14} className="text-zinc-400" />
                                {profile.email}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions (Only for Own Profile) */}
                {isOwnProfile && (
                    <div className="flex flex-row md:flex-col gap-3 shrink-0 w-full md:w-auto">
                        <button
                            onClick={() => navigate('/edit-profile')}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-900 text-white hover:bg-zinc-800 active:bg-black rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow"
                        >
                            <Edit2 size={16} />
                            Edit Profile
                        </button>
                        <button
                            onClick={() => navigate('/settings')}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 rounded-xl text-sm font-medium transition-all"
                        >
                            <Settings size={16} />
                            Settings
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition-all group"
                        >
                            <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
                            Sign Out
                        </button>
                    </div>
                )}
            </div>

            {/* 2. Listings Section */}
            <div>
                <div className="flex items-center justify-between mb-8 border-b border-zinc-200 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-100 rounded-lg text-zinc-600">
                            <Package size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900">
                                {isOwnProfile ? 'My Listings' : `${profile.displayName.split(' ')[0]}'s Listings`}
                            </h2>
                            <p className="text-zinc-500 text-sm">
                                {posts.length} active {posts.length === 1 ? 'post' : 'posts'}
                            </p>
                        </div>
                    </div>
                    {isOwnProfile && (
                        <button
                            onClick={() => navigate('/create-post')}
                            className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 font-medium text-sm transition-colors border border-dashed border-zinc-300 hover:border-zinc-400 px-4 py-2 rounded-full"
                        >
                            <Plus size={16} />
                            Create New
                        </button>
                    )}
                </div>

                {/* Grid */}
                {postsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
                    </div>
                ) : posts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                        {posts.map(post => (
                            <div key={post._id} className="h-full">
                                <PostCard
                                    post={post}
                                    currentUserId={authUser?._id}
                                    onRequestContact={handleCreateContactRequest}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200 p-12 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                            <LayoutGrid className="text-zinc-300" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 mb-1">
                            No listings yet
                        </h3>
                        <p className="text-zinc-500 max-w-xs mb-6 text-sm">
                            {isOwnProfile
                                ? "You haven't posted anything yet. Share your services, items, or jobs with the community."
                                : "This user hasn't posted any listings yet."}
                        </p>
                        {isOwnProfile && (
                            <button
                                onClick={() => navigate('/create-post')}
                                className="px-6 py-2.5 bg-zinc-900 text-white font-medium rounded-xl hover:bg-black transition-colors shadow-lg shadow-zinc-900/10"
                            >
                                Create your first post
                            </button>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
};

export default Profile;
