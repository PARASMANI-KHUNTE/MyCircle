import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { cn } from '../utils/cn';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import PostCard from '../components/ui/PostCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { getAvatarUrl } from '../utils/avatar';
import { formatDuration } from '../utils/time';
import { getPostInsights, getPostExplanation } from '../services/aiService';
import {
    ArrowLeft, MapPin, Clock, MessageCircle,
    Share2, Heart, Repeat, Phone, UserPlus, UserCheck,
    Check, Copy, Edit2, Trash2, Sparkles, Navigation, MessageSquare, ChevronDown, ChevronUp
} from 'lucide-react';
import { useDialog } from '../hooks/useDialog';
import { useTheme } from '../context/ThemeContext';
import { useCurrencySymbol } from '../context/CurrencySymbolContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const PostDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDark } = useTheme();
    const { currencySymbol } = useCurrencySymbol();
    const { success, error: showError } = useToast();
    const dialog = useDialog();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [requestLoading, setRequestLoading] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [requestSent, setRequestSent] = useState(false);
    const [contactRequestStatus, setContactRequestStatus] = useState('none');
    const [likes, setLikes] = useState([]);
    const [shares, setShares] = useState(0);
    const [hasShared, setHasShared] = useState(() => {
        const sharedPosts = JSON.parse(localStorage.getItem('sharedPosts') || '[]');
        return sharedPosts.includes(id);
    });
    const [relatedPosts, setRelatedPosts] = useState([]);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [editingComment, setEditingComment] = useState(null);
    const [editText, setEditText] = useState('');
    const [aiSummary, setAiSummary] = useState('');
    const [aiInsights, setAiInsights] = useState(null);
    const [isFetchingAi, setIsFetchingAi] = useState(false);
    const [showFullDetails, setShowFullDetails] = useState(false);

    const currentUserId = user?._id || user?.id;
    const isLiked = currentUserId && likes.includes(currentUserId);
    const hasChatAccess = contactRequestStatus === 'accepted' || contactRequestStatus === 'approved';

    const handleReplySubmit = async (commentId) => {
        if (!replyText.trim()) return;

        try {
            const res = await api.post(`/posts/${id}/comment/${commentId}/reply`, { text: replyText });

            setPost(prev => {
                const updatedComments = prev.comments.map(c => {
                    if (c._id === commentId) {
                        return {
                            ...c,
                            replies: [...(c.replies || []), res.data]
                        };
                    }
                    return c;
                });
                return { ...prev, comments: updatedComments };
            });

            setReplyText('');
            setReplyingTo(null);
            success('Reply posted!');
        } catch (err) {
            console.error(err);
            showError('Failed to post reply.');
        }
    };

    const handleMessage = async () => {
        if (!hasChatAccess) {
            showError('Chat unlocks only after your request is approved.');
            return;
        }
        try {
            const res = await api.post(`/chat/init/${post.user._id}`, { postId: id });
            if (!res.data?._id) {
                throw new Error('Conversation was not created');
            }
            navigate(`/chat?conversationId=${res.data._id}`);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 403) {
                showError('You must have an approved contact request to message this user.');
            } else {
                showError('Failed to start chat. Please try again.');
            }
        }
    };

    const handleCall = () => {
        if (!post.user?.contactPhone && !post.user?.contactWhatsapp) {
            showError('Phone number not available');
            return;
        }
        const phone = post.user.contactPhone || post.user.contactWhatsapp;
        window.open(`tel:${phone}`, '_blank');
    };

    const handleText = () => {
        if (!post.user?.contactPhone && !post.user?.contactWhatsapp) {
            showError('Phone number not available');
            return;
        }
        const phone = post.user.contactWhatsapp || post.user.contactPhone;
        window.open(`sms:${phone}`, '_blank');
    };

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await api.get(`/posts/${id}`);
                setPost(res.data);
                setLikes(res.data.likes || []);
                setShares(res.data.shares || 0);
                setRequestSent(!!res.data.hasRequested);
                setContactRequestStatus(res.data.contactRequestStatus || (res.data.hasRequested ? 'pending' : 'none'));

                try {
                    const relatedRes = await api.get(`/posts/related/${id}`);
                    setRelatedPosts(relatedRes.data);
                } catch (error) {
                    console.error("Failed to fetch related posts", error);
                }

                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchPost();
    }, [id]);

    const fetchAiContent = async (postData) => {
        if (!postData && !post) return;
        setIsFetchingAi(true);
        try {
            const dataToUse = postData || post;
            const [summaryRes, insightsRes] = await Promise.all([
                getPostExplanation(dataToUse),
                getPostInsights(dataToUse)
            ]);
            setAiSummary(summaryRes.explanation);
            setAiInsights(insightsRes);
        } catch (err) {
            console.error("Failed to fetch AI content", err);
        } finally {
            setIsFetchingAi(false);
        }
    };

    const getTimeRemaining = () => {
        if (!post?.expiresAt) return null;
        const diff = new Date(post.expiresAt) - new Date();
        if (diff <= 0) return { expired: true, text: 'Expired' };
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (days > 0) return { expired: false, text: `${days}d ${hours}h left`, urgent: days < 1 };
        if (hours > 0) return { expired: false, text: `${hours}h ${mins}m left`, urgent: hours < 3 };
        return { expired: false, text: `${mins}m left`, urgent: true };
    };

    useEffect(() => {
        if (!loading && post && window.location.hash === '#comments') {
            setTimeout(() => {
                const element = document.getElementById('comments');
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 500);
        }
    }, [loading, post]);

    const handleLike = async () => {
        try {
            await api.post(`/posts/${id}/like`);
            if (isLiked) {
                setLikes(likes.filter(uid => uid !== currentUserId));
            } else {
                setLikes([...likes, currentUserId]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleShare = async () => {
        if (hasShared) {
            success('Link already copied!');
            return;
        }
        
        try {
            const sharedPosts = JSON.parse(localStorage.getItem('sharedPosts') || '[]');
            sharedPosts.push(id);
            localStorage.setItem('sharedPosts', JSON.stringify(sharedPosts));
            setHasShared(true);
            
            const res = await api.post(`/posts/${id}/share`);
            setShares(shares + 1);
            await navigator.clipboard.writeText(res?.data?.link || window.location.href);
            success('Link copied to clipboard!');
        } catch {
            try {
                await navigator.clipboard.writeText(window.location.href);
            } catch {
                // Ignore clipboard fallback errors
            }
            success('Link copied to clipboard!');
        }
    };

    const handleContactRequest = async () => {
        if (!user) {
            showError('Please sign in to send contact requests');
            navigate('/');
            return;
        }

        setRequestLoading(true);
        try {
            await api.post('/contacts/request', {
                postId: id,
                recipientId: post.user._id
            });
            success('Contact request sent successfully!');
            setRequestSent(true);
            setContactRequestStatus('pending');
        } catch (err) {
            console.error('Contact request error:', err);
            const errorMessage = err.response?.data?.message || err.response?.data?.msg || 'Failed to send contact request. Please try again.';
            if (errorMessage.toLowerCase().includes('already sent') || errorMessage.toLowerCase().includes('existing request')) {
                setRequestSent(true);
                setContactRequestStatus('pending');
                showError('Request already sent.');
            } else {
                showError(errorMessage);
            }
        } finally {
            setRequestLoading(false);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        try {
            const res = await api.post(`/posts/${id}/comment`, { text: commentText });
            setPost(prev => ({
                ...prev,
                comments: [res.data, ...prev.comments]
            }));
            setCommentText('');
            success('Comment posted!');
        } catch (err) {
            console.error(err);
            showError('Failed to post comment.');
        }
    };

    const handleEditComment = async (commentId) => {
        if (!editText.trim()) return;

        try {
            const res = await api.put(`/posts/${id}/comment/${commentId}`, { text: editText });

            setPost(prev => ({
                ...prev,
                comments: prev.comments.map(c =>
                    c._id === commentId ? res.data : c
                )
            }));

            setEditingComment(null);
            setEditText('');
            success('Comment updated!');
        } catch (err) {
            console.error(err);
            showError('Failed to update comment.');
        }
    };

    const handleDeleteComment = async (commentId) => {
        const confirmed = await dialog.confirm('Are you sure you want to delete this comment?', 'Delete Comment');
        if (!confirmed) return;

        try {
            await api.delete(`/posts/${id}/comment/${commentId}`);

            setPost(prev => ({
                ...prev,
                comments: prev.comments.filter(c => c._id !== commentId)
            }));

            success('Comment deleted!');
        } catch (err) {
            console.error(err);
            showError('Failed to delete comment.');
        }
    };

    const handleDeletePost = async () => {
        const confirmed = await dialog.confirm('Are you sure you want to delete this post?', 'Delete Post');
        if (!confirmed) return;

        try {
            await api.delete(`/posts/${id}`);
            success('Post deleted!');
            navigate('/my-posts');
        } catch (err) {
            console.error(err);
            showError('Failed to delete post.');
        }
    };

    if (loading) return <div className="text-foreground text-center py-20">Loading details...</div>;
    if (!post) return <div className="text-foreground text-center py-20">Post not found</div>;

    const isOwnPost = currentUserId && (post.user._id === currentUserId || post.user === currentUserId);
    const timeRemaining = getTimeRemaining();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="container mx-auto px-3 sm:px-6 py-16 sm:py-24 min-h-screen text-foreground"
        >
            <button
                className="group mb-6 sm:mb-10 flex items-center gap-2 text-text-muted hover:text-primary transition-all font-black text-[10px] uppercase tracking-[0.2em]"
                onClick={() => navigate(-1)}
            >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span>Back to Orbit</span>
            </button>

            {isOwnPost && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-6 sm:mb-8">
                    <button
                        onClick={() => navigate(`/edit-post/${id}`)}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-semibold w-full sm:w-auto"
                    >
                        <Edit2 className="w-4 h-4" />
                        Edit Post
                    </button>
                    <button
                        onClick={handleDeletePost}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-semibold w-full sm:w-auto"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                <div className="lg:col-span-2">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative rounded-3xl overflow-hidden mb-8 shadow-2xl"
                    >
                        {post.images && post.images.length > 0 ? (
                            <img
                                src={post.images[0]}
                                alt={post.title}
                                className="w-full h-[300px] sm:h-[400px] lg:h-[500px] object-cover"
                            />
                        ) : (
                            <div className="w-full h-[300px] sm:h-[400px] lg:h-[500px] bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                                <span className="text-text-muted font-black text-2xl">No Image</span>
                            </div>
                        )}
                        {post.expired || (timeRemaining && timeRemaining.expired) && (
                            <div className="absolute top-4 right-4 px-4 py-2 rounded-full bg-red-500/90 text-white text-xs font-black uppercase tracking-widest shadow-lg">
                                Expired
                            </div>
                        )}
                    </motion.div>

                    <div className="mb-6">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-text-heading mb-4 leading-tight">
                            {post.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-6">
                            {post.location && (
                                <div className="flex items-center gap-2 text-text-muted">
                                    <MapPin className="w-4 h-4" />
                                    <span className="text-sm font-medium">{post.location}</span>
                                </div>
                            )}
                            {timeRemaining && (
                                <div className={cn(
                                    "flex items-center gap-2",
                                    timeRemaining.urgent ? "text-red-500" : "text-text-muted"
                                )}>
                                    <Clock className="w-4 h-4" />
                                    <span className="text-sm font-medium">{timeRemaining.text}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-text-muted">
                                <Heart className="w-4 h-4" />
                                <span className="text-sm font-medium">{likes.length} likes</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleLike}
                                className={cn(
                                    "flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold transition-all",
                                    isLiked
                                        ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                        : "bg-card/10 text-text-muted border border-card-border hover:bg-card/20"
                                )}
                            >
                                <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
                                <span>{isLiked ? 'Liked' : 'Like'}</span>
                            </button>
                            <button
                                onClick={handleShare}
                                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold bg-card/10 text-text-muted border border-card-border hover:bg-card/20 transition-all"
                            >
                                <Share2 className="w-5 h-5" />
                                <span>Share</span>
                            </button>
                        </div>

                        <button
                            onClick={() => setShowFullDetails(!showFullDetails)}
                            className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
                        >
                            {showFullDetails ? (
                                <>
                                    <ChevronUp className="w-5 h-5" />
                                    <span>Show Less</span>
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="w-5 h-5" />
                                    <span>View Full Details</span>
                                </>
                            )}
                        </button>
                    </div>

                    {showFullDetails && (
                        <div className="space-y-8">
                            {post.description && (
                                <div className="p-6 bg-card/10 border border-card-border rounded-2xl shadow-inner">
                                    <h2 className="text-lg font-black text-text-heading mb-3 uppercase tracking-wide">Description</h2>
                                    <p className="text-text-body font-medium leading-relaxed whitespace-pre-wrap">{post.description}</p>
                                </div>
                            )}

                            {post.barterPreferences && (
                                <div className="p-6 bg-card/10 border border-card-border rounded-2xl shadow-inner">
                                    <h2 className="text-lg font-black text-text-heading mb-3 uppercase tracking-wide">Barter Preferences</h2>
                                    <p className="text-text-body font-medium leading-relaxed whitespace-pre-wrap">{post.barterPreferences}</p>
                                </div>
                            )}

                            {post.budgetRange && (
                                <div className="p-6 bg-card/10 border border-card-border rounded-2xl shadow-inner">
                                    <h2 className="text-lg font-black text-text-heading mb-3 uppercase tracking-wide">Budget Range</h2>
                                    <p className="text-text-body font-medium leading-relaxed">{currencySymbol}{post.budgetRange.min} - {currencySymbol}{post.budgetRange.max}</p>
                                </div>
                            )}

                            {post.availability && (
                                <div className="p-6 bg-card/10 border border-card-border rounded-2xl shadow-inner">
                                    <h2 className="text-lg font-black text-text-heading mb-3 uppercase tracking-wide">Availability</h2>
                                    <p className="text-text-body font-medium leading-relaxed whitespace-pre-wrap">{post.availability}</p>
                                </div>
                            )}

                            <div className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl shadow-lg">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-primary/20 rounded-xl">
                                        <Sparkles className="w-5 h-5 text-primary" />
                                    </div>
                                    <h2 className="text-lg font-black text-text-heading uppercase tracking-wide">AI Summary</h2>
                                </div>
                                {isFetchingAi ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                        <span className="text-text-muted font-medium">Generating summary...</span>
                                    </div>
                                ) : aiSummary ? (
                                    <p className="text-text-body font-medium leading-relaxed">{aiSummary}</p>
                                ) : (
                                    <button
                                        onClick={() => fetchAiContent(post)}
                                        className="w-full py-4 rounded-xl bg-primary/20 text-primary font-bold hover:bg-primary/30 transition-all border border-primary/20"
                                    >
                                        Generate AI Summary
                                    </button>
                                )}
                            </div>

                            <div className="p-6 bg-gradient-to-br from-secondary/10 to-amber-500/10 border border-secondary/20 rounded-2xl shadow-lg">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-secondary/20 rounded-xl">
                                        <Navigation className="w-5 h-5 text-secondary" />
                                    </div>
                                    <h2 className="text-lg font-black text-text-heading uppercase tracking-wide">AI Insights</h2>
                                </div>
                                {isFetchingAi ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
                                        <span className="text-text-muted font-medium">Generating insights...</span>
                                    </div>
                                ) : aiInsights ? (
                                    <div className="space-y-3">
                                        {aiInsights.fairPrice && (
                                            <div className="p-4 bg-card/10 rounded-xl border border-card-border">
                                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Fair Price Range</span>
                                                <p className="text-text-heading font-bold mt-1">{aiInsights.fairPrice}</p>
                                            </div>
                                        )}
                                        {aiInsights.marketComparison && (
                                            <div className="p-4 bg-card/10 rounded-xl border border-card-border">
                                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Market Comparison</span>
                                                <p className="text-text-body font-medium mt-1">{aiInsights.marketComparison}</p>
                                            </div>
                                        )}
                                        {aiInsights.risks && aiInsights.risks.length > 0 && (
                                            <div className="p-4 bg-card/10 rounded-xl border border-card-border">
                                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Potential Risks</span>
                                                <ul className="mt-2 space-y-1">
                                                    {aiInsights.risks.map((risk, i) => (
                                                        <li key={i} className="text-text-body font-medium text-sm">• {risk}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {aiInsights.verdict && (
                                            <div className="p-4 bg-card/10 rounded-xl border border-card-border">
                                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Verdict</span>
                                                <p className="text-text-body font-medium mt-1">{aiInsights.verdict}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => fetchAiContent(post)}
                                        className="w-full py-4 rounded-xl bg-secondary/20 text-secondary font-bold hover:bg-secondary/30 transition-all border border-secondary/20"
                                    >
                                        Generate AI Insights
                                    </button>
                                )}
                            </div>

                            {post.locationCoordinates && (
                                <div className="p-6 bg-card/10 border border-card-border rounded-2xl shadow-inner">
                                    <h2 className="text-lg font-black text-text-heading mb-4 uppercase tracking-wide">Location Map</h2>
                                    <div className="h-[300px] rounded-xl overflow-hidden border border-card-border">
                                        <MapContainer
                                            center={[post.locationCoordinates.lat, post.locationCoordinates.lng]}
                                            zoom={15}
                                            className="h-full w-full"
                                        >
                                            <TileLayer
                                                url={isDark
                                                    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                                    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                }
                                            />
                                            <Marker position={[post.locationCoordinates.lat, post.locationCoordinates.lng]}>
                                                <Popup>{post.location}</Popup>
                                            </Marker>
                                        </MapContainer>
                                    </div>
                                </div>
                            )}

                            <div id="comments" className="pt-4">
                                <div className="h-px bg-card-border mb-8" />
                                <h2 className="text-xl font-bold text-foreground mb-6">Comments ({post.comments?.length || 0})</h2>

                                {user ? (
                                    <form onSubmit={handleCommentSubmit} className="mb-8 flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-card/10 overflow-hidden shrink-0 border border-card-border shadow-sm">
                                            <img src={getAvatarUrl(user)} alt={user.displayName} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 relative">
                                            <input
                                                type="text"
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                placeholder="Add a comment..."
                                                className="w-full bg-card/10 border border-card-border rounded-xl pl-4 pr-12 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!commentText.trim()}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                                            >
                                                <MessageCircle className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="mb-8 p-4 bg-card/10 border border-card-border rounded-xl text-center text-muted-foreground text-sm font-medium">
                                        Please <button onClick={() => navigate('/login')} className="text-primary font-bold hover:underline">sign in</button> to comment.
                                    </div>
                                )}

                                <div className="space-y-6">
                                    {post.comments?.length > 0 ? (
                                        post.comments.map((comment, index) => (
                                            <div key={index} className="flex gap-4 group">
                                                <div className="w-10 h-10 rounded-full bg-card/10 overflow-hidden shrink-0 border border-card-border shadow-sm">
                                                    <img src={getAvatarUrl(comment.user)} alt={comment.user?.displayName || "User"} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-foreground">{comment.user?.displayName || "Unknown User"}</span>
                                                            <span className="text-xs text-muted-foreground font-medium">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                        {currentUserId && comment.user?._id === currentUserId && (
                                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingComment(comment._id);
                                                                        setEditText(comment.text);
                                                                    }}
                                                                    className="text-xs text-blue-400 hover:text-blue-300"
                                                                    title="Edit"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteComment(comment._id)}
                                                                    className="text-xs text-red-400 hover:text-red-300"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {editingComment === comment._id ? (
                                                        <div className="flex gap-2 mb-2">
                                                            <input
                                                                type="text"
                                                                value={editText}
                                                                onChange={(e) => setEditText(e.target.value)}
                                                                className="flex-1 bg-card/10 border border-card-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 shadow-inner"
                                                                autoFocus
                                                            />
                                                            <button
                                                                onClick={() => handleEditComment(comment._id)}
                                                                disabled={!editText.trim()}
                                                                className="text-primary text-sm font-medium hover:text-primary-foreground disabled:opacity-50"
                                                            >
                                                                Save
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingComment(null);
                                                                    setEditText('');
                                                                }}
                                                                className="text-text-muted text-sm font-medium hover:text-text-heading"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <p className="text-muted-foreground font-medium">{comment.text}</p>
                                                    )}

                                                    {editingComment !== comment._id && (
                                                        <button
                                                            onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                                                            className="text-xs text-primary mt-2 hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            Reply
                                                        </button>
                                                    )}

                                                    {replyingTo === comment._id && (
                                                        <div className="mt-3 flex gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                                            <input
                                                                type="text"
                                                                value={replyText}
                                                                onChange={(e) => setReplyText(e.target.value)}
                                                                placeholder={`Reply to ${comment.user?.displayName}...`}
                                                                className="flex-1 bg-card/10 border border-card-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 shadow-inner"
                                                                autoFocus
                                                            />
                                                            <button
                                                                onClick={() => handleReplySubmit(comment._id)}
                                                                disabled={!replyText.trim()}
                                                                className="text-primary text-sm font-medium hover:text-text-heading disabled:opacity-50"
                                                            >
                                                                Send
                                                            </button>
                                                        </div>
                                                    )}

                                                    {comment.replies && comment.replies.length > 0 && (
                                                        <div className="mt-4 space-y-4 border-l-2 border-card-border pl-4">
                                                            {comment.replies.map((reply, rIndex) => (
                                                                <div key={rIndex} className="flex gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-background-section overflow-hidden shrink-0 border border-card-border shadow-sm">
                                                                        <img src={getAvatarUrl(reply.user)} alt={reply.user?.displayName || "User"} className="w-full h-full object-cover" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-0.5">
                                                                            <span className="font-bold text-sm text-text-heading">{reply.user?.displayName}</span>
                                                                            <span className="text-[10px] text-text-muted font-medium">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                                                        </div>
                                                                        <p className="text-sm text-text-body font-medium">{reply.text}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-text-muted text-center py-8">No comments yet. Be the first to comment!</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <aside className="lg:col-span-1">
                    <div className="glass-panel p-5 sm:p-8 lg:p-10 lg:sticky lg:top-24 shadow-2xl space-y-6 sm:space-y-8">
                        <div>
                            <label className="text-[10px] font-black tracking-widest text-text-muted uppercase mb-2 block">Value Orbit</label>
                            <div className="text-5xl font-black text-text-heading tracking-tight">
                                {post.acceptsBarter ? (
                                    <span className="text-pink-500 text-3xl">EXCHANGE</span>
                                ) : (
                                    <>{currencySymbol}{post.price}</>
                                )}
                            </div>
                        </div>

                        <div className="h-px bg-card-border" />

                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-background-section overflow-hidden border border-card-border shadow-xl">
                                <img src={getAvatarUrl(post.user)} alt={post.user?.displayName} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <div className="text-[10px] font-black tracking-widest text-text-muted uppercase mb-1">Provider</div>
                                <div className="font-black text-text-heading text-xl leading-none">{post.user?.displayName}</div>
                                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 text-[10px] font-black border border-amber-500/20">
                                    ★ {post.user?.rating?.toFixed(1) || '0.0'}
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-card-border" />

                        {!isOwnPost && (
                            <div className="space-y-3">
                                <button
                                    onClick={handleContactRequest}
                                    disabled={requestLoading || requestSent}
                                    className={cn(
                                        "w-full py-5 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-3 shadow-xl",
                                        requestSent
                                            ? "bg-card text-text-muted border border-card-border opacity-80 cursor-default"
                                            : "bg-primary text-primary-foreground hover:scale-[1.02] shadow-[0_20px_50px_rgba(245,158,11,0.3)] active:scale-95"
                                    )}
                                >
                                    {requestLoading ? (
                                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            {requestSent ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                                            <span>{requestSent ? 'Connection Pending' : 'Join Circle'}</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={handleMessage}
                                    disabled={!hasChatAccess}
                                    className={cn(
                                        "w-full py-5 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-3 border border-card-border",
                                        hasChatAccess
                                            ? "bg-card text-text-heading hover:bg-hover-bg shadow-xl"
                                            : "bg-card/30 text-text-muted/50 border border-card-border/30 cursor-not-allowed"
                                    )}
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    <span>{hasChatAccess ? 'Open Chat' : 'Chat Locked'}</span>
                                </button>

                                {hasChatAccess && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={handleCall}
                                            className="py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-card-border bg-green-500/10 text-green-400 hover:bg-green-500/20"
                                        >
                                            <Phone className="w-4 h-4" />
                                            Call
                                        </button>
                                        <button
                                            onClick={handleText}
                                            className="py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-card-border bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                            Text
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="pt-4 text-center">
                            <p className="text-[10px] text-text-muted font-black uppercase tracking-widest leading-relaxed">
                                Safety Protocol: Exchange in Neutral Zones.
                            </p>
                        </div>
                    </div>
                </aside>
            </div>
        </motion.div>
    );
};

export default PostDetails;