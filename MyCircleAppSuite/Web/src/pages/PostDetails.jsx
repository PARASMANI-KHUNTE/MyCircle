import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { cn } from '../utils/cn';
import api from '../utils/api';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { getAvatarUrl } from '../utils/avatar';
import { getPostInsights, getPostExplanation } from '../services/aiService';
import {
    ArrowLeft, MapPin, Clock, MessageCircle, Share2, Heart,
    Phone, UserPlus, UserCheck, Edit2, Trash2, Sparkles, Navigation, MessageSquare,
    ShoppingBag, ShieldCheck, Wallet,
} from 'lucide-react';
import CheckoutModal from '../components/ui/CheckoutModal';
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

const DetailBlock = ({ title, children }) => (
    <section className="border-t border-card-border pt-5">
        <h2 className="mb-2 text-sm font-semibold text-foreground">{title}</h2>
        <div className="text-sm leading-relaxed text-foreground-secondary">{children}</div>
    </section>
);

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
        try {
            const sharedPosts = JSON.parse(localStorage.getItem('sharedPosts') || '[]');
            return sharedPosts.includes(id);
        } catch {
            return false;
        }
    });
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [editingComment, setEditingComment] = useState(null);
    const [editText, setEditText] = useState('');
    const [aiSummary, setAiSummary] = useState('');
    const [aiInsights, setAiInsights] = useState(null);
    const [isFetchingAi, setIsFetchingAi] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [activeEscrow, setActiveEscrow] = useState(null);
    const [relatedPosts, setRelatedPosts] = useState([]);

    const currentUserId = user?._id || user?.id;
    const isLiked = currentUserId && likes.some((uid) => String(uid) === String(currentUserId));
    const hasChatAccess = contactRequestStatus === 'accepted' || contactRequestStatus === 'approved' || !!activeEscrow;

    useEffect(() => {
        let active = true;

        const fetchPost = async () => {
            try {
                const res = await api.get(`/posts/${id}`);
                if (!active) return;
                setPost(res.data);
                setLikes(res.data.likes || []);
                setShares(res.data.shares || 0);
                setRequestSent(!!res.data.hasRequested);
                if (user) {
                    try {
                        const escRes = await api.get(`/payments/escrow/post/${id}`);
                        if (active && escRes.data?.hasActiveEscrow) {
                            setActiveEscrow(escRes.data.escrow);
                        }
                    } catch {
                        // ignore
                    }
                }
                setContactRequestStatus(
                    res.data.contactRequestStatus || (res.data.hasRequested ? 'pending' : 'none')
                );
            } catch {
                if (active) showError('Could not load this post.');
            } finally {
                if (active) setLoading(false);
            }
        };

        void fetchPost();
        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        let active = true;

        const fetchRelated = async () => {
            try {
                const res = await api.get(`/posts/related/${id}`);
                if (active) setRelatedPosts(Array.isArray(res.data) ? res.data : []);
            } catch {
                if (active) setRelatedPosts([]);
            }
        };

        void fetchRelated();
        return () => {
            active = false;
        };
    }, [id]);

    useEffect(() => {
        if (!loading && post && window.location.hash === '#comments') {
            const timer = window.setTimeout(() => {
                document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' });
            }, 200);
            return () => window.clearTimeout(timer);
        }
        return undefined;
    }, [loading, post]);

    const fetchAiContent = async () => {
        if (!post || isFetchingAi) return;
        setIsFetchingAi(true);
        try {
            const [summaryRes, insightsRes] = await Promise.all([
                getPostExplanation(post),
                getPostInsights(post),
            ]);
            setAiSummary(summaryRes?.explanation || '');
            setAiInsights(insightsRes || null);
        } catch {
            showError('AI insights are unavailable right now.');
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

    const handleLike = async () => {
        if (!currentUserId) {
            showError('Please sign in to like posts.');
            return;
        }
        try {
            await api.post(`/posts/${id}/like`);
            setLikes((prev) =>
                isLiked
                    ? prev.filter((uid) => String(uid) !== String(currentUserId))
                    : [...prev, currentUserId]
            );
        } catch {
            showError('Could not update like.');
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
            setShares((prev) => prev + 1);
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

    const handleMessage = async () => {
        if (!hasChatAccess) {
            showError('Chat unlocks only after your request is approved.');
            return;
        }
        try {
            const res = await api.post(`/chat/init/${post.user._id}`, { postId: id });
            if (!res.data?._id) throw new Error('Conversation was not created');
            navigate(`/chat?conversationId=${res.data._id}`);
        } catch (err) {
            if (err.response?.status === 403) {
                showError('You must have an approved contact request to message this user.');
            } else {
                showError('Failed to start chat. Please try again.');
            }
        }
    };

    const handleCall = () => {
        // Contact details are stored on the post, not the seller profile.
        const phone = post?.contactPhone || post?.contactWhatsapp;
        if (!phone) {
            showError('Phone number not available');
            return;
        }
        window.open(`tel:${phone}`, '_blank');
    };

    const handleText = () => {
        const phone = post?.contactWhatsapp || post?.contactPhone;
        if (!phone) {
            showError('Phone number not available');
            return;
        }
        window.open(`sms:${phone}`, '_blank');
    };

    const handleContactRequest = async () => {
        if (!user) {
            showError('Please sign in to send contact requests');
            navigate('/login');
            return;
        }

        setRequestLoading(true);
        try {
            await api.post('/contacts/request', { postId: id, recipientId: post.user._id });
            success('Contact request sent.');
            setRequestSent(true);
            setContactRequestStatus('pending');
        } catch (err) {
            const message =
                err.response?.data?.message ||
                err.response?.data?.msg ||
                'Failed to send contact request. Please try again.';
            if (/already sent|existing request/i.test(message)) {
                setRequestSent(true);
                setContactRequestStatus('pending');
                showError('Request already sent.');
            } else {
                showError(message);
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
            setPost((prev) => ({ ...prev, comments: [res.data, ...(prev.comments || [])] }));
            setCommentText('');
            success('Comment posted!');
        } catch {
            showError('Failed to post comment.');
        }
    };

    const handleEditComment = async (commentId) => {
        if (!editText.trim()) return;
        try {
            const res = await api.put(`/posts/${id}/comment/${commentId}`, { text: editText });
            setPost((prev) => ({
                ...prev,
                comments: prev.comments.map((c) => (c._id === commentId ? res.data : c)),
            }));
            setEditingComment(null);
            setEditText('');
            success('Comment updated!');
        } catch {
            showError('Failed to update comment.');
        }
    };

    const handleDeleteComment = async (commentId) => {
        const confirmed = await dialog.confirm('Delete this comment?', 'Delete Comment');
        if (!confirmed) return;
        try {
            await api.delete(`/posts/${id}/comment/${commentId}`);
            setPost((prev) => ({
                ...prev,
                comments: prev.comments.filter((c) => c._id !== commentId),
            }));
            success('Comment deleted!');
        } catch {
            showError('Failed to delete comment.');
        }
    };

    const handleReplySubmit = async (commentId) => {
        if (!replyText.trim()) return;
        try {
            const res = await api.post(`/posts/${id}/comment/${commentId}/reply`, { text: replyText });
            setPost((prev) => ({
                ...prev,
                comments: prev.comments.map((c) =>
                    c._id === commentId ? { ...c, replies: [...(c.replies || []), res.data] } : c
                ),
            }));
            setReplyText('');
            setReplyingTo(null);
            success('Reply posted!');
        } catch {
            showError('Failed to post reply.');
        }
    };

    const handleDeletePost = async () => {
        const confirmed = await dialog.confirm('Are you sure you want to delete this post?', 'Delete Post');
        if (!confirmed) return;
        try {
            await api.delete(`/posts/${id}`);
            success('Post deleted!');
            navigate('/my-posts');
        } catch {
            showError('Failed to delete post.');
        }
    };

    if (loading) return <Loading fullscreen text="Loading post..." />;

    if (!post) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-16 text-center">
                <p className="text-sm text-foreground-muted">This post could not be found.</p>
                <Button className="mt-4" variant="outline" onClick={() => navigate(-1)}>
                    Go back
                </Button>
            </div>
        );
    }

    const isOwnPost = currentUserId && String(post.user?._id) === String(currentUserId);
    const timeRemaining = getTimeRemaining();
    const isExpired = post.expired || timeRemaining?.expired;
    const canBuy = !isOwnPost && Number(post.price) > 0 && !isExpired && post.isActive !== false;

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <button
                type="button"
                className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
                onClick={() => navigate(-1)}
            >
                <ArrowLeft className="h-4 w-4" />
                Back
            </button>

            {isOwnPost && (
                <div className="mb-5 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/edit-post/${id}`)}>
                        <Edit2 className="mr-1.5 h-4 w-4" />
                        Edit post
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-error hover:bg-error/10 hover:text-error"
                        onClick={handleDeletePost}
                    >
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        Delete
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
                <div className="lg:col-span-2">
                    <div className="relative overflow-hidden rounded-2xl border border-card-border bg-background-secondary">
                        {post.images?.length > 0 ? (
                            <img
                                src={post.images[0]}
                                alt={post.title}
                                className="h-[280px] w-full object-cover sm:h-[400px]"
                            />
                        ) : (
                            <div className="flex h-[280px] w-full items-center justify-center sm:h-[400px]">
                                <span className="text-2xl font-semibold text-foreground-muted/40">
                                    {post.title?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                            </div>
                        )}
                        {isExpired && (
                            <span className="absolute right-3 top-3 rounded-md bg-foreground/80 px-2.5 py-1 text-xs font-medium text-background">
                                Expired
                            </span>
                        )}
                    </div>

                    <div className="mt-5">
                        <h1 className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
                            {post.title}
                        </h1>

                        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-foreground-muted">
                            {post.location && (
                                <span className="inline-flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4" />
                                    {post.location}
                                </span>
                            )}
                            {timeRemaining && (
                                <span
                                    className={cn(
                                        'inline-flex items-center gap-1.5',
                                        timeRemaining.urgent && 'text-primary'
                                    )}
                                >
                                    <Clock className="h-4 w-4" />
                                    {timeRemaining.text}
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1.5">
                                <Heart className="h-4 w-4" />
                                {likes.length} likes
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <Share2 className="h-4 w-4" />
                                {shares} shares
                            </span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <Button variant={isLiked ? 'primary' : 'outline'} size="sm" onClick={handleLike}>
                                <Heart className={cn('mr-1.5 h-4 w-4', isLiked && 'fill-current')} />
                                {isLiked ? 'Liked' : 'Like'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleShare}>
                                <Share2 className="mr-1.5 h-4 w-4" />
                                Share
                            </Button>
                        </div>

                        <div className="mt-6 space-y-5">
                            {post.description && <DetailBlock title="Description">{post.description}</DetailBlock>}

                            {post.barterPreferences && (
                                <DetailBlock title="Barter preferences">{post.barterPreferences}</DetailBlock>
                            )}

                            {post.budgetRange && (
                                <DetailBlock title="Budget range">
                                    {currencySymbol}
                                    {post.budgetRange.min} – {currencySymbol}
                                    {post.budgetRange.max}
                                </DetailBlock>
                            )}

                            {post.availability && (
                                <DetailBlock title="Availability">{post.availability}</DetailBlock>
                            )}

                            <section className="border-t border-card-border pt-5">
                                <div className="flex items-center justify-between gap-3">
                                    <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                        AI insights
                                    </h2>
                                    {!aiSummary && !aiInsights && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={fetchAiContent}
                                            loading={isFetchingAi}
                                        >
                                            Generate
                                        </Button>
                                    )}
                                </div>

                                {aiSummary && (
                                    <p className="mt-3 text-sm leading-relaxed text-foreground-secondary">
                                        {aiSummary}
                                    </p>
                                )}

                                {aiInsights && (
                                    <div className="mt-3 space-y-3">
                                        {aiInsights.fairPrice && (
                                            <div className="rounded-xl border border-card-border bg-background-secondary p-3">
                                                <p className="section-label">Fair price</p>
                                                <p className="mt-1 text-sm font-medium text-foreground">
                                                    {aiInsights.fairPrice}
                                                </p>
                                            </div>
                                        )}
                                        {aiInsights.marketComparison && (
                                            <div className="rounded-xl border border-card-border bg-background-secondary p-3">
                                                <p className="section-label">Market comparison</p>
                                                <p className="mt-1 text-sm text-foreground-secondary">
                                                    {aiInsights.marketComparison}
                                                </p>
                                            </div>
                                        )}
                                        {aiInsights.risks?.length > 0 && (
                                            <div className="rounded-xl border border-card-border bg-background-secondary p-3">
                                                <p className="section-label">Potential risks</p>
                                                <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-foreground-secondary">
                                                    {aiInsights.risks.map((risk, i) => (
                                                        <li key={i}>{risk}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {aiInsights.verdict && (
                                            <div className="rounded-xl border border-card-border bg-background-secondary p-3">
                                                <p className="section-label">Verdict</p>
                                                <p className="mt-1 text-sm text-foreground-secondary">
                                                    {aiInsights.verdict}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </section>

                            {post.locationCoordinates && (
                                <section className="border-t border-card-border pt-5">
                                    <h2 className="mb-3 text-sm font-semibold text-foreground">Location</h2>
                                    <div className="h-[260px] overflow-hidden rounded-xl border border-card-border">
                                        <MapContainer
                                            center={[post.locationCoordinates.lat, post.locationCoordinates.lng]}
                                            zoom={15}
                                            className="h-full w-full"
                                        >
                                            <TileLayer
                                                url={
                                                    isDark
                                                        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                                                        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                                                }
                                            />
                                            <Marker
                                                position={[
                                                    post.locationCoordinates.lat,
                                                    post.locationCoordinates.lng,
                                                ]}
                                            >
                                                <Popup>{post.location}</Popup>
                                            </Marker>
                                        </MapContainer>
                                    </div>
                                </section>
                            )}

                            <section id="comments" className="border-t border-card-border pt-5">
                                <h2 className="mb-4 text-sm font-semibold text-foreground">
                                    Comments ({post.comments?.length || 0})
                                </h2>

                                {user ? (
                                    <form onSubmit={handleCommentSubmit} className="mb-5 flex gap-3">
                                        <img
                                            src={getAvatarUrl(user)}
                                            alt={user.displayName || 'You'}
                                            className="h-9 w-9 rounded-full object-cover"
                                        />
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                placeholder="Add a comment..."
                                                className="input-modern pr-12"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!commentText.trim()}
                                                aria-label="Post comment"
                                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-primary transition-colors hover:bg-primary/10 disabled:opacity-40"
                                            >
                                                <MessageCircle className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="mb-5 rounded-xl border border-card-border bg-background-secondary p-4 text-center text-sm text-foreground-muted">
                                        <button
                                            onClick={() => navigate('/login')}
                                            className="font-medium text-primary hover:underline"
                                        >
                                            Sign in
                                        </button>{' '}
                                        to comment.
                                    </div>
                                )}

                                <div className="space-y-5">
                                    {post.comments?.length > 0 ? (
                                        post.comments.map((comment, index) => (
                                            <div key={comment._id || index} className="group flex gap-3">
                                                <img
                                                    src={getAvatarUrl(comment.user)}
                                                    alt={comment.user?.displayName || 'User'}
                                                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium text-foreground">
                                                                {comment.user?.displayName || 'Unknown user'}
                                                            </span>
                                                            <span className="text-xs text-foreground-muted">
                                                                {new Date(comment.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        {currentUserId &&
                                                            String(comment.user?._id) === String(currentUserId) && (
                                                                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingComment(comment._id);
                                                                            setEditText(comment.text);
                                                                        }}
                                                                        className="rounded-md p-1 text-foreground-muted hover:text-foreground"
                                                                        aria-label="Edit comment"
                                                                    >
                                                                        <Edit2 className="h-3.5 w-3.5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteComment(comment._id)}
                                                                        className="rounded-md p-1 text-foreground-muted hover:text-error"
                                                                        aria-label="Delete comment"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                    </div>

                                                    {editingComment === comment._id ? (
                                                        <div className="mt-2 flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={editText}
                                                                onChange={(e) => setEditText(e.target.value)}
                                                                className="input-modern py-2 text-sm"
                                                                autoFocus
                                                            />
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleEditComment(comment._id)}
                                                                disabled={!editText.trim()}
                                                            >
                                                                Save
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => {
                                                                    setEditingComment(null);
                                                                    setEditText('');
                                                                }}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <p className="mt-1 text-sm leading-relaxed text-foreground-secondary">
                                                            {comment.text}
                                                        </p>
                                                    )}

                                                    {editingComment !== comment._id && (
                                                        <button
                                                            onClick={() =>
                                                                setReplyingTo(
                                                                    replyingTo === comment._id ? null : comment._id
                                                                )
                                                            }
                                                            className="mt-1 text-xs font-medium text-primary hover:underline"
                                                        >
                                                            Reply
                                                        </button>
                                                    )}

                                                    {replyingTo === comment._id && (
                                                        <div className="mt-2 flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={replyText}
                                                                onChange={(e) => setReplyText(e.target.value)}
                                                                placeholder={`Reply to ${comment.user?.displayName || 'user'}...`}
                                                                className="input-modern py-2 text-sm"
                                                                autoFocus
                                                            />
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleReplySubmit(comment._id)}
                                                                disabled={!replyText.trim()}
                                                            >
                                                                Send
                                                            </Button>
                                                        </div>
                                                    )}

                                                    {comment.replies?.length > 0 && (
                                                        <div className="mt-3 space-y-3 border-l border-card-border pl-3">
                                                            {comment.replies.map((reply, rIndex) => (
                                                                <div key={reply._id || rIndex} className="flex gap-2">
                                                                    <img
                                                                        src={getAvatarUrl(reply.user)}
                                                                        alt={reply.user?.displayName || 'User'}
                                                                        className="h-7 w-7 shrink-0 rounded-full object-cover"
                                                                    />
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs font-medium text-foreground">
                                                                                {reply.user?.displayName}
                                                                            </span>
                                                                            <span className="text-[11px] text-foreground-muted">
                                                                                {new Date(reply.createdAt).toLocaleDateString()}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-sm text-foreground-secondary">
                                                                            {reply.text}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="py-6 text-center text-sm text-foreground-muted">
                                            No comments yet. Be the first to comment.
                                        </p>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

                <aside className="lg:col-span-1">
                    <div className="space-y-5 rounded-2xl border border-card-border bg-card p-5 lg:sticky lg:top-20">
                        <div>
                            <p className="section-label">
                                {post.acceptsBarter ? 'Exchange' : 'Price'}
                            </p>
                            <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
                                {post.acceptsBarter ? 'Barter' : `${currencySymbol}${post.price ?? '—'}`}
                            </p>
                        </div>

                        <div className="flex items-center gap-3 border-t border-card-border pt-4">
                            <img
                                src={getAvatarUrl(post.user)}
                                alt={post.user?.displayName || 'Seller'}
                                className="h-12 w-12 rounded-full object-cover"
                            />
                            <div className="min-w-0 flex-1">
                                <p className="section-label">Posted by</p>
                                <p className="truncate text-sm font-semibold text-foreground">
                                    {post.user?.displayName || 'User'}
                                </p>
                                {post.user?.rating != null && (
                                    <p className="mt-0.5 text-xs text-foreground-muted">
                                        ★ {Number(post.user.rating).toFixed(1)}
                                    </p>
                                )}
                            </div>
                        </div>

                        {!isOwnPost && (
                            <div className="space-y-2 border-t border-card-border pt-4">
                                {activeEscrow ? (
                                    <div className="rounded-xl border border-warning/30 bg-warning/5 p-3.5 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-warning flex items-center gap-1.5">
                                                <ShieldCheck className="h-4 w-4" />
                                                Active Escrow Hold
                                            </span>
                                            <span className="text-xs font-bold font-mono text-foreground">
                                                {currencySymbol}{activeEscrow.amount}
                                            </span>
                                        </div>
                                        <p className="text-xs text-foreground-muted leading-relaxed">
                                            Your payment is safely secured in Escrow. Once you receive the item/service, release funds from your Orders page.
                                        </p>
                                        <Link to="/wallet" className="block w-full">
                                            <Button size="sm" variant="outline" className="w-full text-xs gap-1.5 justify-center">
                                                <Wallet className="h-3.5 w-3.5" />
                                                Manage in Wallet &amp; Orders
                                            </Button>
                                        </Link>
                                    </div>
                                ) : canBuy ? (
                                    <Button
                                        className="w-full justify-center"
                                        onClick={() => {
                                            if (!user) {
                                                showError('Please sign in to complete this purchase.');
                                                navigate('/login');
                                                return;
                                            }
                                            setShowCheckout(true);
                                        }}
                                    >
                                        <ShoppingBag className="mr-1.5 h-4 w-4" />
                                        Buy with Escrow Protection
                                    </Button>
                                ) : null}

                                <Button
                                    variant={canBuy ? 'outline' : 'primary'}
                                    className="w-full"
                                    onClick={handleContactRequest}
                                    loading={requestLoading}
                                    disabled={requestSent}
                                >
                                    {requestSent ? (
                                        <>
                                            <UserCheck className="mr-1.5 h-4 w-4" />
                                            Request pending
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="mr-1.5 h-4 w-4" />
                                            Send request
                                        </>
                                    )}
                                </Button>

                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={handleMessage}
                                    disabled={!hasChatAccess}
                                >
                                    <MessageCircle className="mr-1.5 h-4 w-4" />
                                    {hasChatAccess ? 'Open chat' : 'Chat locked'}
                                </Button>

                                {hasChatAccess && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button variant="outline" size="sm" onClick={handleCall}>
                                            <Phone className="mr-1.5 h-4 w-4" />
                                            Call
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={handleText}>
                                            <MessageSquare className="mr-1.5 h-4 w-4" />
                                            Text
                                        </Button>
                                    </div>
                                )}

                                <p className="pt-2 text-center text-[11px] leading-relaxed text-foreground-muted">
                                    Meet in public places and confirm details before paying.
                                </p>
                            </div>
                        )}
                    </div>
                </aside>
            </div>

            {relatedPosts.length > 0 && (
                <section className="mt-8">
                    <h2 className="mb-3 text-sm font-semibold text-foreground">Related posts</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {relatedPosts.map((related) => (
                            <Link
                                key={related._id}
                                to={`/post/${related._id}`}
                                className="overflow-hidden rounded-xl border border-card-border bg-card transition-colors hover:border-card-border-hover hover:bg-card-hover"
                            >
                                {related.images?.[0] ? (
                                    <img
                                        src={related.images[0]}
                                        alt={related.title}
                                        className="h-28 w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-28 w-full items-center justify-center bg-background-secondary">
                                        <span className="text-lg font-semibold text-foreground-muted/40">
                                            {related.title?.charAt(0)?.toUpperCase() || '?'}
                                        </span>
                                    </div>
                                )}
                                <div className="p-3">
                                    <p className="truncate text-sm font-medium text-foreground">
                                        {related.title}
                                    </p>
                                    <p className="mt-1 truncate text-xs text-foreground-muted">
                                        {related.location || 'Nearby'}
                                    </p>
                                    {related.price > 0 && (
                                        <p className="mt-1 text-sm font-semibold text-foreground">
                                            {currencySymbol}{related.price}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {showCheckout && (
                <CheckoutModal
                    post={post}
                    onClose={() => setShowCheckout(false)}
                    onPurchase={() => {
                        setShowCheckout(false);
                        navigate('/wallet');
                    }}
                />
            )}
        </div>
    );
};

export default PostDetails;
