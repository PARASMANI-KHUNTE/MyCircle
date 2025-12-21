import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import PostCard from '../components/ui/PostCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { getAvatarUrl } from '../utils/avatar';
import { ArrowLeft, MapPin, DollarSign, Clock, MessageCircle, Share2, Heart, Repeat } from 'lucide-react';

const PostDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { success, error: showError } = useToast();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [requestLoading, setRequestLoading] = useState(false);
    const [likes, setLikes] = useState([]);
    const [shares, setShares] = useState(0);
    const [relatedPosts, setRelatedPosts] = useState([]);

    const currentUserId = user?.id;
    const isLiked = currentUserId && likes.includes(currentUserId);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await api.get(`/posts/${id}`);
                setPost(res.data);
                setLikes(res.data.likes || []);
                setShares(res.data.shares || 0);
                setShares(res.data.shares || 0);

                // Fetch Related Posts
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

    const handleLike = async () => {
        try {
            const res = await api.post(`/posts/${id}/like`);
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
        try {
            await api.post(`/posts/${id}/share`);
            setShares(shares + 1);
            navigator.clipboard.writeText(window.location.href);
            success('Link copied to clipboard!');
        } catch (err) {
            console.error(err);
            showError('Failed to share post');
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
        } catch (err) {
            console.error('Contact request error:', err);
            // Show the specific error message from the server
            const errorMessage = err.response?.data?.message || err.response?.data?.msg || 'Failed to send contact request. Please try again.';
            showError(errorMessage);
        } finally {
            setRequestLoading(false);
        }
    };

    if (loading) return <div className="text-white text-center py-20">Loading details...</div>;
    if (!post) return <div className="text-white text-center py-20">Post not found</div>;

    const isOwnPost = currentUserId && post.user._id === currentUserId;

    return (
        <div className="container mx-auto px-6 py-24 min-h-screen">
            <Button variant="ghost" className="mb-6 pl-0 hover:bg-transparent text-gray-400 hover:text-white" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to Feed
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Hero Image */}
                    <div className="rounded-2xl overflow-hidden aspect-video bg-gray-800 relative group">
                        {post.images && post.images.length > 0 ? (
                            <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-600 bg-white/5">
                                No Image Available
                            </div>
                        )}
                    </div>

                    {/* Title & Info */}
                    <div>
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex gap-2 mb-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider
                                        ${post.type === 'job' ? 'bg-blue-500/20 text-blue-400' :
                                            post.type === 'sell' ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                        {post.type}
                                    </span>
                                    {post.acceptsBarter && (
                                        <span className="px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider bg-pink-500/20 text-pink-400 flex items-center gap-1">
                                            <Repeat className="w-3 h-3" /> Barter Accepted
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-4xl font-bold text-white mb-4">{post.title}</h1>
                                <div className="flex flex-wrap gap-4 text-gray-400 text-sm">
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4 text-primary" /> {post.location}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4 text-primary" /> Posted {new Date(post.createdAt).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1 text-pink-400">
                                        <Heart className="w-4 h-4" /> {likes.length} Likes
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleShare}
                                    className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white"
                                >
                                    <Share2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleLike}
                                    className={`p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors ${isLiked ? 'text-pink-500' : 'text-white'}`}
                                >
                                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-white/10" />

                    {/* Description */}
                    <div>
                        <h2 className="text-xl font-bold text-white mb-4">Description</h2>
                        <p className="text-gray-300 leading-relaxed text-lg whitespace-pre-wrap">
                            {post.description}
                        </p>

                        {post.acceptsBarter && post.barterPreferences && (
                            <div className="mt-6 p-4 rounded-xl bg-pink-500/5 border border-pink-500/20">
                                <h3 className="text-pink-400 font-semibold mb-2 flex items-center gap-2">
                                    <Repeat className="w-4 h-4" /> Barter Preferences
                                </h3>
                                <p className="text-gray-300">
                                    {post.barterPreferences}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Related Posts */}
                    {relatedPosts.length > 0 && (
                        <div>
                            <div className="h-px bg-white/10 mb-8" />
                            <h2 className="text-xl font-bold text-white mb-4">Related Posts</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {relatedPosts.map(post => (
                                    <PostCard key={post._id} post={post} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <div className="glass rounded-2xl p-6 sticky top-24">
                        <div className="text-3xl font-bold text-white mb-6 flex items-baseline gap-1">
                            ₹{post.price} <span className="text-sm text-gray-400 font-normal">/ estimated</span>
                        </div>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden">
                                <img src={post.user?.avatar} alt={post.user?.displayName} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <div className="font-bold text-white">{post.user?.displayName}</div>
                                <div className="text-yellow-500 text-sm flex items-center gap-1">
                                    ★ {post.user?.rating || 'New'}
                                </div>
                            </div>
                        </div>

                        {!isOwnPost && (
                            <div className="space-y-3">
                                <Button
                                    variant="primary"
                                    className="w-full h-12 text-lg"
                                    onClick={handleContactRequest}
                                    disabled={requestLoading}
                                >
                                    <MessageCircle className="w-5 h-5 mr-2" />
                                    {requestLoading ? 'Sending Request...' : 'Request Contact'}
                                </Button>
                                <Button variant="outline" className="w-full h-12">
                                    Save for Later
                                </Button>
                            </div>
                        )}

                        <p className="text-xs text-center text-gray-500 mt-6">
                            Safety Tip: Always meet in public places for exchanges.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostDetails;
