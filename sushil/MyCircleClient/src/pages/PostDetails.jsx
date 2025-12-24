import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import PostCard from '../components/ui/PostCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { getAvatarUrl } from '../utils/avatar';
import { ArrowLeft, MapPin, DollarSign, Clock, MessageCircle, Share2, Heart, Repeat, Phone, UserPlus, UserCheck, Check, Copy, Edit2, Trash2 } from 'lucide-react';
import { useDialog } from '../hooks/useDialog';

const PostDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { success, error: showError } = useToast();
    const dialog = useDialog();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [requestLoading, setRequestLoading] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [requestSent, setRequestSent] = useState(false);
    const [likes, setLikes] = useState([]);
    const [shares, setShares] = useState(0);
    const [relatedPosts, setRelatedPosts] = useState([]);
    const [replyingTo, setReplyingTo] = useState(null); // Comment ID being replied to
    const [replyText, setReplyText] = useState('');
    const [editingComment, setEditingComment] = useState(null); // Comment ID being edited
    const [editText, setEditText] = useState('');

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

    const handleRequest = async () => {
        try {
            await api.post(`/contacts/request/${post.user._id}`);
            setRequestStatus('sent');
            success('Contact request sent!');
        } catch (err) {
            console.error(err);
            if (err.response?.status === 400 && err.response?.data?.msg === 'Request already sent') {
                showError('Request already pending');
                setRequestStatus('sent');
            } else {
                showError('Failed to send request');
            }
        }
    };

    const handleMessage = async () => {
        try {
            await api.post(`/chat/init/${post.user._id}`);
            navigate('/chat');
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
            navigator.clipboard.writeText(res.data.link || window.location.href);
            success('Link copied to clipboard!');
        } catch (err) {
            console.error(err);
            // Fallback to purely client-side clipboard if api response doesn't give link (though it should now)
            navigator.clipboard.writeText(window.location.href);
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
        } catch (err) {
            console.error('Contact request error:', err);
            const errorMessage = err.response?.data?.message || err.response?.data?.msg || 'Failed to send contact request. Please try again.';
            if (errorMessage.toLowerCase().includes('already sent') || errorMessage.toLowerCase().includes('existing request')) {
                setRequestSent(true);
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

                    {/* Comments Section */}
                    <div id="comments">
                        <div className="h-px bg-white/10 mb-8" />
                        <h2 className="text-xl font-bold text-white mb-6">Comments ({post.comments?.length || 0})</h2>

                        {/* New Comment Input */}
                        {user ? (
                            <form onSubmit={handleCommentSubmit} className="mb-8 flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden shrink-0">
                                    <img src={user.avatar || "https://ui-avatars.com/api/?name=" + user.displayName} alt={user.displayName} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder="Add a comment..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
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
                            <div className="mb-8 p-4 bg-white/5 rounded-xl text-center text-gray-400 text-sm">
                                Please <button onClick={() => navigate('/login')} className="text-primary hover:underline">sign in</button> to comment.
                            </div>
                        )}

                        {/* Comments List */}
                        <div className="space-y-6">
                            {post.comments?.length > 0 ? (
                                post.comments.map((comment, index) => (
                                    <div key={index} className="flex gap-4 group">
                                        <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden shrink-0">
                                            <img src={comment.user?.avatar || "https://ui-avatars.com/api/?name=User"} alt={comment.user?.displayName || "User"} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-white">{comment.user?.displayName || "Unknown User"}</span>
                                                    <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
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
                                                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => handleEditComment(comment._id)}
                                                        disabled={!editText.trim()}
                                                        className="text-primary text-sm font-medium hover:text-white disabled:opacity-50"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingComment(null);
                                                            setEditText('');
                                                        }}
                                                        className="text-gray-400 text-sm font-medium hover:text-white"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <p className="text-gray-300">{comment.text}</p>
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
                                                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => handleReplySubmit(comment._id)}
                                                        disabled={!replyText.trim()}
                                                        className="text-primary text-sm font-medium hover:text-white disabled:opacity-50"
                                                    >
                                                        Send
                                                    </button>
                                                </div>
                                            )}

                                            {/* Nested Replies */}
                                            {comment.replies && comment.replies.length > 0 && (
                                                <div className="mt-4 space-y-4 border-l-2 border-white/10 pl-4">
                                                    {comment.replies.map((reply, rIndex) => (
                                                        <div key={rIndex} className="flex gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden shrink-0">
                                                                <img src={reply.user?.avatar || "https://ui-avatars.com/api/?name=User"} alt={reply.user?.displayName || "User"} className="w-full h-full object-cover" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <span className="font-medium text-sm text-white">{reply.user?.displayName}</span>
                                                                    <span className="text-[10px] text-gray-500">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                                                </div>
                                                                <p className="text-sm text-gray-300">{reply.text}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 italic">No comments yet. Be the first to start a conversation!</p>
                            )}
                        </div>
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
                            {post.acceptsBarter ? (
                                <span className="text-pink-400 text-2xl">Barter / Exchange</span>
                            ) : (
                                <>₹{post.price} <span className="text-sm text-gray-400 font-normal">/ estimated</span></>
                            )}
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
                                    disabled={requestLoading || requestSent}
                                >
                                    <MessageCircle className="w-5 h-5 mr-2" />
                                    {requestSent ? 'Request Sent' : (requestLoading ? 'Sending...' : 'Request Contact')}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full h-12 text-lg hover:bg-white/10 border-white/20 text-white"
                                    onClick={handleMessage}
                                >
                                    <MessageCircle className="w-5 h-5 mr-2" />
                                    Message
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
