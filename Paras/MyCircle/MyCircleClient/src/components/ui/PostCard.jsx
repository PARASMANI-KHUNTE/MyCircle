import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import api from '../../utils/api';
import { getAvatarUrl } from '../../utils/avatar';
import { getPostInsights, getPostExplanation } from '../../services/aiService';
import {
    Sparkles, X, Edit2, Heart, Share2, MessageCircle, MapPin,
    BarChart2, ArrowUpRight
} from 'lucide-react';

const typeConfig = {
    job: { bg: 'bg-blue-50 text-blue-700 border-blue-100', label: 'Job' },
    service: { bg: 'bg-violet-50 text-violet-700 border-violet-100', label: 'Service' },
    sell: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'For Sale' },
    rent: { bg: 'bg-orange-50 text-orange-700 border-orange-100', label: 'Rental' }
};

const PostCard = ({ post, onRequestContact, currentUserId, isOwnPost: propIsOwnPost, onEdit }) => {
    const navigate = useNavigate();
    const { title, description, type, location, price, user, createdAt, images, acceptsBarter, likes: initialLikes, isActive, status } = post;
    const { success } = useToast();

    // State
    const [likes, setLikes] = useState(initialLikes || []);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [aiResult, setAiResult] = useState(null);

    // Computed
    const isOwnPost = propIsOwnPost || (currentUserId && user?._id === currentUserId);
    const isLiked = currentUserId && likes.includes(currentUserId);
    const typeStyle = typeConfig[type] || typeConfig.job;
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

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
            transition={{ duration: 0.2 }}
            className={`group h-full bg-white rounded-2xl border border-zinc-200 overflow-hidden flex flex-col relative ${!isActive ? 'opacity-60 grayscale' : 'shadow-sm hover:border-zinc-300'}`}
        >
            {/* --- Image Section --- */}
            <div className="relative aspect-[4/3] overflow-hidden cursor-pointer bg-zinc-100" onClick={() => navigate(`/post/${post._id}`)}>
                {images && images.length > 0 ? (
                    <img
                        src={images[0]}
                        alt={title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-300">
                        <Sparkles size={32} />
                    </div>
                )}

                {/* Overlay Gradient on Hover */}
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Badge */}
                <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-sm shadow-sm ${typeStyle.bg} ${typeStyle.text}`}>
                    {typeStyle.label}
                </div>
            </div>

            {/* --- Content Section --- */}
            <div className="p-5 flex flex-col flex-grow">

                {/* Meta Header */}
                <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                        <h3 className="text-base font-bold text-zinc-900 leading-snug line-clamp-1 group-hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => navigate(`/post/${post._id}`)}>
                            {title}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-zinc-500 font-medium mt-0.5">
                            <MapPin size={10} strokeWidth={2.5} />
                            <span className="truncate max-w-[150px]">{shortLocation}</span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-zinc-500 leading-relaxed line-clamp-2 mb-4">
                    {description}
                </p>

                {/* AI Insight Overlay */}
                <AnimatePresence>
                    {(isGeneratingAI || aiResult) && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                            animate={{ height: 'auto', opacity: 1, marginBottom: 16 }}
                            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-indigo-50/50 rounded-lg p-3 border border-indigo-100 text-xs">
                                {isGeneratingAI ? (
                                    <div className="flex items-center gap-2 font-semibold text-indigo-600">
                                        <Sparkles className="w-3 h-3 animate-spin" /> Analyzing...
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-indigo-900 uppercase tracking-wide text-[10px]">AI Insight</span>
                                            <button onClick={() => setAiResult(null)}><X size={12} className="text-indigo-400 hover:text-indigo-700" /></button>
                                        </div>
                                        <p className="font-medium text-indigo-800 leading-relaxed">{aiResult.summary}</p>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* --- Footer --- */}
                <div className="mt-auto pt-4 border-t border-zinc-50 flex items-center justify-between">
                    {/* Price */}
                    <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Price</span>
                        <span className={`font-bold ${price ? 'text-zinc-900' : 'text-emerald-600'}`}>
                            {price ? `₹${price.toLocaleString()}` : (acceptsBarter ? 'Barter' : 'Free')}
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                        {!isOwnPost && (
                            <button
                                onClick={handleLike}
                                className={`p-2 rounded-full transition-all ${isLiked ? 'text-pink-600 bg-pink-50' : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900'}`}
                            >
                                <Heart size={18} className={isLiked ? 'fill-current' : ''} />
                            </button>
                        )}

                        {isOwnPost ? (
                            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 rounded-full text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
                                <Edit2 size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={(e) => { e.stopPropagation(); onRequestContact && onRequestContact(post._id, e); }}
                                className="ml-2 px-4 py-2 rounded-full bg-zinc-900 text-white text-xs font-bold shadow-sm hover:bg-black hover:shadow-md transition-all flex items-center gap-1.5"
                            >
                                Contact <ArrowUpRight size={12} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default PostCard;