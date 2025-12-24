import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Icons
import {
    ArrowLeft, MapPin, MessageCircle, Share2, Heart,
    Repeat, ShieldCheck, Star, Zap, Navigation,
    Sparkles, CheckCircle2, Clock, Send
} from 'lucide-react';

// Utilities & Services
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { getAvatarUrl } from '../utils/avatar';
import { getPostInsights, getPostExplanation } from '../services/aiService';
import { useDialog } from '../hooks/useDialog';

// Components
import PostCard from '../components/ui/PostCard'; // Reusing your new card for "Related"

// --- Leaflet Icon Fix ---
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIconRetina,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- Config ---
const typeConfig = {
    job: { bg: 'bg-blue-50 text-blue-700', label: 'Job' },
    service: { bg: 'bg-violet-50 text-violet-700', label: 'Service' },
    sell: { bg: 'bg-emerald-50 text-emerald-700', label: 'For Sale' },
    rent: { bg: 'bg-orange-50 text-orange-700', label: 'Rent' }
};

// Reused Navbar Component (Matches Feed.jsx)
const Navbar = ({ user, navigate }) => {
    const [imgError, setImgError] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all duration-300">
            <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
                        <span className="text-xl">M</span>
                    </div>
                    MyCircle.
                </div>

                <div className="flex items-center gap-4">
                    {user ? (
                        <>

                            <img
                                src={!imgError && user.avatar ? user.avatar : `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=000&color=fff`}
                                alt="Profile"
                                className="w-10 h-10 rounded-full cursor-pointer ring-2 ring-white shadow-sm hover:ring-slate-200 transition-all object-cover"
                                onClick={() => navigate('/profile')}
                                onError={() => setImgError(true)}
                                referrerPolicy="no-referrer"
                            />
                        </>
                    ) : (
                        <button
                            onClick={() => window.location.href = 'http://localhost:5000/auth/google'}
                            className="px-5 py-2.5 bg-black text-white rounded-full text-sm font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-black/20"
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};

const PostDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { success, error: showError } = useToast();
    const dialog = useDialog();

    // State
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [requestLoading, setRequestLoading] = useState(false);
    const [requestSent, setRequestSent] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [likes, setLikes] = useState([]);
    const [relatedPosts, setRelatedPosts] = useState([]);

    // AI State
    const [isFetchingAi, setIsFetchingAi] = useState(false);
    const [aiSummary, setAiSummary] = useState('');
    const [aiInsights, setAiInsights] = useState(null);

    const currentUserId = user?._id || user?.id;
    const isLiked = currentUserId && likes.includes(currentUserId);

    // --- Fetch Logic ---
    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await api.get(`/posts/${id}`);
                setPost(res.data);
                setLikes(res.data.likes || []);

                // Fetch Related
                api.get(`/posts/related/${id}`).then(r => setRelatedPosts(r.data)).catch(console.error);

                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchPost();
    }, [id]);

    // --- Action Handlers ---

    const handleRequest = async () => {
        if (!user) return navigate('/auth');
        setRequestLoading(true);
        try {
            await api.post('/contacts/request', { postId: id, recipientId: post.user._id });
            success('Request sent successfully!');
            setRequestSent(true);
        } catch (err) {
            const msg = err.response?.data?.message || 'Request failed';
            if (msg.includes('already sent')) setRequestSent(true);
            showError(msg);
        } finally {
            setRequestLoading(false);
        }
    };

    const handleAiAnalyze = async () => {
        if (aiSummary) return; // Already fetched
        setIsFetchingAi(true);
        try {
            const [summaryRes, insightsRes] = await Promise.all([
                getPostExplanation(post),
                getPostInsights(post)
            ]);
            setAiSummary(summaryRes.explanation);
            setAiInsights(insightsRes);
        } catch (e) {
            console.error(e);
        } finally {
            setIsFetchingAi(false);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        try {
            const res = await api.post(`/posts/${id}/comment`, { text: commentText });
            setPost(prev => ({ ...prev, comments: [res.data, ...prev.comments] }));
            setCommentText('');
            success('Comment posted');
        } catch (err) { showError('Failed to comment'); }
    };

    const handleLike = async () => {
        if (!user) return;
        try {
            await api.post(`/posts/${id}/like`);
            setLikes(prev => isLiked ? prev.filter(uid => uid !== currentUserId) : [...prev, currentUserId]);
        } catch (e) { console.error(e); }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        success('Link copied to clipboard');
    };

    if (loading) return (
        <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        </div>
    );

    if (!post) return <div>Post not found</div>;

    const isOwnPost = currentUserId && post.user._id === currentUserId;
    const typeStyle = typeConfig[post.type] || typeConfig.sell;

    return (
        <div className="min-h-screen bg-[#FAFAF9] text-slate-900 font-sans selection:bg-emerald-200 selection:text-emerald-900">

            <Navbar user={user} navigate={navigate} />

            <div className="pt-28 px-6 pb-24">
                <div className="container mx-auto max-w-7xl">

                    {/* Breadcrumb */}
                    <button
                        onClick={() => navigate(-1)}
                        className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-8 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ArrowLeft size={16} />
                        </div>
                        Back to Feed
                    </button>

                    <div className="grid lg:grid-cols-12 gap-12 items-start">

                        {/* --- Left Column: Images & Content (7 Cols) --- */}
                        <div className="lg:col-span-7 space-y-10">

                            {/* Hero Image */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/50"
                            >
                                {post.images?.[0] ? (
                                    <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                                        <Sparkles size={48} />
                                    </div>
                                )}

                                {/* Floating Actions on Image */}
                                <div className="absolute top-6 right-6 flex gap-2">
                                    <button onClick={handleLike} className={`p-3 rounded-full backdrop-blur-md border border-white/20 transition-all ${isLiked ? 'bg-pink-500 text-white' : 'bg-white/80 text-slate-700 hover:bg-white'}`}>
                                        <Heart size={20} className={isLiked ? 'fill-current' : ''} />
                                    </button>
                                    <button onClick={handleShare} className="p-3 rounded-full bg-white/80 backdrop-blur-md border border-white/20 text-slate-700 hover:bg-white transition-all">
                                        <Share2 size={20} />
                                    </button>
                                </div>

                                <div className={`absolute top-6 left-6 px-4 py-2 rounded-full backdrop-blur-md text-xs font-bold uppercase tracking-wider ${typeStyle.bg}`}>
                                    {typeStyle.label}
                                </div>
                            </motion.div>

                            {/* Title & Description */}
                            <div>
                                <h1 className="font-serif text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                                    {post.title}
                                </h1>

                                <div className="flex flex-wrap gap-6 text-sm font-semibold text-slate-500 mb-8 border-b border-slate-100 pb-8">
                                    <div className="flex items-center gap-2">
                                        <Clock size={16} className="text-emerald-600" />
                                        Posted {new Date(post.createdAt).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin size={16} className="text-emerald-600" />
                                        {post.location}
                                    </div>
                                    {post.acceptsBarter && (
                                        <div className="flex items-center gap-2 text-pink-600 bg-pink-50 px-3 py-1 rounded-full">
                                            <Repeat size={14} />
                                            Barter Accepted
                                        </div>
                                    )}
                                </div>

                                <div className="prose prose-slate max-w-none">
                                    <h3 className="font-bold text-lg text-slate-900 mb-3">About this circle</h3>
                                    <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">
                                        {post.description}
                                    </p>
                                </div>
                            </div>

                            {/* AI Insights Card */}
                            <div className="bg-gradient-to-br from-slate-50 to-white rounded-[2rem] p-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Sparkles size={120} />
                                </div>

                                <div className="flex items-center justify-between mb-6 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                                            <Sparkles size={16} />
                                        </div>
                                        <span className="font-bold text-slate-900">AI Market Insights</span>
                                    </div>
                                    {!aiSummary && (
                                        <button
                                            onClick={handleAiAnalyze}
                                            disabled={isFetchingAi}
                                            className="text-xs font-bold bg-slate-900 text-white px-4 py-2 rounded-full hover:bg-emerald-800 transition-colors"
                                        >
                                            {isFetchingAi ? 'Analyzing...' : 'Generate Analysis'}
                                        </button>
                                    )}
                                </div>

                                {aiSummary && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                        <p className="text-slate-600 italic mb-6 text-sm leading-relaxed border-l-2 border-emerald-500 pl-4">
                                            "{aiSummary}"
                                        </p>
                                        {aiInsights && (
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Demand Score</div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-emerald-500" style={{ width: `${aiInsights.demandScore * 10}%` }} />
                                                        </div>
                                                        <span className="font-bold text-slate-900">{aiInsights.demandScore}/10</span>
                                                    </div>
                                                </div>
                                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Price Analysis</div>
                                                    <div className="font-bold text-slate-900 text-sm">{aiInsights.priceAnalysis}</div>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </div>

                            {/* Location Map */}
                            {post.locationCoords?.coordinates && (
                                <div className="rounded-[2rem] overflow-hidden h-[350px] shadow-lg relative z-0">
                                    <MapContainer
                                        center={[post.locationCoords.coordinates[1], post.locationCoords.coordinates[0]]}
                                        zoom={14}
                                        className="w-full h-full z-0"
                                    >
                                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                                        <Marker position={[post.locationCoords.coordinates[1], post.locationCoords.coordinates[0]]}>
                                            <Popup className="font-bold">{post.location}</Popup>
                                        </Marker>
                                    </MapContainer>
                                </div>
                            )}

                            {/* Comments Section */}
                            <div className="pt-8">
                                <h3 className="font-bold text-xl text-slate-900 mb-6">Discussion ({post.comments?.length || 0})</h3>
                                {user && (
                                    <form onSubmit={handleCommentSubmit} className="flex gap-4 mb-10">
                                        <img src={getAvatarUrl(user)} className="w-10 h-10 rounded-full object-cover border border-slate-200" alt="User" />
                                        <div className="flex-1 relative">
                                            <input
                                                type="text"
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                placeholder="Ask a question or leave a comment..."
                                                className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-4 pr-12 text-sm font-medium focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all shadow-sm"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!commentText.trim()}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-emerald-600 disabled:opacity-50"
                                            >
                                                <Send size={18} />
                                            </button>
                                        </div>
                                    </form>
                                )}

                                <div className="space-y-6">
                                    {post.comments?.map((comment, i) => (
                                        <div key={i} className="flex gap-4">
                                            <img src={getAvatarUrl(comment.user)} className="w-10 h-10 rounded-full object-cover bg-slate-100" alt={comment.user.displayName} />
                                            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-sm text-slate-900">{comment.user.displayName}</span>
                                                    <span className="text-[10px] text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-slate-600 text-sm">{comment.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* --- Right Column: Sticky Sidebar (5 Cols) --- */}
                        <div className="lg:col-span-5 relative">
                            <div className="sticky top-32 space-y-6">

                                {/* Main Action Card */}
                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">

                                    {/* Price Header */}
                                    <div className="mb-8">
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Asking Price</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-serif text-5xl font-bold text-slate-900">
                                                ₹{post.price?.toLocaleString()}
                                            </span>
                                            {post.acceptsBarter && (
                                                <span className="text-xs font-bold text-pink-500 bg-pink-50 px-2 py-1 rounded-md">
                                                    or Barter
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Seller Info */}
                                    <div className="flex items-center gap-4 mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <img src={getAvatarUrl(post.user)} className="w-12 h-12 rounded-full object-cover" alt="Seller" />
                                        <div>
                                            <div className="font-bold text-slate-900 flex items-center gap-1">
                                                {post.user.displayName}
                                                <CheckCircle2 size={14} className="text-emerald-500" />
                                            </div>
                                            <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                                                <Star size={12} className="fill-current" />
                                                {post.user.rating || 'New Seller'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* CTAs */}
                                    {isOwnPost ? (
                                        <div className="flex gap-2">
                                            <button className="flex-1 py-4 rounded-xl bg-slate-100 text-slate-900 font-bold hover:bg-slate-200 transition-colors">
                                                Edit Post
                                            </button>
                                            <button className="flex-1 py-4 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors">
                                                Delete
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <button
                                                onClick={handleRequest}
                                                disabled={requestLoading || requestSent}
                                                className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold text-lg hover:bg-emerald-900 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-slate-900/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                <MessageCircle size={20} />
                                                {requestSent ? 'Request Sent' : 'Contact Seller'}
                                            </button>
                                            {requestSent && (
                                                <button
                                                    onClick={() => navigate(`/chat?recipientId=${post.user._id}`)}
                                                    className="w-full py-4 rounded-xl bg-white border-2 border-slate-100 text-slate-900 font-bold hover:border-slate-900 transition-colors"
                                                >
                                                    Open Chat
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-6 text-center">
                                        <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                                            <ShieldCheck size={12} /> Secure transaction
                                        </p>
                                    </div>
                                </div>

                                {/* Safety Tips Card */}
                                <div className="bg-emerald-900 text-emerald-50 p-6 rounded-[2rem] relative overflow-hidden">
                                    <div className="relative z-10">
                                        <h4 className="font-serif text-xl font-bold mb-2 text-white">Safety First</h4>
                                        <ul className="text-sm space-y-2 opacity-90">
                                            <li className="flex items-start gap-2">
                                                <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                                                Meet in public places
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                                                Inspect item before paying
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                                                Avoid sharing financial info
                                            </li>
                                        </ul>
                                    </div>
                                    {/* Decorative background pattern */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10" />
                                </div>

                            </div>
                        </div>

                    </div>

                    {/* Related Posts Bottom Section */}
                    {relatedPosts.length > 0 && (
                        <div className="mt-24 border-t border-slate-200 pt-16">
                            <div className="flex justify-between items-end mb-10">
                                <div>
                                    <div className="text-emerald-700 font-bold text-xs uppercase tracking-widest mb-2">Explore More</div>
                                    <h2 className="font-serif text-3xl font-bold text-slate-900">Similar Circles</h2>
                                </div>
                                <button className="text-slate-500 font-bold hover:text-slate-900">View All</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {relatedPosts.map(p => (
                                    <div key={p._id} onClick={() => { navigate(`/post/${p._id}`); window.scrollTo(0, 0); }}>
                                        <PostCard post={p} currentUserId={currentUserId} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}


                </div>
            </div>
        </div>
    );
};

export default PostDetails;