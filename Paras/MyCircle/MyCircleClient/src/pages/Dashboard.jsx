import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Feed from './Feed';
import Notifications from './Notifications';
import MyPosts from './MyPosts';
import CreatePost from './CreatePost';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapView = () => {
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const res = await api.get('/posts');
                // API returns array directly or { posts: [] }
                setPosts(Array.isArray(res.data) ? res.data : (res.data.posts || []));
            } catch (err) {
                console.error("Failed to load map posts", err);
            }
        };
        fetchPosts();
    }, []);

    const validPosts = posts.filter(p => p.locationCoords?.coordinates);

    return (
        <div className="h-full w-full rounded-3xl overflow-hidden shadow-sm border border-slate-200 relative z-0">
            <MapContainer
                center={[20.5937, 78.9629]} // Default India center
                zoom={5}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
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

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('home');
    const { isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();

    // Redirect guests to feed (Dashboard is for logged-in users only)
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            navigate('/feed');
        }
    }, [loading, isAuthenticated, navigate]);

    if (loading) return null;
    if (!isAuthenticated) return null; // Don't render while redirecting

    const renderContent = () => {
        switch (activeTab) {
            case 'home': return <Feed isDashboard={true} />;
            case 'notifications': return <Notifications />;
            case 'posts': return <MyPosts />;
            case 'create': return <CreatePost />;
            case 'map': return <MapView />;
            default: return <Feed />;
        }
    };

    return (
        <div className="flex min-h-screen bg-[#FAFAF9]">
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

            <main className="flex-1 ml-72 p-0 h-screen overflow-y-auto w-full relative">
                <div className="max-w-[1600px] mx-auto h-full px-8 pb-10">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
