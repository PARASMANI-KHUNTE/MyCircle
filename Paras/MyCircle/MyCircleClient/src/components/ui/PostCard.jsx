import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from './Toast'; 
import api from '../../utils/api'; 
import { getAvatarUrl } from '../../utils/avatar'; 
import { getPostInsights, getPostExplanation } from '../../services/aiService'; 
import {
    Sparkles, X, Edit2, Heart, Share2, MessageCircle, MapPin,
    BarChart2
} from 'lucide-react';

const typeConfig = {
    job: { bg: 'bg-blue-500/90', text: 'text-white', label: 'Job' },
    service: { bg: 'bg-violet-500/90', text: 'text-white', label: 'Service' },
    sell: { bg: 'bg-emerald-500/90', text: 'text-white', label: 'Buy/Sell' },
    rent: { bg: 'bg-orange-500/90', text: 'text-white', label: 'Rent' }
};

const PostCard = ({ post, onRequestContact, currentUserId, isOwnPost: propIsOwnPost, onEdit }) => {
    const navigate = useNavigate();
    const { title, description, type, location, price, user, createdAt, images, acceptsBarter, likes: initialLikes, isActive, status } = post;
    const { success } = useToast();
    
    // State
    const [likes, setLikes] = useState(initialLikes || []);
    const [expanded, setExpanded] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [analyticsData, setAnalyticsData] = useState(null);

    // Computed
    const isOwnPost = propIsOwnPost || (currentUserId && user?._id === currentUserId);
    const isLiked = currentUserId && likes.includes(currentUserId);
    const typeStyle = typeConfig[type] || typeConfig.job;

    // --- Helpers ---
    
    // Extract first line of address (everything before the first comma)
    const shortLocation = location?.split(',')[0] || location;

    // --- Handlers ---

    const handleGetAIInsights = async (e) => {
        e.stopPropagation();
        if (aiResult) { setAiResult(null); return; }
        setIsGeneratingAI(true);
        try {
            if (isOwnPost) {
                const insights = await getPostInsights(post);
                setAiResult({ type: 'owner', summary: `Market Demand: ${insights.demandLevel}`, details: insights.priceAnalysis });
            } else {
                const explanation = await getPostExplanation(post);
                setAiResult({ type: 'viewer', summary: explanation.summary, details: explanation.context });
            }
        } catch (error) { console.error(error); } finally { setIsGeneratingAI(false); }
    };

    const handleLike = async (e) => {
        e.stopPropagation();
        try {
            await api.post(`/posts/${post._id}/like`);
            setLikes(prev => isLiked ? prev.filter(id => id !== currentUserId) : [...prev, currentUserId]);
        } catch (err) { console.error(err); }
    };

    const handleShare = async (e) => {
        e.stopPropagation();
        try {
            await api.post(`/posts/${post._id}/share`);
            navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
            success('Link copied!');
        } catch (err) { console.error(err); }
    };

    const handleShowAnalytics = async (e) => {
        e.stopPropagation();
        if (!showAnalytics && !analyticsData) {
            try {
                const res = await api.get(`/posts/${post._id}/analytics`);
                setAnalyticsData(res.data);
            } catch (err) { console.error(err); }
        }
        setShowAnalytics(!showAnalytics);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
            className={`group relative bg-white rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col overflow-hidden h-full border border-slate-100 ${!isActive ? 'opacity-70 grayscale' : ''}`}
        >
            {/* --- Analytics Overlay --- */}
            <AnimatePresence>
                {showAnalytics && analyticsData && (
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        className="absolute inset-0 bg-white/90 z-30 p-6 flex flex-col justify-center items-center text-center"
                    >
                        <h3 className="text-xl font-bold text-slate-900 mb-6">Post Performance</h3>
                        <div className="grid grid-cols-2 gap-4 w-full mb-6">
                            <div className="p-4 bg-slate-50 rounded-2xl">
                                <p className="text-2xl font-black text-slate-900">{analyticsData.views}</p>
                                <p className="text-[10px] uppercase tracking-wider text-slate-500">Views</p>
                            </div>
                            <div className="p-4 bg-pink-50 rounded-2xl">
                                <p className="text-2xl font-black text-pink-600">{analyticsData.likes}</p>
                                <p className="text-[10px] uppercase tracking-wider text-pink-500">Likes</p>
                            </div>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowAnalytics(false); }}
                            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm"
                        >
                            Close Analytics
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- Image Section --- */}
            <div className="relative aspect-[4/3] overflow-hidden cursor-pointer" onClick={() => navigate(`/post/${post._id}`)}>
                {images && images.length > 0 ? (
                    <img
                        src={images[0]}
                        alt={title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                        <Sparkles size={48} />
                    </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className={`absolute top-4 left-4 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-lg backdrop-blur-md border border-white/20 ${typeStyle.bg} ${typeStyle.text}`}>
                    {typeStyle.label}
                </div>

                {status && status !== 'active' && (
                    <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                        {status}
                    </div>
                )}
            </div>

            {/* --- Content Section --- */}
            <div className="p-5 flex flex-col flex-grow relative">
                
                <div className="flex items-center gap-3 mb-3">
                    <Link to={`/profile?userId=${user?._id}`} className="block">
                        <img
                            src={getAvatarUrl(user)}
                            alt={user?.displayName}
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                        />
                    </Link>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 line-clamp-1">{user?.displayName || 'Anonymous'}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                </div>

                <div className="mb-4 flex-grow">
                    <h3 className="text-lg font-bold text-slate-900 leading-snug mb-1 line-clamp-2 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => navigate(`/post/${post._id}`)}>
                        {title}
                    </h3>
                    <div className="relative">
                        <p className={`text-sm text-slate-500 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
                            {description}
                        </p>
                        {description?.length > 80 && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                                className="text-xs font-semibold text-indigo-600 mt-1 hover:underline"
                            >
                                {expanded ? 'Show less' : 'Read more'}
                            </button>
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {(isGeneratingAI || aiResult) && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                            animate={{ height: 'auto', opacity: 1, marginBottom: 16 }}
                            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-3 border border-indigo-100">
                                {isGeneratingAI ? (
                                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
                                        <Sparkles className="w-3 h-3 animate-spin" /> Analyzing...
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide">✨ AI Insight</span>
                                            <button onClick={() => setAiResult(null)}><X size={14} className="text-indigo-400" /></button>
                                        </div>
                                        <p className="text-xs font-medium text-indigo-900">{aiResult.summary}</p>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* --- Footer (Price & Actions) --- */}
                <div className="mt-auto">
                    <div className="flex items-center justify-between mb-4">
                        {/* Price Block & Short Location */}
                        <div className="min-w-0 pr-2"> 
                            {price ? (
                                <div className="text-xl font-black text-slate-900">
                                    ₹{price.toLocaleString()}
                                </div>
                            ) : (
                                <div className="text-lg font-bold text-emerald-600">Free</div>
                            )}
                            
                            {/* UPDATED: Displays only the first part of the address */}
                            <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wide truncate">
                                <MapPin size={10} className="shrink-0" /> 
                                <span className="truncate">{shortLocation}</span>
                            </div>
                        </div>

                        {/* Interaction Icons */}
                        <div className="flex items-center gap-1 shrink-0">
                            <motion.button whileTap={{ scale: 0.8 }} onClick={handleGetAIInsights} className={`p-2 rounded-full ${aiResult ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'} transition-colors`}>
                                <Sparkles size={18} />
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.8 }} onClick={handleLike} className={`p-2 rounded-full flex items-center gap-1 ${isLiked ? 'bg-pink-50 text-pink-600' : 'text-slate-400 hover:bg-pink-50 hover:text-pink-600'} transition-colors`}>
                                <Heart size={18} className={isLiked ? 'fill-current' : ''} />
                                {likes.length > 0 && <span className="text-xs font-bold">{likes.length}</span>}
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.8 }} onClick={handleShare} className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                                <Share2 size={18} />
                            </motion.button>
                        </div>
                    </div>

                    {/* Main CTA Button */}
                    {isOwnPost ? (
                         <div className="flex gap-2">
                             <button onClick={handleShowAnalytics} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                                <BarChart2 size={16} /> Stats
                             </button>
                             {onEdit && (
                                <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-900 hover:bg-slate-200 transition-colors">
                                    <Edit2 size={16} />
                                </button>
                             )}
                         </div>
                    ) : (
                        onRequestContact && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onRequestContact(post._id, e); }}
                                className="w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-lg shadow-slate-900/20 hover:bg-black hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <MessageCircle size={16} />
                                {acceptsBarter ? 'Contact & Barter' : 'Contact Seller'}
                            </button>
                        )
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default PostCard;