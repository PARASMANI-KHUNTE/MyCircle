import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { MapPin, Mail, Phone, Calendar, Edit2, Star, Shield, LayoutGrid } from 'lucide-react';
import Button from '../components/ui/Button';
import StatsCard from '../components/ui/StatsCard';
import { getAvatarUrl } from '../utils/avatar';
import PostCard from '../components/ui/PostCard';
import EditPostModal from '../components/ui/EditPostModal';
import { useToast } from '../components/ui/Toast';
import LoginRequired from '../components/LoginRequired';

const Profile = () => {
    const { user: authUser, logout } = useAuth();
    const [profile, setProfile] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [posts, setPosts] = React.useState([]);
    const [postsLoading, setPostsLoading] = React.useState(true);
    const [editingPost, setEditingPost] = React.useState(null);
    const { success, error: showError } = useToast();
    const location = useLocation();
    const navigate = useNavigate();

    const queryParams = new URLSearchParams(location.search);
    const userId = queryParams.get('userId');
    const isOwnProfile = !userId || userId === authUser?._id;

    React.useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const endpoint = isOwnProfile ? '/user/profile' : `/user/${userId}`;
                const res = await api.get(endpoint);

                let statsRes = { data: { stats: res.data.stats || {} } };
                if (isOwnProfile) {
                    // Refresh stats for own profile
                    statsRes = await api.get('/user/stats');
                }

                const userData = res.data;
                setProfile({
                    ...userData,
                    location: userData.location || 'Location not set',
                    joined: userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : '',
                    bio: userData.bio || '',
                    skills: userData.skills || [],
                    stats: isOwnProfile ? statsRes.data.stats : (userData.stats || {}),
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (authUser) fetchProfile();
    }, [userId, authUser, isOwnProfile]);

    React.useEffect(() => {
        const fetchUserPosts = async () => {
            try {
                setPostsLoading(true);
                const targetId = userId || authUser?._id;
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

    const handleUpdatePost = (updatedPost) => {
        setPosts(posts.map(p => p._id === updatedPost._id ? { ...p, ...updatedPost } : p));
    };

    const handleDeletePost = async (postId) => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                await api.delete(`/posts/${postId}`);
                setPosts(posts.filter(p => p._id !== postId));
                success('Post deleted successfully');
            } catch (err) {
                showError('Failed to delete post');
            }
        }
    };

    const handleStatusChange = async (postId, status) => {
        try {
            const res = await api.patch(`/posts/${postId}/status`, { status });
            handleUpdatePost(res.data);
            success(`Post status updated to ${status}`);
        } catch (err) {
            showError('Failed to update status');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleBlock = async () => {
        if (window.confirm('Are you sure you want to block this user?')) {
            try {
                await api.post(`/user/block/${userId}`);
                alert('User blocked');
                navigate('/feed');
            } catch (err) {
                console.error(err);
                alert('Failed to block user');
            }
        }
    };

    const handleMessage = () => {
        // Find or create conversation logic is handled in Chat.jsx/ChatWindow.jsx
        // For now, we move to chat with a recipient hint
        navigate(`/chat?recipientId=${userId}`);
    };

    if (!authUser && !userId) {
        return <LoginRequired message="Please sign in to view your profile." />;
    }

    if (loading || !profile) {
        return <div className="min-h-screen flex items-center justify-center text-white">Loading profile...</div>;
    }

    const stats = profile.stats || { rating: 0, totalPosts: 0, activePosts: 0 };

    return (
        <div className="container mx-auto px-6 py-24 text-foreground">
            <div className="max-w-4xl mx-auto">
                {/* Header Card */}
                <div className="glass rounded-3xl p-8 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />

                    <div className="relative flex flex-col md:flex-row items-end gap-6 pt-12">
                        <div className="w-32 h-32 rounded-full ring-4 ring-background bg-background overflow-hidden shadow-2xl">
                            <img
                                src={getAvatarUrl(profile)}
                                alt={profile.displayName}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="flex-1 mb-2">
                            <h1 className="text-3xl font-bold font-display text-foreground">{profile.displayName}</h1>
                            <div className="flex items-center gap-4 text-muted-foreground mt-2 text-sm">
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" /> {profile.location}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" /> Joined {profile.joined}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3 mb-2 flex-wrap">
                            {isOwnProfile ? (
                                <>
                                    <Button variant="outline" onClick={() => navigate('/edit-profile')}>
                                        <Edit2 className="w-4 h-4 mr-2" />
                                        Edit Profile
                                    </Button>
                                    <Button variant="outline" onClick={() => navigate('/settings')}>
                                        Settings
                                    </Button>
                                    <Button variant="danger" onClick={handleLogout}>
                                        Logout
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button variant="primary" onClick={handleMessage}>
                                        <Mail className="w-4 h-4 mr-2" />
                                        Message
                                    </Button>
                                    <Button variant="danger" onClick={handleBlock}>
                                        Block User
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    <p className="mt-8 text-muted-foreground leading-relaxed max-w-2xl">
                        {profile.bio}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-6">
                        {profile.skills.map((skill, index) => (
                            <span key={index} className="px-3 py-1 rounded-full glass hover:bg-white/10 text-xs text-primary font-bold">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Stats Grid */}
            </div>

            {/* My Posts Section */}
            <div className="mt-12">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold font-display">
                        {isOwnProfile ? 'My Posts' : `${profile.displayName}'s Posts`}
                    </h2>
                    {isOwnProfile && (
                        <Button variant="primary" size="sm" onClick={() => navigate('/create-post')}>
                            Create New
                        </Button>
                    )}
                </div>

                {postsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2].map(i => (
                            <div key={i} className="glass h-64 rounded-2xl animate-pulse bg-white/5" />
                        ))}
                    </div>
                ) : posts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {posts.map(post => (
                            <PostCard
                                key={post._id}
                                post={post}
                                isOwnPost={isOwnProfile}
                                onDelete={() => handleDeletePost(post._id)}
                                onStatusChange={(status) => handleStatusChange(post._id, status)}
                                onEdit={() => setEditingPost(post)}
                                currentUserId={authUser?._id}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="glass rounded-2xl p-12 text-center">
                        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <p className="text-muted-foreground">No posts found yet.</p>
                    </div>
                )}
            </div>

            {editingPost && (
                <EditPostModal
                    post={editingPost}
                    isOpen={!!editingPost}
                    onClose={() => setEditingPost(null)}
                    onUpdate={handleUpdatePost}
                />
            )}
        </div>
    );
};

export default Profile;
