import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Button from '../components/ui/Button';
import { cn } from '../utils/cn';
import { useToast } from '../components/ui/Toast';
import { useDialog } from '../hooks/useDialog';
import PostCard from '../components/ui/PostCard';
import { getAvatarUrl } from '../utils/avatar';

const REPORT_REASON_OPTIONS = [
    'Spam or scam',
    'Harassment or abuse',
    'Impersonation',
    'Hate speech',
    'Explicit or unsafe content',
    'Other'
];

const Profile = () => {
    const { user: authUser, logout } = useAuth();
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const { success, error: showError } = useToast();
    const dialog = useDialog();
    const location = useLocation();
    const navigate = useNavigate();

    const queryParams = new URLSearchParams(location.search);
    const userId = queryParams.get('userId');
    const isOwnProfile = !userId || userId === authUser?._id;

    const fetchProfile = async () => {
        try {
            const endpoint = isOwnProfile ? '/user/profile' : `/user/${userId}`;
            setPostsLoading(true);
            const res = await api.get(endpoint);

            let statsRes = { data: { stats: res.data.stats || {} } };
            if (isOwnProfile) {
                statsRes = await api.get('/user/stats');
            }

            const userData = res.data;
            setProfile({
                ...userData,
                location: userData.location || 'Location not set',
                joined: userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : '',
                bio: userData.bio || '',
                skills: userData.skills || [],
                skillEndorsements: userData.skillEndorsements || [],
                stats: isOwnProfile ? statsRes.data.stats : (userData.stats || {}),
            });
        } catch (err) {
            console.error(err);
            showError('Failed to load profile. Please try again.');
        } finally {
            setPostsLoading(false);
        }
    };

    if (authUser) fetchProfile();

    const handleDeleteConversation = async (conversationId) => {
        const confirmed = await dialog.confirm(
            'Are you sure you want to delete this conversation? This action cannot be undone.',
            'Delete Conversation'
        );
        if (!confirmed) return;

        try {
            await api.delete(`/chat/conversation/${conversationId}`);
            if (showDeleteConfirm && onConversationDeleted) {
                onConversationDeleted(conversationId);
            }
            success('Conversation deleted');
        } catch (err) {
            console.error(err);
            showError('Failed to delete conversation.');
        }
    };

    if (!profile) {
        return <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
                <i className="spinner-icon" style="width:4rem;height:4rem;" />
                <h2 className="mt-4 text-2xl font-bold">Loading Profile</h2>
                <p className="text-muted-foreground mt-2">Please wait...</p>
            </div>
        </div>;
    }

    return (
        <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8 pt-8 border-b border-border">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-24 h-24 rounded-full flex-shrink-0">
                            <img
                                src={getAvatarUrl(profile)}
                                alt={profile?.displayName || 'Profile'}
                                className="w-full h-full rounded-full object-cover"
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{profile?.displayName || 'User'}</h1>
                            {profile?.email && <p className="text-sm text-muted-foreground">{profile.email}</p>}
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-background/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Posts</p>
                        <p className="text-2xl font-bold">{posts.length || 0}</p>
                    </div>
                    <div className="p-4 bg-background/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Joined</p>
                        <p className="text-2xl font-bold">{profile?.joined || ''}</p>
                    </div>
                </div>

                {/* Bio & Stats */}
                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-bold mb-4">About</h2>
                        {profile?.bio && <p className="text-muted-foreground">{profile.bio}</p>}
                    </div>

                    {isOwnProfile && (
                        <div>
                            <h2 className="text-xl font-bold mb-4">Your Posts</h2>
                            <div className="grid grid-cols-2 gap-4">
                                {posts.map((post) => (
                                    <PostCard key={post._id} post={post} currentUserId={authUser?._id} onDelete={() => {}} onEdit={() => {}} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;