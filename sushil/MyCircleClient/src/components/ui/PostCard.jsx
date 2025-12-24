import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useToast } from './Toast';
import Button from './Button';
import api from '../../utils/api';
import { getAvatarUrl } from '../../utils/avatar';
import { getPostInsights, getPostExplanation } from '../../services/aiService';
import {
    Sparkles, X, Edit2, Trash2, MoreVertical,
    Heart, Share2, MessageCircle, MapPin,
    Clock, Repeat, ChevronDown, ChevronUp, BarChart2
} from 'lucide-react';

const typeColors = {
    job: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    service: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    sell: 'bg-green-500/10 text-green-400 border-green-500/20',
    rent: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
};

const PostCard = ({ post, onRequestContact, currentUserId, isOwnPost: propIsOwnPost, onStatusChange, onDelete, onEdit }) => {
    const { title, description, type, location, price, user, createdAt, images, acceptsBarter, likes: initialLikes, shares: initialShares, isActive, status } = post;
    const { success } = useToast();
    const [likes, setLikes] = useState(initialLikes || []);
    const [shares, setShares] = useState(initialShares || 0);
    const [expanded, setExpanded] = useState(false);

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
            const res = await api.post(`/posts/${post._id}/like`);
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
        try {
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

    const handleShowAnalytics = async () => {
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className={`group relative glass rounded-[3rem] p-6 
                shadow-xl hover:shadow-primary/5 
                transition-all duration-300 flex flex-col h-full 
                ${!isActive ? 'opacity-75 grayscale' : ''}`}
        >
            {/* Background Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2rem] pointer-events-none" />

            {/* Analytics Overlay */}
            {showAnalytics && analyticsData && (
                <div className="absolute inset-0 bg-card/95 backdrop-blur-2xl z-30 rounded-[3rem] p-8 flex flex-col justify-center items-center animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                        <BarChart2 className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-8">Performance</h3>
                    <div className="grid grid-cols-2 gap-4 w-full mb-8">
                        <div className="p-4 rounded-2xl glass-panel text-center">
                            <div className="text-2xl font-bold text-foreground">{analyticsData.views}</div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-1">Views</div>
                        </div>
                        <div className="p-4 rounded-2xl glass-panel text-center">
                            <div className="text-2xl font-bold text-pink-500">{analyticsData.likes}</div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-1">Likes</div>
                        </div>
                        <div className="p-4 rounded-2xl glass-panel text-center">
                            <div className="text-2xl font-bold text-blue-500">{analyticsData.shares}</div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-1">Shares</div>
                        </div>
                        <div className="p-4 rounded-2xl glass-panel text-center">
                            <div className="text-2xl font-bold text-yellow-500">{analyticsData.daysActive}</div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-1">Days</div>
                        </div>
                    </div>
                    <Button variant="outline" onClick={() => setShowAnalytics(false)} className="w-full justify-center rounded-xl py-4 hover:bg-card/20 transition-all text-foreground">
                        Back to Post
                    </Button>
                </div>
            )}

            {/* ... header ... */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <Link to={`/profile?userId=${user?._id}`} className="hover:text-primary transition-all active:scale-95 shrink-0">
                        <img
                            src={getAvatarUrl(user)}
                            alt={user?.displayName}
                            className="w-11 h-11 rounded-full bg-card/20 object-cover hover:border-primary transition-colors shadow-lg"
                        />
                    </Link>
                    <div className="min-w-0">
                        <Link to={`/profile?userId=${user?._id}`} className="hover:text-primary transition-colors block">
                            <h3 className="font-bold text-foreground leading-tight truncate text-base hover:tracking-tight transition-all">{title}</h3>
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Link to={`/profile?userId=${user?._id}`} className="hover:text-primary transition-colors">
                                {user?.displayName || 'Anonymous'}
                            </Link>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-1.5 items-end shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${typeColors[type] || typeColors.job}`}>
                        {type}
                    </span>
                    {acceptsBarter && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold border bg-pink-500/10 text-pink-500 border-pink-500/20 flex items-center gap-1 shadow-sm">
                            <Repeat className="w-2.5 h-2.5" /> BARTER
                        </span>
                    )}
                </div>
            </div>

            {/* Status Badge */}
            {status && status !== 'active' && (
                <div className="absolute top-4 right-4 bg-card text-foreground text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shadow-xl z-20">
                    {status}
                </div>
            )}

            <div className="relative">
                <p className={`text-muted-foreground text-sm mb-2 transition-all duration-300 ${expanded ? '' : 'line-clamp-2'}`}>
                    {description}
                </p>
                {description && description.length > 100 && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-[10px] text-primary hover:text-primary/80 font-medium flex items-center gap-0.5 mb-2"
                    >
                        {expanded ? (
                            <><ChevronUp className="w-3 h-3" /> Show Less</>
                        ) : (
                            <><ChevronDown className="w-3 h-3" /> Read More</>
                        )}
                    </button>
                )}
            </div>

            {/* AI Insights Section (Inline) */}
            {(isGeneratingAI || aiResult) && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`ai-insights ${aiResult?.type === 'owner' ? 'ai-insights-owner' : 'ai-insights-viewer font-medium'} mb-4`}
                >
                    {isGeneratingAI ? (
                        <div className="flex flex-col items-center py-4">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                                <Sparkles className="w-6 h-6 text-primary" />
                            </motion.div>
                            <span className="text-sm mt-2 text-primary">Generating AI Summary...</span>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Sparkles className={`w-4 h-4 ${aiResult.type === 'owner' ? 'text-green-500' : 'text-primary'}`} />
                                    <span className="text-xs font-bold uppercase tracking-wider">
                                        {aiResult.type === 'owner' ? 'Post Analysis' : 'AI Explanation'}
                                    </span>
                                </div>
                                <button onClick={() => setAiResult(null)}>
                                    <X className="w-4 h-4 opacity-50 hover:opacity-100" />
                                </button>
                            </div>
                            <h4 className="text-sm font-bold mb-1">{aiResult.summary}</h4>
                            <p className="text-xs opacity-80 mb-3 leading-relaxed">{aiResult.details}</p>
                            <div className="space-y-1.5">
                                {aiResult.listItems?.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 text-[11px] leading-tight">
                                        <span className={aiResult.type === 'owner' ? 'text-green-500' : 'text-primary'}>•</span>
                                        <span className="opacity-90">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </motion.div>
            )}

            {/* Image Preview - Elevated with Overlay */}
            {images && images.length > 0 && (
                <div className="mb-5 rounded-[2.5rem] overflow-hidden aspect-video bg-card/10 shrink-0 relative group/img cursor-pointer shadow-inner" onClick={() => navigate(`/post/${post._id}`)}>
                    <img
                        src={images[0]}
                        alt="Post"
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300" />
                </div>
            )}

            <div className="flex items-center justify-between mt-auto pt-4">
                <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-muted-foreground tracking-wider flex items-center gap-1.5 mb-1">
                        <MapPin className="w-3 h-3 text-primary" /> {location.toUpperCase()}
                    </span>
                    {price && (
                        <div className="flex items-baseline gap-0.5">
                            <span className="text-xl font-black text-foreground">₹{price}</span>
                            <span className="text-[10px] text-muted-foreground font-bold ml-1 uppercase letter-spacing-widest">Only</span>
                        </div>
                    )}
                </div>

                {/* Social Actions - Compact & Refined */}
                <div className="flex items-center gap-1.5">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleGetAIInsights}
                        className={`p-2.5 rounded-xl transition-all ${aiResult ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-card/10 text-muted-foreground hover:text-foreground hover:bg-card/20'}`}
                        title="AI Analysis"
                    >
                        <Sparkles className={`w-4 h-4 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleLike}
                        className={`p-2.5 rounded-xl transition-all flex items-center gap-1.5 ${isLiked ? 'bg-pink-500/10 text-pink-500 border border-pink-500/20' : 'bg-card/10 text-muted-foreground hover:text-foreground hover:bg-card/20'}`}
                    >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                        <span className="text-xs font-bold">{likes.length}</span>
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleShare}
                        className="p-2.5 rounded-xl bg-card/10 text-muted-foreground hover:text-foreground hover:bg-card/20 transition-all"
                    >
                        <Share2 className="w-4 h-4" />
                    </motion.button>

                    {isOwnPost && (type === 'job' || type === 'service') && post.applicationCount > 0 && (
                        <Link
                            to="/requests"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-[10px] font-black bg-red-500 text-white px-3 py-1 rounded-xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all active:scale-95"
                        >
                            <MessageCircle className="w-3 h-3 fill-white" />
                            {post.applicationCount}
                        </Link>
                    )}
                </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
                {!isOwnPost && onRequestContact && (
                    <Button
                        variant="primary"
                        className="text-sm px-4 py-2 w-full justify-center"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRequestContact(post._id, e);
                        }}
                    >
                        <MessageCircle className="w-4 h-4" /> Contact
                    </Button>
                )}

                {isOwnPost && (
                    <div className="flex w-full gap-2">
                        <Button
                            variant="outline"
                            className="bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20"
                            onClick={handleShowAnalytics}
                        >
                            <BarChart2 className="w-4 h-4" />
                        </Button>

                        {onEdit && (
                            <Button
                                variant="outline"
                                className="text-sm text-primary border-primary/20 hover:bg-primary/10"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit();
                                }}
                            >
                                <Edit2 className="w-4 h-4" /> Edit
                            </Button>
                        )}

                        {onStatusChange && (
                            <>
                                {status === 'active' ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="text-sm text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/10"
                                            onClick={() => onStatusChange('inactive')}
                                        >
                                            Disable
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="text-sm text-blue-400 border-blue-400/20 hover:bg-blue-400/10"
                                            onClick={() => onStatusChange('sold')}
                                        >
                                            Sold
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="outline"
                                        className="flex-1 text-sm text-green-400 border-green-400/20 hover:bg-green-400/10"
                                        onClick={() => onStatusChange('active')}
                                    >
                                        {status === 'sold' ? 'Relist' : 'Enable'}
                                    </Button>
                                )}
                            </>
                        )}
                        {onDelete && (
                            <Button
                                variant="outline"
                                className="text-sm text-red-400 border-red-400/20 hover:bg-red-500/10"
                                onClick={onDelete}
                            >
                                Delete
                            </Button>
                        )}
                        {!onStatusChange && !onDelete && (
                            <div className="w-full text-center py-2 text-xs text-primary bg-primary/10 rounded-xl border border-primary/20">
                                Your Post
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default PostCard;

