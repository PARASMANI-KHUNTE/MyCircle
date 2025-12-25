import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Icons
import {
    ArrowLeft, MapPin, MessageCircle, Share2, Heart,
    Repeat, ShieldCheck, Star, Sparkles, CheckCircle2,
    Clock, Send, Trash2, Edit3
} from 'lucide-react';

// Utilities & Services
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { getAvatarUrl } from '../utils/avatar';
import { getPostInsights, getPostExplanation } from '../services/aiService';
import { useDialog } from '../hooks/useDialog';
import PostCard from '../components/ui/PostCard';

// --- Leaflet Icon Fix ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- Config ---
const typeConfig = {
    job: { bg: 'bg-blue-100 text-blue-700', label: 'Job' },
    service: { bg: 'bg-violet-100 text-violet-700', label: 'Service' },
    sell: { bg: 'bg-emerald-100 text-emerald-700', label: 'For Sale' },
    rent: { bg: 'bg-orange-100 text-orange-700', label: 'Rent' }
};

const DashboardPostDetails = ({ postId, onBack }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { success, error: showError } = useToast();
    const dialog = useDialog();

    // State
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [requestLoading, setRequestLoading] = useState(false);
    const [requestSent, setRequestSent] = useState(false);
    const [requestApproved, setRequestApproved] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [likes, setLikes] = useState([]);
    const [relatedPosts, setRelatedPosts] = useState([]);

    // AI State
    const [isFetchingAi, setIsFetchingAi] = useState(false);
    const [aiSummary, setAiSummary] = useState('');
    const [aiInsights, setAiInsights] = useState(null);

    // Comments state
    const [showAllComments, setShowAllComments] = useState(false);

    const currentUserId = user?._id || user?.id;
    const isLiked = currentUserId && likes.includes(currentUserId);

    // --- Fetch Logic ---
    useEffect(() => {
        if (!postId) return;

        const fetchPost = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/posts/${postId}`);
                setPost(res.data);
                setLikes(res.data.likes || []);

                // Fetch Related
                api.get(`/posts/related/${postId}`).then(r => setRelatedPosts(r.data.slice(0, 4))).catch(console.error);

                // Check if user has an existing request to this post's owner
                if (user) {
                    try {
                        const sentRes = await api.get('/contacts/sent');
                        const existingRequest = sentRes.data.find(
                            req => req.post?._id === postId || req.post?.author?._id === res.data.user._id
                        );
                        if (existingRequest) {
                            setRequestSent(true);
                            if (existingRequest.status === 'approved') {
                                setRequestApproved(true);
                            }
                        }
                    } catch (e) {
                        console.error('Error checking existing request:', e);
                    }
                }

                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchPost();
    }, [postId, user]);

    // --- Action Handlers ---
    const handleRequest = async () => {
        if (!user) return navigate('/auth');
        setRequestLoading(true);
        try {
            await api.post('/contacts/request', { postId: postId, recipientId: post.user._id });
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
        if (aiSummary) return;
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
            const res = await api.post(`/posts/${postId}/comment`, { text: commentText });
            setPost(prev => ({ ...prev, comments: [res.data, ...prev.comments] }));
            setCommentText('');
            success('Comment posted');
        } catch (err) { showError('Failed to comment'); }
    };

    const handleLike = async () => {
        if (!user) return;
        try {
            await api.post(`/posts/${postId}/like`);
            setLikes(prev => isLiked ? prev.filter(uid => uid !== currentUserId) : [...prev, currentUserId]);
        } catch (e) { console.error(e); }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
        success('Link copied to clipboard');
    };

    const handleDelete = async () => {
        const confirmed = await dialog.confirm('Are you sure you want to delete this post?', 'Delete Post');
        if (!confirmed) return;
        try {
            await api.delete(`/posts/${postId}`);
            success('Post deleted successfully');
            if (onBack) onBack();
        } catch (err) {
            showError('Failed to delete post');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        </div>
    );

    if (!post) return (
        <div className="text-center py-20">
            <p className="text-slate-500">Post not found</p>
            <button onClick={onBack} className="mt-4 text-teal-600 font-medium hover:underline">
                Go back
            </button>
        </div>
    );

    const isOwnPost = currentUserId && post.user._id === currentUserId;
    const typeStyle = typeConfig[post.type] || typeConfig.sell;

    return (
        <div className="max-w-6xl mx-auto space-y-8">

            {/* Back Button */}
            <button
                onClick={onBack}
                className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium text-sm transition-colors"
            >
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                    <ArrowLeft size={16} />
                </div>
                Back
            </button>

            <div className="grid lg:grid-cols-12 gap-8 items-start">

                {/* --- Left Column: Images & Content (7 Cols) --- */}
                <div className="lg:col-span-7 space-y-6">

                    {/* Hero Image */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg bg-slate-100"
                    >
                        {post.images?.[0] ? (
                            <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Sparkles size={48} />
                            </div>
                        )}

                        {/* Floating Actions on Image */}
                        <div className="absolute top-4 right-4 flex gap-2">
                            <button onClick={handleLike} className={`p-2.5 rounded-full backdrop-blur-md border border-white/20 transition-all ${isLiked ? 'bg-pink-500 text-white' : 'bg-white/90 text-slate-700 hover:bg-white'}`}>
                                <Heart size={18} className={isLiked ? 'fill-current' : ''} />
                            </button>
                            <button onClick={handleShare} className="p-2.5 rounded-full bg-white/90 backdrop-blur-md border border-white/20 text-slate-700 hover:bg-white transition-all">
                                <Share2 size={18} />
                            </button>
                        </div>

                        <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${typeStyle.bg}`}>
                            {typeStyle.label}
                        </div>
                    </motion.div>

                    {/* Title & Description */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h1 className="text-2xl font-bold text-slate-900 mb-4">
                            {post.title}
                        </h1>

                        <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-500 mb-6 pb-6 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <Clock size={14} className="text-teal-600" />
                                Posted {new Date(post.createdAt).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin size={14} className="text-teal-600" />
                                {post.location}
                            </div>
                            {post.acceptsBarter && (
                                <div className="flex items-center gap-2 text-pink-600 bg-pink-50 px-2 py-1 rounded-full text-xs font-semibold">
                                    <Repeat size={12} />
                                    Barter Accepted
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
                            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                {post.description}
                            </p>
                        </div>
                    </div>

                    {/* AI Insights Card */}
                    <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700">
                                    <Sparkles size={16} />
                                </div>
                                <span className="font-semibold text-slate-900">AI Insights</span>
                            </div>
                            {!aiSummary && (
                                <button
                                    onClick={handleAiAnalyze}
                                    disabled={isFetchingAi}
                                    className="text-xs font-semibold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    {isFetchingAi ? 'Analyzing...' : 'Generate'}
                                </button>
                            )}
                        </div>

                        {aiSummary && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <p className="text-slate-600 italic text-sm leading-relaxed border-l-2 border-teal-500 pl-4 mb-4">
                                    "{aiSummary}"
                                </p>
                                {aiInsights && (
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        <div className="bg-white p-3 rounded-lg border border-slate-100">
                                            <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Demand Score</div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-teal-500" style={{ width: `${aiInsights.demandScore * 10}%` }} />
                                                </div>
                                                <span className="font-bold text-slate-900 text-sm">{aiInsights.demandScore}/10</span>
                                            </div>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-slate-100">
                                            <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Price Analysis</div>
                                            <div className="font-semibold text-slate-900 text-sm">{aiInsights.priceAnalysis}</div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>

                    {/* Location Map */}
                    {post.locationCoords?.coordinates && (
                        <div className="rounded-xl overflow-hidden h-[250px] shadow-sm border border-slate-200 relative z-0">
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
                </div>

                {/* --- Right Column: Sticky Sidebar (5 Cols) --- */}
                <div className="lg:col-span-5">
                    <div className="sticky top-24 space-y-4">

                        {/* Main Action Card */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">

                            {/* Price Header */}
                            <div className="mb-6">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Price</p>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-3xl font-bold ${post.price && post.price > 0 ? 'text-slate-900' : 'text-emerald-600'}`}>
                                        {post.price && post.price > 0 ? `₹${post.price.toLocaleString()}` : 'Free'}
                                    </span>
                                    {post.acceptsBarter && (
                                        <span className="text-xs font-semibold text-pink-500 bg-pink-50 px-2 py-1 rounded-md">
                                            or Barter
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Seller Info */}
                            <div className="flex items-center gap-3 mb-6 p-3 bg-slate-50 rounded-lg">
                                <img src={getAvatarUrl(post.user)} className="w-11 h-11 rounded-full object-cover" alt="Seller" />
                                <div>
                                    <div className="font-semibold text-slate-900 flex items-center gap-1">
                                        {post.user.displayName}
                                        <CheckCircle2 size={14} className="text-teal-500" />
                                    </div>
                                    <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                                        <Star size={12} className="fill-current" />
                                        {post.user.rating || 'New'}
                                    </div>
                                </div>
                            </div>

                            {/* CTAs */}
                            {isOwnPost ? (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onBack && onBack('edit', postId)}
                                        className="flex-1 py-3 rounded-lg bg-slate-100 text-slate-900 font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Edit3 size={16} />
                                        Edit
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="flex-1 py-3 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={16} />
                                        Delete
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {requestApproved ? (
                                        <button
                                            onClick={() => onBack && onBack('chats')}
                                            className="w-full py-3 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-all flex items-center justify-center gap-2"
                                        >
                                            <MessageCircle size={18} />
                                            Chat with Seller
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={handleRequest}
                                                disabled={requestLoading || requestSent}
                                                className="w-full py-3 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                <MessageCircle size={18} />
                                                {requestSent ? 'Request Sent' : 'Contact Seller'}
                                            </button>
                                            {requestSent && (
                                                <p className="text-xs text-slate-500 text-center">
                                                    Waiting for seller to approve your request
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            <div className="mt-4 text-center">
                                <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                                    <ShieldCheck size={12} /> Secure transaction
                                </p>
                            </div>
                        </div>

                        {/* Safety Tips Card */}
                        <div className="bg-teal-900 text-teal-50 p-5 rounded-xl relative overflow-hidden">
                            <h4 className="font-semibold text-white mb-2">Safety Tips</h4>
                            <ul className="text-sm space-y-1.5 opacity-90">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 size={12} className="mt-0.5 shrink-0" />
                                    Meet in public places
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 size={12} className="mt-0.5 shrink-0" />
                                    Inspect item before paying
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 size={12} className="mt-0.5 shrink-0" />
                                    Avoid sharing financial info
                                </li>
                            </ul>
                        </div>

                        {/* Comments Section */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <h3 className="font-semibold text-slate-900 mb-4">Comments ({post.comments?.length || 0})</h3>

                            {user && (
                                <form onSubmit={handleCommentSubmit} className="flex gap-3 mb-6">
                                    <img src={getAvatarUrl(user)} className="w-10 h-10 rounded-full object-cover border border-slate-200" alt="User" />
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            placeholder="Write a comment..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-4 pr-12 text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!commentText.trim()}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-teal-600 disabled:opacity-50"
                                        >
                                            <Send size={16} />
                                        </button>
                                    </div>
                                </form>
                            )}

                            <div className="space-y-4">
                                {post.comments?.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-4">No comments yet</p>
                                ) : (
                                    <>
                                        {(showAllComments ? post.comments : post.comments?.slice(0, 2))?.map((comment, i) => (
                                            <div key={i} className="flex gap-3">
                                                <img src={getAvatarUrl(comment.user)} className="w-9 h-9 rounded-full object-cover bg-slate-100" alt={comment.user.displayName} />
                                                <div className="bg-slate-50 p-3 rounded-lg rounded-tl-none flex-1">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-semibold text-sm text-slate-900">{comment.user.displayName}</span>
                                                        <span className="text-[10px] text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-slate-600 text-sm">{comment.text}</p>
                                                </div>
                                            </div>
                                        ))}

                                        {!showAllComments && post.comments?.length > 2 && (
                                            <button
                                                onClick={() => setShowAllComments(true)}
                                                className="w-full py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                                            >
                                                Show {post.comments.length - 2} more comment{post.comments.length - 2 > 1 ? 's' : ''}
                                            </button>
                                        )}

                                        {showAllComments && post.comments?.length > 2 && (
                                            <button
                                                onClick={() => setShowAllComments(false)}
                                                className="w-full py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                                            >
                                                Show less
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
                <div className="border-t border-slate-200 pt-8">
                    <h2 className="font-bold text-xl text-slate-900 mb-6">Similar Posts</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {relatedPosts.map(p => (
                            <PostCard
                                key={p._id}
                                post={p}
                                currentUserId={currentUserId}
                                onClick={(postId) => onBack && onBack('post', postId)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPostDetails;
