import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import Button from './Button';
import api from '../../utils/api';
import { cn } from '../../utils/cn';
import { getAvatarUrl } from '../../utils/avatar';
import { getPostInsights, getPostExplanation } from '../../services/aiService';
import {
    Sparkles, X, Edit2, Trash2, Eye,
    Heart, Share2, MessageCircle, MapPin,
    Clock, Repeat, ChevronDown, ChevronUp, BarChart2, Check
} from 'lucide-react';

const typeColors = {
    job: 'bg-blue-50 text-blue-600 border-blue-100',
    service: 'bg-purple-50 text-purple-600 border-purple-100',
    sell: 'bg-green-50 text-green-600 border-green-100',
    rent: 'bg-primary/5 text-primary border-primary/10'
};

const PostCard = ({
    post,
    onRequestContact = () => {},
    currentUserId = null,
    isOwnPost: propIsOwnPost = false,
    onDelete = () => { },
    onEdit = () => { }
}) => {
    const { title, description, type, location, price, user, createdAt, images, acceptsBarter, likes: initialLikes, shares: initialShares, isActive, status } = post;
    const { success } = useToast();
    const navigate = useNavigate();
    const [likes, setLikes] = useState(initialLikes || []);
    const [shares, setShares] = useState(initialShares || 0);
    const [hasShared, setHasShared] = useState(false);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        const sharedPosts = JSON.parse(localStorage.getItem('sharedPosts') || '[]');
        setHasShared(sharedPosts.includes(post._id));
    }, [post._id]);

    // AI State
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [aiResult, setAiResult] = useState(null);

    // Check if this is the current user's post
    const isOwnPost = propIsOwnPost || (currentUserId && user?._id === currentUserId);
    const isLiked = currentUserId && likes.includes(currentUserId);

    const handleGetAIInsights = async (e) => {
        e.stopPropagation();
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
                    summary: `Market Demand: ${insights.demandLevel}`,
                    details: insights.priceAnalysis,
                    listItems: [`Score: ${insights.demandScore}/10`]
                });
            } else {
                const explanation = await getPostExplanation(post);
                setAiResult({
                    type: 'viewer',
                    summary: explanation.summary,
                    details: explanation.context,
                    listItems: explanation.interestingFacts
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleLike = async (e) => {
        e.stopPropagation();
        try {
            await api.post(`/posts/${post._id}/like`);
            if (isLiked) {
                setLikes(likes.filter(id => id !== currentUserId));
            } else {
                setLikes([...likes, currentUserId]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleShare = async (e) => {
        e.stopPropagation();
        if (hasShared) return;
        
        try {
            const sharedPosts = JSON.parse(localStorage.getItem('sharedPosts') || '[]');
            sharedPosts.push(post._id);
            localStorage.setItem('sharedPosts', JSON.stringify(sharedPosts));
            setHasShared(true);
            
            await api.post(`/posts/${post._id}/share`);
            setShares(shares + 1);
            navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
            success('Link copied to clipboard!');
        } catch (err) {
            console.error(err);
        }
    };

    const [showAnalytics, setShowAnalytics] = useState(false);
    const [analyticsData, setAnalyticsData] = useState(null);

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
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className={`group relative bg-card rounded-card p-5 border border-card-border shadow-card hover:shadow-lg transition-all flex flex-col h-full ${!isActive ? 'opacity-75 grayscale' : ''}`}
        >
            {/* Analytics Overlay */}
            <AnimatePresence>
                {showAnalytics && analyticsData && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute inset-x-2 inset-y-2 bg-card/95 backdrop-blur-md z-30 rounded-card p-6 flex flex-col shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-text-heading">Post Insights</h3>
                            <button onClick={handleShowAnalytics} className="p-1 hover:bg-hover-bg rounded-full">
                                <X className="w-5 h-5 text-text-muted" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {[
                                { label: 'Views', value: analyticsData.views, icon: Eye, color: 'text-primary' },
                                { label: 'Likes', value: analyticsData.likes, icon: Heart, color: 'text-pink-500' },
                                { label: 'Shares', value: analyticsData.shares, icon: Share2, color: 'text-blue-500' },
                                { label: 'Days', value: analyticsData.daysActive, icon: Clock, color: 'text-text-muted' }
                            ].map((stat, i) => (
                                <div key={i} className="p-3 rounded-xl bg-background-section border border-card-border">
                                    <div className="flex items-center gap-2 mb-1">
                                        <stat.icon className={`w-3 h-3 ${stat.color}`} />
                                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{stat.label}</span>
                                    </div>
                                    <div className="text-lg font-bold text-text-heading">{stat.value}</div>
                                </div>
                            ))}
                        </div>

                        <Button variant="outline" size="sm" onClick={handleShowAnalytics} className="mt-auto">
                            Close Analytics
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Media Section */}
            <div className="relative mb-4">
                {images && images.length > 0 ? (
                    <div
                        className="rounded-xl overflow-hidden aspect-[4/3] bg-background-section relative group/img cursor-pointer"
                        onClick={() => navigate(`/post/${post._id}`)}
                    >
                        <img
                            src={images[0]}
                            alt={title}
                            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                ) : (
                    <div className="rounded-xl aspect-[4/3] bg-background-section flex items-center justify-center border border-card-border border-dashed">
                        <Sparkles className="w-8 h-8 text-primary/20" />
                    </div>
                )}

                <div className="absolute top-2 left-2 flex gap-1.5 z-20">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${typeColors[type] || typeColors.job}`}>
                        {type}
                    </span>
                    {acceptsBarter && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold border bg-primary/5 text-primary border-primary/10 flex items-center gap-1 shadow-sm">
                            <Repeat className="w-2.5 h-2.5" /> BARTER
                        </span>
                    )}
                </div>

                {status && status !== 'active' && (
                    <div className="absolute bottom-2 right-2 bg-text-heading text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shadow-lg z-20">
                        {status}
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="flex-grow">
                <Link to={`/post/${post._id}`} className="hover:text-primary transition-colors block">
                    <h3 className="font-bold text-text-heading leading-snug line-clamp-2 text-[15px] mb-2">{title}</h3>
                </Link>

                <div className="flex items-center gap-2 mb-3">
                    <Link to={`/profile?userId=${user?._id}`} className="shrink-0">
                        <img
                            src={getAvatarUrl(user)}
                            alt={user?.displayName}
                            className="w-6 h-6 rounded-full bg-background-section object-cover border border-card-border"
                        />
                    </Link>
                    <div className="flex items-center gap-1 text-[11px] text-text-muted font-medium">
                        <Link to={`/profile?userId=${user?._id}`} className="hover:text-primary transition-colors font-bold">
                            {user?.displayName || 'Anonymous'}
                        </Link>
                        <span>•</span>
                        <span>{new Date(createdAt).toLocaleDateString()}</span>
                    </div>
                </div>

                <p className={`text-text-body text-sm mb-3 ${expanded ? '' : 'line-clamp-2'} leading-relaxed`}>
                    {description}
                </p>
                {description && description.length > 80 && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                        className="text-[11px] text-primary hover:underline font-bold mb-3"
                    >
                        {expanded ? 'Show Less' : 'Read More'}
                    </button>
                )}
            </div>

            {/* AI Result Section */}
            <AnimatePresence>
                {(isGeneratingAI || aiResult) && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`p-4 rounded-xl mb-4 border text-[13px] ${aiResult?.type === 'owner' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-primary/10 border-primary/20 text-text-body'}`}
                    >
                        {isGeneratingAI ? (
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                                <span className="text-xs font-medium">AI is thinking...</span>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">AI Insights</span>
                                    </div>
                                    <button onClick={() => setAiResult(null)}>
                                        <X className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                                    </button>
                                </div>
                                <p className="font-bold mb-1 leading-tight">{aiResult.summary}</p>
                                <p className="text-[11px] opacity-80 leading-relaxed">{aiResult.details}</p>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer / Actions Section */}
            <div className="pt-4 border-t border-card-border flex items-end justify-between">
                <div>
                    <div className="flex items-center gap-1 text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">
                        <MapPin className="w-2.5 h-2.5 text-primary" />
                        {location}
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-text-heading">{price ? `₹${price}` : 'Trade'}</span>
                        {price && <span className="text-[10px] text-text-muted font-medium uppercase tracking-tighter">Total</span>}
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <button
                        onClick={handleGetAIInsights}
                        className={cn(
                            "p-2 rounded-lg transition-all",
                            aiResult ? "bg-primary text-white shadow-button" : "text-text-muted hover:bg-hover-bg"
                        )}
                        title="AI Analysis"
                    >
                        <Sparkles className={cn("w-4 h-4", isGeneratingAI && "animate-spin")} />
                    </button>

                    <button
                        onClick={handleLike}
                        className={cn(
                            "p-2 rounded-lg transition-all flex items-center gap-1.5",
                            isLiked ? "bg-pink-500/10 text-pink-500 border border-pink-500/20" : "text-text-muted hover:bg-hover-bg"
                        )}
                    >
                        <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
                        <span className="text-xs font-bold">{likes.length}</span>
                    </button>

                    <button
                        onClick={handleShare}
                        className={cn(
                            "p-2 rounded-lg transition-all flex items-center gap-1.5",
                            hasShared ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" : "text-text-muted hover:bg-hover-bg"
                        )}
                        title={hasShared ? "Link copied!" : "Copy share link"}
                    >
                        <Share2 className="w-4 h-4" />
                        <span className="text-xs font-bold">{shares}</span>
                    </button>

                    {isOwnPost ? (
                        <div className="relative group/actions">
                            <button
                                className="p-2 text-text-muted hover:bg-hover-bg rounded-lg"
                                onClick={(e) => { e.stopPropagation(); setShowAnalytics(!showAnalytics); }}
                            >
                                <BarChart2 className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <Button
                            variant="primary"
                            size="sm"
                            className=""
                            onClick={(e) => { e.stopPropagation(); onRequestContact(post._id, e); }}
                        >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Contact</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Management Actions for Owner */}
            {isOwnPost && !showAnalytics && (
                <div className="mt-4 pt-3 border-t border-card-border grid grid-cols-2 gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="py-1.5 border-card-border text-text-body hover:bg-primary/5"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="py-1.5 border-card-border text-red-500 hover:bg-red-50"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                    </Button>
                </div>
            )}
        </motion.div>
    );
};

export default PostCard;

