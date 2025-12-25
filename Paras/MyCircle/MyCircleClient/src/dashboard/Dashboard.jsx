import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import BottomNav from '../components/layout/BottomNav';
import DashboardHome from './DashboardHome';
import DashboardMyPosts from './DashboardMyPosts';
import RequestsPage from '../pages/RequestsPage';
import Profile from '../pages/Profile';
import DashboardChat from './DashboardChat';
import DashboardCreatePost from './DashboardCreatePost';
import DashboardSettings from './DashboardSettings';
import DashboardPostDetails from './DashboardPostDetails';
import DashboardEditPost from './DashboardEditPost';
import DashboardEditProfile from './DashboardEditProfile';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Search, Bell } from 'lucide-react';

// --- Leaflet Icon Fix ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- Component: MapView (Unchanged) ---
const MapView = () => {
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const res = await api.get('/posts');
                setPosts(Array.isArray(res.data) ? res.data : (res.data.posts || []));
            } catch (err) {
                console.error("Failed to load map posts", err);
            }
        };
        fetchPosts();
    }, []);

    const validPosts = posts.filter(p => p.locationCoords?.coordinates);

    return (
        <div className="h-full w-full rounded-2xl overflow-hidden shadow-sm border border-slate-200 relative z-0">
            <MapContainer
                center={[20.5937, 78.9629]}
                zoom={5}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {validPosts.map(post => (
                    <Marker
                        key={post._id}
                        position={[post.locationCoords.coordinates[1], post.locationCoords.coordinates[0]]}
                    >
                        <Popup>
                            <div className="font-sans">
                                <strong>{post.title}</strong><br />
                                {post.price ? `₹${post.price}` : 'Free'}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

// --- Component: Top Navbar ---
const TopNavbar = ({ user, onTabChange, hasUnread }) => {
    return (
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 flex items-center justify-between px-8 shadow-sm">
            {/* Left: Greeting / Context */}
            <div>
                <h2 className="text-lg font-semibold text-slate-800">
                    Welcome back, {user?.displayName?.split(' ')[0] || 'User'}
                </h2>
                <p className="text-xs text-slate-500">Here's what's happening today.</p>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                {/* Notification Bell */}
                <button
                    onClick={() => onTabChange('requests')}
                    className="relative p-2 text-slate-400 hover:text-teal-600 hover:bg-slate-50 rounded-full transition-colors"
                >
                    <Bell size={20} />
                    {hasUnread && (
                        <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse"></span>
                    )}
                </button>
            </div>
        </header>
    );
};

// --- Main Layout ---
const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('home');
    const [selectedPostId, setSelectedPostId] = useState(null);
    const [unreadChats, setUnreadChats] = useState(0);
    const [pendingRequests, setPendingRequests] = useState(0);
    const [unreadComments, setUnreadComments] = useState(0);
    const { isAuthenticated, user, loading } = useAuth();
    const { unreadCount: unreadNotifications } = useNotifications();
    const navigate = useNavigate();

    // Fetch unread counts
    useEffect(() => {
        const fetchCounts = async () => {
            try {
                // Fetch unread chats
                const chatRes = await api.get('/chat/unread/count');
                setUnreadChats(chatRes.data.count || 0);

                // Fetch pending received requests only
                const requestsRes = await api.get('/contacts/received');
                const pendingCount = requestsRes.data.filter(r => r.status === 'pending').length;
                setPendingRequests(pendingCount);

                // Count comment notifications (unread)
                // Comments are included in the general notifications with type 'comment'
                // unreadNotifications already includes these from NotificationContext
            } catch (err) {
                console.error('Failed to fetch notification counts:', err);
            }
        };
        if (isAuthenticated) fetchCounts();
    }, [isAuthenticated, activeTab]);

    // Total activity count = pending requests + unread notifications (includes comments)
    const totalActivityCount = pendingRequests + unreadNotifications;
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            navigate('/feed');
        }
    }, [loading, isAuthenticated, navigate]);

    if (loading) return null;
    if (!isAuthenticated) return null;

    const renderContent = () => {
        // Handle post details view
        if (activeTab === 'post' && selectedPostId) {
            return (
                <DashboardPostDetails
                    postId={selectedPostId}
                    onBack={(tab, postId) => {
                        if (tab === 'post' && postId) {
                            setSelectedPostId(postId);
                        } else if (tab === 'edit' && postId) {
                            setSelectedPostId(postId);
                            setActiveTab('edit');
                        } else {
                            setSelectedPostId(null);
                            setActiveTab(tab || 'home');
                        }
                    }}
                />
            );
        }

        // Handle edit post view
        if (activeTab === 'edit' && selectedPostId) {
            return (
                <DashboardEditPost
                    postId={selectedPostId}
                    onBack={() => {
                        setActiveTab('posts');
                        setSelectedPostId(null);
                    }}
                    onUpdate={() => {
                        setActiveTab('posts');
                        setSelectedPostId(null);
                    }}
                />
            );
        }

        switch (activeTab) {
            case 'home': return <DashboardHome onViewPost={(postId) => { setSelectedPostId(postId); setActiveTab('post'); }} />;
            case 'create': return <DashboardCreatePost />;
            case 'chats': return <DashboardChat onUnreadUpdate={(count) => setUnreadChats(count)} />;
            case 'requests': return <RequestsPage />;
            case 'map': return <MapView />;
            case 'profile': return <Profile onEditProfile={() => setActiveTab('edit-profile')} onViewPost={(postId) => { setSelectedPostId(postId); setActiveTab('post'); }} />;
            case 'edit-profile': return <DashboardEditProfile onBack={() => setActiveTab('profile')} />;
            case 'posts': return <DashboardMyPosts onViewPost={(postId) => { setSelectedPostId(postId); setActiveTab('post'); }} />;
            case 'settings': return <DashboardSettings />;
            default: return <DashboardHome onViewPost={(postId) => { setSelectedPostId(postId); setActiveTab('post'); }} />;
        }
    };

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">

            {/* Sidebar (Desktop Only) */}
            <div className="hidden md:block">
                <Sidebar
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    unreadChats={unreadChats}
                    unreadRequests={totalActivityCount}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen">

                {/* Top Navbar (Desktop Only) */}
                <div className="hidden md:block">
                    <TopNavbar
                        user={user}
                        onTabChange={setActiveTab}
                        hasUnread={totalActivityCount > 0 || unreadChats > 0}
                    />
                </div>

                {/* Dynamic Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
                    <div className={`mx-auto animate-fade-in ${activeTab === 'map' ? 'h-[calc(100vh-12rem)] max-w-full' : 'max-w-7xl'}`}>
                        {renderContent()}
                    </div>
                </main>
            </div>

            {/* Bottom Navigation (Mobile Only) */}
            <BottomNav
                activeTab={activeTab}
                onTabChange={setActiveTab}
                unreadChats={unreadChats}
                unreadRequests={totalActivityCount}
            />
        </div>
    );
};

export default Dashboard;