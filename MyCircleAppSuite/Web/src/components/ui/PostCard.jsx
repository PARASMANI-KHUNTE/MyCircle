import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import Button from './Button';
import api from '../../utils/api';
import { cn } from '../../utils/cn';
import { getAvatarUrl } from '../../utils/avatar';
import { getPostInsights, getPostExplanation } from '../../services/aiService';
import {
    Sparkles, X, Edit2, Trash2, Eye, Heart, Share2, MessageCircle, MapPin,
    Clock, Repeat, BarChart2, Check, Shield, Star, DollarSign, Calendar
} from 'lucide-react';

const typeStyles = {
    job: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        text: 'text-blue-500',
        icon: '💼',
        label: 'Job'
    },
    service: {
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20',
        text: 'text-purple-500',
        icon: '🔧',
        label: 'Service'
    },
    sell: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        text: 'text-emerald-500',
        icon: '🏷️',
        label: 'For Sale'
    },
    rent: {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        text: 'text-amber-500',
        icon: '🏠',
        label: 'For Rent'
    }
};

const formatMoney = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return null;
    return `₹${numeric.toLocaleString('en-IN')}`;
};

const formatDate = (value) => {
    if (!value) return 'Recently';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Recently';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const PostCard = ({
    post,
    onRequestContact = () => {},
    currentUserId = null,
    isOwnPost: propIsOwnPost = false,
    onDelete = () => {},
    onEdit = () => {},
    onClick = () => {},
    index = 0
}) => {
    const {
        title,
        description,
        type,
        location,
        price,
        user,
        createdAt,
        images,
        acceptsBarter,
        likes: initialLikes,
        shares: initialShares,
        isActive,
        status
    } = post;

    const { success } = useToast();
    const navigate = useNavigate();

    const [likes, setLikes] = useState(initialLikes || []);
    const [sharesCount, setSharesCount] = useState(initialShares || 0);
    const [hasShared, setHasShared] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [analyticsData, setAnalyticsData] = useState(null);

    useEffect(() => {
        const sharedPosts = JSON.parse(localStorage.getItem('sharedPosts') || '[]');
        setHasShared(sharedPosts.includes(post._id));
    }, [post._id]);

    const isOwnPost = propIsOwnPost || (currentUserId && user?._id === currentUserId);
    const isLiked = currentUserId && likes.includes(currentUserId);
    const typeStyle = typeStyles[type] || typeStyles.job;
    const displayDate = formatDate(createdAt);
    const displayLocation = location || 'Location unavailable';
    const displayPrice = formatMoney(price);
    const budgetFloor = post.budgetMin ?? price;
    const budgetCeiling = post.budgetMax ?? price;

    const budgetLabel = useMemo(() => {
        const minLabel = formatMoney(budgetFloor);
        const maxLabel = formatMoney(budgetCeiling);
        if (minLabel && maxLabel && minLabel !== maxLabel) return `${minLabel} - ${maxLabel}`;
        return minLabel || maxLabel || null;
    }, [budgetFloor, budgetCeiling]);

    const shouldShowReadMore = description && description.length > 140;

    const handleGetAIInsights = async (e) => {
        e?.stopPropagation();
        if (aiResult) {
            setAiResult(null);
            return;
        }

        setIsGeneratingAI(true);
        try {
            if (isOwnPost) {
                const insights = await getPostInsights(post);
                setAiResult({
                    type: 'owner',
                    summary: `Market demand: ${insights.demandLevel}`,
                    details: insights.priceAnalysis
                });
            } else {
                const explanation = await getPostExplanation(post);
                setAiResult({
                    type: 'viewer',
                    summary: explanation.summary,
                    details: explanation.context
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleLike = async (e) => {
        e?.stopPropagation();
        try {
            await api.post(`/posts/${post._id}/like`);
            setLikes((prev) => (isLiked ? prev.filter((id) => id !== currentUserId) : [...prev, currentUserId]));
        } catch (err) {
            console.error(err);
        }
    };

    const handleShare = async (e) => {
        e?.stopPropagation();
        if (hasShared) return;

        try {
            const sharedPosts = JSON.parse(localStorage.getItem('sharedPosts') || '[]');
            sharedPosts.push(post._id);
            localStorage.setItem('sharedPosts', JSON.stringify(sharedPosts));
            setHasShared(true);

            await api.post(`/posts/${post._id}/share`);
            setSharesCount((prev) => prev + 1);
            navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
            success('Link copied to clipboard');
        } catch (err) {
            console.error(err);
        }
    };

    const handleShowAnalytics = async (e) => {
        e?.stopPropagation();
        if (!showAnalytics && !analyticsData) {
            try {
                const res = await api.get(`/posts/${post._id}/analytics`);
                setAnalyticsData(res.data);
            } catch (err) {
                console.error(err);
            }
        }
        setShowAnalytics(!showAnalytics);
    };

    return (
        <motion.article
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: index * 0.03 }}
            whileHover={{ y: -2 }}
            onClick={onClick}
            className={cn(
                'group relative bg-card rounded-2xl border border-card-border overflow-hidden cursor-pointer',
                'transition-all duration-200 hover:shadow-md hover:border-card-border-hover',
                !isActive && 'opacity-60 grayscale'
            )}
        >
            <AnimatePresence>
                {showAnalytics && analyticsData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-card/95 backdrop-blur-xl p-6 flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold text-lg">Post Analytics</h3>
                            <button onClick={handleShowAnalytics} className="icon-btn">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {[
                                { label: 'Views', value: analyticsData.views, icon: Eye, color: 'text-primary' },
                                { label: 'Likes', value: analyticsData.likes, icon: Heart, color: 'text-pink-500' },
                                { label: 'Shares', value: analyticsData.shares, icon: Share2, color: 'text-blue-500' },
                                { label: 'Days Active', value: analyticsData.daysActive, icon: Calendar, color: 'text-foreground-muted' }
                            ].map((stat) => (
                                <div key={stat.label} className="p-4 rounded-xl bg-background-secondary border border-card-border">
                                    <div className="flex items-center gap-2 mb-2">
                                        <stat.icon className={cn('w-4 h-4', stat.color)} />
                                        <span className="text-xs font-semibold text-foreground-muted uppercase">{stat.label}</span>
                                    </div>
                                    <div className="text-2xl font-semibold">{stat.value}</div>
                                </div>
                            ))}
                        </div>

                        <Button variant="outline" className="mt-auto" onClick={handleShowAnalytics}>
                            Close
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative aspect-[16/10] overflow-hidden bg-background-secondary">
                {images && images.length > 0 ? (
                    <button
                        type="button"
                        className="w-full h-full"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/post/${post._id}`);
                        }}
                    >
                        <img
                            src={images[0]}
                            alt={title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                    </button>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <span className="text-3xl">{typeStyle.icon}</span>
                        </div>
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

                <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className={cn(
                        'px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wide border backdrop-blur-sm',
                        typeStyle.bg,
                        typeStyle.text,
                        typeStyle.border
                    )}>
                        {typeStyle.label}
                    </span>
                    {acceptsBarter && (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wide bg-secondary/10 text-secondary border border-secondary/20 backdrop-blur-sm flex items-center gap-1">
                            <Repeat className="w-3 h-3" />
                            Barter
                        </span>
                    )}
                </div>

                {status && status !== 'active' && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wide bg-black/65 text-primary-foreground backdrop-blur-sm">
                        {status}
                    </div>
                )}

                {displayPrice && (
                    <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg text-xs font-semibold bg-black/65 text-primary-foreground backdrop-blur-sm">
                        {displayPrice}
                    </div>
                )}
            </div>

            <div className="p-4 sm:p-5">
                <header className="mb-3">
                    <Link to={`/post/${post._id}`} className="block group/title">
                        <h3 className="font-semibold text-lg leading-tight group-hover/title:text-primary transition-colors line-clamp-2">
                            {title}
                        </h3>
                    </Link>
                </header>

                <div className="flex items-center gap-3 mb-4">
                    <Link to={`/profile?userId=${user?._id}`} className="shrink-0">
                        <img
                            src={getAvatarUrl(user)}
                            alt={user?.displayName || 'Profile'}
                            className="w-9 h-9 rounded-full object-cover ring-2 ring-card-border"
                        />
                    </Link>
                    <div className="min-w-0 flex-1">
                        <Link
                            to={`/profile?userId=${user?._id}`}
                            className="text-sm font-semibold hover:text-primary transition-colors truncate block"
                        >
                            {user?.displayName || 'Anonymous'}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-foreground-muted">
                            <span>{displayDate}</span>
                            <span>•</span>
                            <span className="truncate">{displayLocation}</span>
                        </div>
                    </div>
                </div>

                {(user?.reputation?.trustScore || user?.reputation?.averageRating) && (
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        {user?.reputation?.trustScore && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 border border-success/20 px-3 py-1 text-xs font-semibold text-success">
                                <Shield className="w-3.5 h-3.5" />
                                Trust {user.reputation.trustScore}
                            </span>
                        )}
                        {user?.reputation?.averageRating && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 border border-warning/20 px-3 py-1 text-xs font-semibold text-warning">
                                <Star className="w-3.5 h-3.5 fill-current" />
                                {Number(user.reputation.averageRating).toFixed(1)}
                            </span>
                        )}
                    </div>
                )}

                {description && (
                    <>
                        <p className={cn(
                            'text-sm text-foreground-secondary leading-relaxed',
                            expanded ? '' : 'line-clamp-3'
                        )}>
                            {description}
                        </p>
                        {shouldShowReadMore && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setExpanded(!expanded);
                                }}
                                className="mt-2 text-xs text-primary hover:underline font-semibold"
                            >
                                {expanded ? 'Show less' : 'Read more'}
                            </button>
                        )}
                    </>
                )}

                {(budgetLabel || post.duration || post.availability) && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {budgetLabel && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary">
                                <DollarSign className="w-3.5 h-3.5" />
                                {budgetLabel}
                            </span>
                        )}
                        {post.duration && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-info/10 border border-info/20 px-3 py-1.5 text-xs font-semibold text-info">
                                <Clock className="w-3.5 h-3.5" />
                                {post.duration} mins
                            </span>
                        )}
                        {post.availability && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 border border-secondary/20 px-3 py-1.5 text-xs font-semibold text-secondary">
                                <Check className="w-3.5 h-3.5" />
                                {post.availability}
                            </span>
                        )}
                    </div>
                )}

                <AnimatePresence>
                    {(isGeneratingAI || aiResult) && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className={cn(
                                'p-4 rounded-xl mt-4 border',
                                aiResult?.type === 'owner' ? 'bg-success/10 border-success/20' : 'bg-primary/10 border-primary/20'
                            )}
                        >
                            {isGeneratingAI ? (
                                <div className="flex items-center gap-3">
                                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                                    <span className="text-sm font-medium">AI analyzing...</span>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-primary" />
                                            <span className="text-xs font-bold uppercase">AI Insights</span>
                                        </div>
                                        <button onClick={() => setAiResult(null)} className="icon-btn p-1">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="font-semibold mb-1">{aiResult.summary}</p>
                                    <p className="text-xs opacity-80">{aiResult.details}</p>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <footer className="mt-4 pt-4 border-t border-card-border space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-foreground-muted min-w-0">
                            <MapPin className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-xs font-medium truncate">{displayLocation}</span>
                        </div>
                        {!displayPrice && (
                            <span className="text-xs font-semibold text-foreground-muted">Price not specified</span>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleGetAIInsights}
                                className={cn(
                                    'p-2 rounded-xl transition-all',
                                    aiResult ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-primary/10 text-primary hover:bg-primary/20'
                                )}
                            >
                                <Sparkles className={cn('w-4 h-4', isGeneratingAI && 'animate-spin')} />
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleLike}
                                className={cn(
                                    'p-2 rounded-xl transition-all flex items-center gap-1.5',
                                    isLiked
                                        ? 'bg-pink-500/10 text-pink-500 border border-pink-500/20'
                                        : 'bg-card-hover text-foreground-muted hover:bg-pink-500/10 hover:text-pink-500'
                                )}
                            >
                                <Heart className={cn('w-4 h-4', isLiked && 'fill-current')} />
                                <span className="text-xs font-bold">{likes.length}</span>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleShare}
                                className={cn(
                                    'p-2 rounded-xl transition-all flex items-center gap-1.5',
                                    hasShared
                                        ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                        : 'bg-card-hover text-foreground-muted hover:bg-blue-500/10 hover:text-blue-500'
                                )}
                            >
                                <Share2 className="w-4 h-4" />
                                <span className="text-xs font-bold">{sharesCount}</span>
                            </motion.button>

                            {isOwnPost && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => {
                                        e?.stopPropagation();
                                        handleShowAnalytics(e);
                                    }}
                                    className="p-2 rounded-xl bg-card-hover text-foreground-muted hover:bg-primary/10 hover:text-primary transition-all"
                                >
                                    <BarChart2 className="w-4 h-4" />
                                </motion.button>
                            )}
                        </div>

                        {!isOwnPost && (
                            <Button
                                size="sm"
                                className="ml-2 gap-1.5"
                                onClick={(e) => {
                                    e?.stopPropagation();
                                    onRequestContact(post._id, e);
                                }}
                            >
                                <MessageCircle className="w-4 h-4" />
                                Contact
                            </Button>
                        )}
                    </div>
                </footer>

                {isOwnPost && !showAnalytics && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-card-border">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1.5"
                            onClick={(e) => {
                                e?.stopPropagation();
                                onEdit();
                            }}
                        >
                            <Edit2 className="w-4 h-4" />
                            Edit
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1.5 text-error border-error/20 hover:bg-error/10"
                            onClick={(e) => {
                                e?.stopPropagation();
                                onDelete();
                            }}
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </Button>
                    </div>
                )}
            </div>
        </motion.article>
    );
};

export default PostCard;
