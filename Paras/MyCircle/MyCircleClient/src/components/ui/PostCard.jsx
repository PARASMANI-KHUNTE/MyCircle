import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import Button from './Button';
import api from '../../utils/api';
import { getAvatarUrl } from '../../utils/avatar';
import { getPostInsights, getPostExplanation } from '../../services/aiService';
import {
    Sparkles, X, Edit2, Heart, Share2, MessageCircle, MapPin,
    Repeat, ChevronDown, ChevronUp, BarChart2, TrendingUp, Eye
} from 'lucide-react';

const typeConfig = {
    job: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', label: 'Job' },
    service: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100', label: 'Service' },
    sell: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: 'Buy/Sell' },
    rent: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100', label: 'Rent' }
};

const PostCard = ({ post, onRequestContact, currentUserId, isOwnPost: propIsOwnPost, onStatusChange, onDelete, onEdit }) => {
    const navigate = useNavigate();
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

    const typeStyle = typeConfig[type] || typeConfig.job;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`group relative bg-white rounded-3xl border border-slate-200/60 hover:border-slate-300 
                shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 
                transition-all duration-300 flex flex-col overflow-hidden h-full
                ${!isActive ? 'opacity-60 grayscale' : ''}`}
        >
            {/* Analytics Overlay */}
            <AnimatePresence>
                {showAnalytics && analyticsData && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute inset-0 bg-white/98 backdrop-blur-sm z-30 rounded-3xl p-8 flex flex-col justify-center items-center"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
                            <TrendingUp className="w-8 h-8 text-slate-900" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-8">Analytics</h3>
                        <div className="grid grid-cols-2 gap-4 w-full mb-8">
                            <div className="p-5 rounded-2xl bg-slate-50 text-center">
                                <div className="text-3xl font-bold text-slate-900">{analyticsData.views}</div>
                                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mt-2">Views</div>
                            </div>
                            <div className="p-5 rounded-2xl bg-pink-50 text-center">
                                <div className="text-3xl font-bold text-pink-600">{analyticsData.likes}</div>
                                <div className="text-xs uppercase tracking-wider text-pink-700 font-semibold mt-2">Likes</div>
                            </div>
                            <div className="p-5 rounded-2xl bg-indigo-50 text-center">
                                <div className="text-3xl font-bold text-indigo-600">{analyticsData.shares}</div>
                                <div className="text-xs uppercase tracking-wider text-indigo-700 font-semibold mt-2">Shares</div>
                            </div>
                            <div className="p-5 rounded-2xl bg-emerald-50 text-center">
                                <div className="text-3xl font-bold text-emerald-600">{analyticsData.daysActive}</div>
                                <div className="text-xs uppercase tracking-wider text-emerald-700 font-semibold mt-2">Days</div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAnalytics(false)}
                            className="w-full px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold transition-all"
                        >
                            Close
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Status Badge */}
            {status && status !== 'active' && (
                <div className="absolute top-4 right-4 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg z-20">
                    {status}
                </div>
            )}

            {/* Image Section */}
            {images && images.length > 0 && (
                <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden group/img cursor-pointer">
                    <img
                        src={images[0]}
                        alt={title}
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700"
                        onClick={() => navigate(`/post/${post._id}`)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Type Badge on Image */}
                    <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${typeStyle.bg} ${typeStyle.text} backdrop-blur-sm border ${typeStyle.border} shadow-sm`}>
                        {typeStyle.label}
                    </div>
                </div>
            )}

            {/* Content Section */}
            <div className="p-6 flex flex-col flex-grow">
                {/* Header - User Info */}
                <div className="flex items-center gap-3 mb-4">
                    <Link to={`/profile?userId=${user?._id}`}>
                        <img
                            src={getAvatarUrl(user)}
                            alt={user?.displayName}
                            className="w-10 h-10 rounded-full object-cover border-2 border-slate-100 hover:border-slate-300 transition-colors"
                        />
                    </Link>
                    <div className="flex-1 min-w-0">
                        <Link to={`/profile?userId=${user?._id}`} className="block group/link">
                            <p className="font-semibold text-sm text-slate-900 group-hover/link:underline decoration-2 underline-offset-2 truncate">
                                {user?.displayName || 'Anonymous'}
                            </p>
                        </Link>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                            <span>{new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            {acceptsBarter && (
                                <>
                                    <span className="text-slate-300">•</span>
                                    <span className="flex items-center gap-1 text-pink-600 font-medium">
                                        <Repeat className="w-3 h-3" /> Barter
                                    </span>
                                </>
                            )}
                        </p>
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight line-clamp-2">
                    {title}
                </h3>

                {/* Description */}
                <div className="relative mb-4 flex-grow">
                    <p className={`text-sm text-slate-600 leading-relaxed transition-all duration-300 ${expanded ? '' : 'line-clamp-2'}`}>
                        {description}
                    </p>
                    {description && description.length > 100 && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="text-xs text-slate-900 font-semibold flex items-center gap-1 mt-1 hover:gap-2 transition-all"
                        >
                            {expanded ? (
                                <><ChevronUp className="w-3 h-3" /> Less</>
                            ) : (
                                <><ChevronDown className="w-3 h-3" /> More</>
                            )}
                        </button>
                    )}
                </div>

                {/* AI Insights */}
                <AnimatePresence>
                    {(isGeneratingAI || aiResult) && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4 overflow-hidden"
                        >
                            {isGeneratingAI ? (
                                <div className="flex items-center justify-center gap-2 py-2">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    >
                                        <Sparkles className="w-5 h-5 text-indigo-600" />
                                    </motion.div>
                                    <span className="text-xs font-semibold text-indigo-900">Analyzing...</span>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-indigo-600" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                                                {aiResult.type === 'owner' ? 'Insights' : 'AI Summary'}
                                            </span>
                                        </div>
                                        <button onClick={() => setAiResult(null)}>
                                            <X className="w-4 h-4 text-indigo-400 hover:text-indigo-600" />
                                        </button>
                                    </div>
                                    <h4 className="text-sm font-bold text-indigo-900 mb-1">{aiResult.summary}</h4>
                                    <p className="text-xs text-indigo-700 leading-relaxed">{aiResult.details}</p>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer - Location & Price */}
                <div className="flex items-end justify-between pt-4 border-t border-slate-100">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-1 mb-1 uppercase">
                            <MapPin className="w-3 h-3" /> {location}
                        </span>
                        {price && (
                            <span className="text-xl font-black text-slate-900">₹{price.toLocaleString()}</span>
                        )}
                    </div>

                    {/* Social Actions */}
                    <div className="flex items-center gap-1">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={handleGetAIInsights}
                            className={`p-2 rounded-xl transition-all ${aiResult ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                            title="AI Analysis"
                        >
                            <Sparkles className={`w-4 h-4 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={handleLike}
                            className={`p-2 rounded-xl transition-all flex items-center gap-1 ${isLiked ? 'bg-pink-100 text-pink-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                        >
                            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                            {likes.length > 0 && <span className="text-xs font-bold">{likes.length}</span>}
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={handleShare}
                            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
                        >
                            <Share2 className="w-4 h-4" />
                        </motion.button>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 flex gap-2">
                    {!isOwnPost && onRequestContact && (
                        <button
                            className="flex-1 px-4 py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRequestContact(post._id, e);
                            }}
                        >
                            <MessageCircle className="w-4 h-4" /> Contact
                        </button>
                    )}

                    {isOwnPost && (
                        <>
                            <button
                                onClick={handleShowAnalytics}
                                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                            >
                                <BarChart2 className="w-4 h-4" /> Stats
                            </button>

                            {onEdit && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit();
                                    }}
                                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                                >
                                    <Edit2 className="w-4 h-4" /> Edit
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default PostCard;
