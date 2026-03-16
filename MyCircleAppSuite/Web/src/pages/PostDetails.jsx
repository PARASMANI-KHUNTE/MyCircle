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
import { getPostInsights, getPostExplanation } from '../services/aiService';
import {
    ArrowLeft, MapPin, DollarSign, Clock, MessageCircle,
    Share2, Heart, Repeat, Phone, UserPlus, UserCheck,
    Check, Copy, Edit2, Trash2, Sparkles, Navigation
} from 'lucide-react';
import { useDialog } from '../hooks/useDialog';
import { useTheme } from '../context/ThemeContext';
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
    const [replyingTo, setReplyingTo] = useState(null); // Comment ID being replied to
    const [replyText, setReplyText] = useState('');
    const [editingComment, setEditingComment] = useState(null); // Comment ID being edited
    const [editText, setEditText] = useState('');
    const [aiSummary, setAiSummary] = useState('');
    const [aiInsights, setAiInsights] = useState(null);
    const [isFetchingAi, setIsFetchingAi] = useState(false);

    const currentUserId = user?._id || user?.id;
    const isLiked = currentUserId && likes.includes(currentUserId);

    const handleReplySubmit = async (commentId) => {
        if (!replyText.trim()) return;

        try {
            const res = await api.post(`/posts/${id}/comment/${commentId}/reply`, { text: replyText });

            // Update UI optimistically or fetch fresh post
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
        if (contactRequestStatus !== 'approved') {
            showError('Chat unlocks only after your request is approved.');
            return;
        }
        try {
            await api.post(`/chat/init/${post.user._id}`);
            navigate(`/chat?recipientId=${post.user._id}`);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 403) {
                showError('You must have an approved contact request to message this user.');
            } else {
                showError('Failed to start chat. Please try again.');
            }
        }
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

                // Fetch Related Posts
                try {
                    const relatedRes = await api.get(`/posts/related/${id}`);
                    setRelatedPosts(relatedRes.data);
                } catch (error) {
                    console.error("Failed to fetch related posts", error);
                }

                setLoading(false);

                // Fetch AI Content
                // fetchAiContent(res.data); // Removed auto-fetch
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

    // Handle Deep Linking Scroll
    useEffect(() => {
        if (!loading && post && window.location.hash === '#comments') {
            setTimeout(() => {
                const element = document.getElementById('comments');
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 500); // Small delay to ensuring rendering
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

            // Update UI
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

            // Update UI
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

    if (loading) return <div className="text-foreground text-center py-20">Loading details...</div>;
    if (!post) return <div className="text-foreground text-center py-20">Post not found</div>;

    const isOwnPost = currentUserId && post.user._id === currentUserId;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="container mx-auto px-6 py-24 min-h-screen text-foreground"
        >
            <button
                className="group mb-10 flex items-center gap-2 text-text-muted hover:text-primary transition-all font-black text-[10px] uppercase tracking-[0.2em]"
                onClick={() => navigate(-1)}
            >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span>Back to Orbit</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Hero Image */}
                    <div className="rounded-[2.5rem] overflow-hidden aspect-video relative group shadow-2xl border border-card-border">
                        {post.images && post.images.length > 0 ? (
                            <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex items-center justify-center h-full text-text-muted bg-background-section">
                                No Image Available
                            </div>
                        )}
                    </div>

                    {/* Title & Info */}
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-2">
                            <span className={cn(
                                "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                                post.type === 'job' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                    post.type === 'sell' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                        'bg-primary/10 text-primary border-primary/20'
                            )}>
                                {post.type}
                            </span>
                            {post.acceptsBarter && (
                                <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-pink-500/10 text-pink-500 border border-pink-500/20 flex items-center gap-1">
                                    <Repeat className="w-3 h-3" /> Barter Ready
                                </span>
                            )}
                        </div>

                        <div className="flex justify-between items-start gap-6">
                            <h1 className="text-5xl md:text-6xl font-black text-text-heading tracking-tight leading-[0.9]">
                                {post.title}
                            </h1>
                            <div className="flex gap-2 shrink-0">
                                <button
                                    onClick={() => fetchAiContent(post)}
                                    className={cn(
                                        "p-4 rounded-2xl bg-card border border-card-border shadow-xl hover:shadow-2xl transition-all duration-500",
                                        isFetchingAi || aiSummary ? 'text-primary border-primary/30' : 'text-text-muted hover:text-text-heading hover:bg-hover-bg'
                                    )}
                                    title="AI Synthesis"
                                    disabled={isFetchingAi}
                                >
                                    <Sparkles className={cn("w-5 h-5", isFetchingAi && "animate-spin")} />
                                </button>
                                <button
                                    onClick={handleShare}
                                    className={cn(
                                        "p-4 rounded-2xl bg-card border border-card-border shadow-xl hover:shadow-2xl transition-all duration-500",
                                        hasShared ? 'text-blue-500 border-blue-500/30' : 'text-text-muted hover:text-text-heading hover:bg-hover-bg'
                                    )}
                                    title={hasShared ? "Link already copied!" : "Copy share link"}
                                >
                                    <Share2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleLike}
                                    className={cn(
                                        "p-4 rounded-2xl bg-card border border-card-border shadow-xl hover:shadow-2xl transition-all duration-500",
                                        isLiked ? 'text-pink-500 border-pink-500/30' : 'text-text-muted hover:text-text-heading hover:bg-hover-bg'
                                    )}
                                >
                                    <Heart className={cn("w-5 h-5", isLiked && "fill-current scale-110")} />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-8 text-[11px] font-black uppercase tracking-widest text-text-muted border-t border-card-border pt-6">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" /> {post.location}
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" /> {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                            <div className="flex items-center gap-2 text-pink-500">
                                <Heart className="w-4 h-4 fill-current opacity-50" /> {likes.length} Interactions
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-card-border/50" />

                    {/* Description */}
                    <div>
                        <h2 className="text-xl font-bold text-text-heading mb-4">Description</h2>
                        <p className="text-text-body leading-relaxed text-lg whitespace-pre-wrap font-medium">
                            {post.description}
                        </p>

                        {post.acceptsBarter && post.barterPreferences && (
                            <div className="mt-6 p-4 rounded-xl bg-pink-500/5 border border-pink-500/20">
                                <h3 className="text-pink-600 font-semibold mb-2 flex items-center gap-2">
                                    <Repeat className="w-4 h-4" /> Barter Preferences
                                </h3>
                                <p className="text-text-body font-medium">
                                    {post.barterPreferences}
                                </p>
                            </div>
                        )}

                        {/* AI Summary Section */}
                        {(aiSummary || isFetchingAi) && (
                            <div className="mt-8 p-6 rounded-2xl bg-primary/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Sparkles className="w-12 h-12 text-primary" />
                                </div>
                                <div className="flex items-center gap-2 mb-4 text-primary">
                                    <Sparkles className="w-5 h-5" />
                                    <span className="text-sm font-bold uppercase tracking-widest">AI Summary</span>
                                </div>
                                {isFetchingAi ? (
                                    <div className="space-y-2">
                                        <div className="h-4 bg-primary/10 rounded w-full animate-pulse" />
                                        <div className="h-4 bg-primary/10 rounded w-3/4 animate-pulse" />
                                    </div>
                                ) : (
                                    <p className="text-text-body leading-relaxed italic text-lg opacity-90">
                                        "{aiSummary}"
                                    </p>
                                )}
                            </div>
                        )}

                        {/* AI Insights Section */}
                        {aiInsights && (
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-card border border-card-border shadow-sm">
                                    <p className="text-xs text-text-muted uppercase font-bold mb-1">Market Demand</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-background-section rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${aiInsights.demandScore * 10 || 50}%` }}
                                                className="h-full bg-primary"
                                            />
                                        </div>
                                        <span className="text-sm text-text-heading font-medium">{aiInsights.demandLevel}</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-card border border-card-border shadow-sm">
                                    <p className="text-xs text-text-muted uppercase font-bold mb-1">Price Analysis</p>
                                    <p className="text-sm text-text-heading font-medium">{aiInsights.priceAnalysis}</p>
                                </div>
                            </div>
                        )}

                        {/* Location Map Section */}
                        {post.locationCoords?.coordinates?.length === 2 && (
                            <div className="mt-8">
                                <h2 className="text-xl font-bold text-text-heading mb-4 flex items-center gap-2">
                                    <Navigation className="w-5 h-5 text-primary" /> Location
                                </h2>
                                <div className="w-full h-[400px] rounded-[2.5rem] overflow-hidden shadow-2xl border border-card-border">
                                    <MapContainer
                                        center={[post.locationCoords.coordinates[1], post.locationCoords.coordinates[0]]}
                                        zoom={14}
                                        scrollWheelZoom={false}
                                        className="w-full h-full"
                                    >
                                        <TileLayer url={isDark
                                            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                            : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
                                        />
                                        <Marker position={[post.locationCoords.coordinates[1], post.locationCoords.coordinates[0]]}>
                                            <Popup className="custom-popup">
                                                <div className="p-1 font-bold text-text-heading">{post.location}</div>
                                            </Popup>
                                        </Marker>
                                    </MapContainer>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Comments Section */}
                    <div id="comments">
                        <div className="h-px bg-card-border mb-8" />
                        <h2 className="text-xl font-bold text-foreground mb-6">Comments ({post.comments?.length || 0})</h2>

                        {/* New Comment Input */}
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

                        {/* Comments List */}
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
                                                {/* Edit/Delete buttons for comment owner */}
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

                                            {/* Comment Text or Edit Mode */}
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

                                            {/* Reply Button */}
                                            {editingComment !== comment._id && (
                                                <button
                                                    onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                                                    className="text-xs text-primary mt-2 hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    Reply
                                                </button>
                                            )}

                                            {/* Reply Form */}
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

                                            {/* Nested Replies */}
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
                                <p className="text-muted-foreground italic font-medium">No comments yet. Be the first to start a conversation!</p>
                            )}
                        </div>
                    </div>

                    {/* Related Posts */}
                    {relatedPosts.length > 0 && (
                        <div>
                            <div className="h-px bg-card-border mb-8" />
                            <h2 className="text-xl font-bold text-foreground mb-4">Related Posts</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {relatedPosts.map(post => (
                                    <PostCard key={post._id} post={post} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <aside className="lg:col-span-1">
                    <div className="glass-panel p-10 sticky top-24 shadow-2xl space-y-8">
                        <div>
                            <label className="text-[10px] font-black tracking-widest text-text-muted uppercase mb-2 block">Value Orbit</label>
                            <div className="text-5xl font-black text-text-heading tracking-tight">
                                {post.acceptsBarter ? (
                                    <span className="text-pink-500 text-3xl">EXCHANGE</span>
                                ) : (
                                    <>₹{post.price}</>
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
                                    disabled={contactRequestStatus !== 'approved'}
                                    className={cn(
                                        "w-full py-5 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-3 border border-card-border",
                                        contactRequestStatus === 'approved'
                                            ? "bg-card text-text-heading hover:bg-hover-bg shadow-xl"
                                            : "bg-card/30 text-text-muted/50 border border-card-border/30 cursor-not-allowed"
                                    )}
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    <span>{contactRequestStatus === 'approved' ? 'Open Channel' : 'Channel Locked'}</span>
                                </button>
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
