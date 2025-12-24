import React from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { MapPin, Mail, Phone, Calendar, Edit2, Star, Shield, LayoutGrid } from 'lucide-react';
import Button from '../components/ui/Button';
import StatsCard from '../components/ui/StatsCard';
import { getAvatarUrl } from '../utils/avatar';

const Profile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Fetch stats separately to get dynamic data
                const res = await api.get('/user/stats');
                setProfile({
                    ...user, // Basic info from auth context
                    ...res.data, // Dynamic stats from API
                    location: user.location || 'Location not set',
                    joined: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
                    bio: user.bio || '',
                    skills: user.skills || [],
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchProfile();
    }, [user]);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                <p>Please sign in to view your profile.</p>
            </div>
        );
    }

    if (loading || !profile) {
        return <div className="min-h-screen flex items-center justify-center text-white">Loading profile...</div>;
    }

    const stats = profile.stats || { rating: 0, totalPosts: 0, activePosts: 0 };

    return (
        <div className="container mx-auto px-6 py-24 text-white">
            <div className="max-w-4xl mx-auto">
                {/* Header Card */}
                <div className="glass rounded-2xl p-8 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/20 to-secondary/20" />

                    <div className="relative flex flex-col md:flex-row items-end gap-6 pt-12">
                        <div className="w-32 h-32 rounded-full border-4 border-dark bg-dark overflow-hidden shadow-xl">
                            <img
                                src={getAvatarUrl(profile)}
                                alt={profile.displayName}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="flex-1 mb-2">
                            <h1 className="text-3xl font-bold font-display">{profile.displayName}</h1>
                            <div className="flex items-center gap-4 text-gray-400 mt-2 text-sm">
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" /> {profile.location}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" /> Joined {profile.joined}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3 mb-2">
                            <Button variant="outline" onClick={() => window.location.href = '/edit-profile'}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit Profile
                            </Button>
                            <Button variant="outline" onClick={() => window.location.href = '/settings'}>
                                Settings
                            </Button>
                            <Button variant="danger" onClick={() => {
                                localStorage.removeItem('token');
                                window.location.href = '/';
                            }}>
                                Logout
                            </Button>
                        </div>
                    </div>

                    <p className="mt-8 text-gray-300 leading-relaxed max-w-2xl">
                        {profile.bio}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-6">
                        {profile.skills.map((skill, index) => (
                            <span key={index} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-primary">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatsCard
                        icon={Star}
                        label="Average Rating"
                        value={profile.rating || 0}
                        color="border-yellow-500/50"
                    />
                    <StatsCard
                        icon={LayoutGrid}
                        label="Total Posts"
                        value={stats.totalPosts}
                        color="border-primary/50"
                    />
                    <StatsCard
                        icon={Shield}
                        label="Active Posts"
                        value={stats.activePosts}
                        color="border-green-500/50"
                    />
                    <StatsCard
                        icon={Mail}
                        label="Contacts Recv"
                        value={stats.contactsReceived || 0}
                        color="border-pink-500/50"
                    />
                </div>

                {/* Contact Info (Private) */}
                <div className="glass rounded-xl p-8">
                    <h2 className="text-xl font-bold mb-6">Contact Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-center gap-3">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Email Address</div>
                                <div>{profile.email}</div>
                            </div>
                        </div>
                        <div className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-center gap-3">
                            <Phone className="w-5 h-5 text-gray-400" />
                            <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Phone Number</div>
                                <div>{profile.contactPhone || 'Not Added'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
