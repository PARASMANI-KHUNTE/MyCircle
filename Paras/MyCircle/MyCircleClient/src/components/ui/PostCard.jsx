import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Tag, MessageCircle, Clock, Heart, Share2, Repeat } from 'lucide-react';
import Button from './Button';
import api from '../../utils/api';

const PostCard = ({ post, onRequestContact, currentUserId }) => {
    const { title, description, type, location, price, user, createdAt, images, acceptsBarter, likes: initialLikes, shares: initialShares } = post;
    const [likes, setLikes] = useState(initialLikes || []);
    const [shares, setShares] = useState(initialShares || 0);

    // Check if this is the current user's post
    const isOwnPost = currentUserId && user?._id === currentUserId;
    const isLiked = currentUserId && likes.includes(currentUserId);

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
            alert('Link copied to clipboard!');
        } catch (err) {
            console.error(err);
        }
    };

    const typeColors = {
        job: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        service: 'bg-green-500/10 text-green-400 border-green-500/20',
        sell: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        rent: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 hover:border-white/20 transition-all duration-300 flex flex-col h-full"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <img
                        src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.displayName}`}
                        alt={user?.displayName}
                        className="w-10 h-10 rounded-full bg-secondary object-cover border border-white/10"
                    />
                    <div>
                        <h3 className="font-semibold text-white leading-tight line-clamp-1">{title}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                            <span>{user?.displayName || 'Anonymous'}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${typeColors[type] || typeColors.job}`}>
                        {type.toUpperCase()}
                    </span>
                    {acceptsBarter && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border bg-pink-500/10 text-pink-400 border-pink-500/20 flex items-center gap-1">
                            <Repeat className="w-3 h-3" /> Barter
                        </span>
                    )}
                </div>
            </div>

            <p className="text-gray-300 text-sm mb-4 line-clamp-2 flex-grow">
                {description}
            </p>

            {/* Image Preview */}
            {images && images.length > 0 && (
                <div className="mb-4 rounded-xl overflow-hidden h-48 bg-black/50 border border-white/5 shrink-0">
                    <img src={images[0]} alt="Post" className="w-full h-full object-cover" />
                </div>
            )}

            <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {location}
                    </span>
                    {price && <span className="text-lg font-bold text-white mt-1">₹{price}</span>}
                </div>

                {/* Social Actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleLike}
                        className={`flex items-center gap-1 text-xs transition-colors ${isLiked ? 'text-pink-500' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                        {likes.length}
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                    >
                        <Share2 className="w-4 h-4" />
                        {shares}
                    </button>
                </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-end">
                {/* Only show contact button if NOT own post */}
                {!isOwnPost && onRequestContact && (
                    <Button
                        variant="primary"
                        className="text-sm px-4 py-2 w-full justify-center"
                        onClick={() => onRequestContact(post._id)}
                    >
                        <MessageCircle className="w-4 h-4" /> Contact
                    </Button>
                )}

                {/* Show "Your Post" badge if it's own post */}
                {isOwnPost && (
                    <div className="w-full text-center py-2 text-xs text-primary bg-primary/10 rounded-xl border border-primary/20">
                        Your Post
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default PostCard;
