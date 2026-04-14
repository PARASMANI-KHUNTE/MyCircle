import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import { getAvatarUrl } from '../utils/avatar';
import { Check, X, Clock, MessageCircle, ArrowRight, Layers, User, Package, Trash2, Star, BadgeCheck, Phone, MessageSquare } from 'lucide-react';

const Requests = () => {
    const { success, error: showError } = useToast();
    const [activeTab, setActiveTab] = useState('received'); // 'received' or 'sent'
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const endpoint = activeTab === 'received' ? '/contacts/received' : '/contacts/sent';
            const res = await api.get(endpoint);
            if (activeTab === 'received') setReceivedRequests(res.data);
            else setSentRequests(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        void fetchRequests();
    }, [fetchRequests]);

    const navigate = useNavigate();

    const handleMessage = async (userId) => {
        try {
            await api.post(`/chat/init/${userId}`);
            navigate(`/chat?recipientId=${userId}`);
        } catch (err) {
            console.error(err);
            showError("Failed to start chat");
        }
    };

    const handleStartText = (phone) => {
        if (!phone) {
            showError('Phone number not available');
            return;
        }
        window.open(`sms:${phone}`, '_blank');
    };

    const handleCall = (phone) => {
        if (!phone) {
            showError('Phone number not available');
            return;
        }
        window.open(`tel:${phone}`, '_blank');
    };

    const handleAction = async (requestId, status) => {
        try {
            await api.put(`/contacts/${requestId}/status`, { status });
            // Optimistic update
            setReceivedRequests(prev => prev.map(req =>
                req._id === requestId ? { ...req, status } : req
            ));
            success(`Request ${status} successfully`);
        } catch (err) {
            console.error(err);
            showError("Action failed. Please try again.");
        }
    };

    const updateRequestInState = (updatedRequest) => {
        setReceivedRequests((prev) => prev.map((req) => req._id === updatedRequest._id ? updatedRequest : req));
        setSentRequests((prev) => prev.map((req) => req._id === updatedRequest._id ? updatedRequest : req));
    };

    const handleComplete = async (requestId) => {
        try {
            const res = await api.put(`/contacts/${requestId}/status`, { status: 'completed' });
            updateRequestInState(res.data);
            success('Work marked complete');
        } catch (err) {
            console.error(err);
            showError('Failed to mark work as complete.');
        }
    };

    const handleRate = async (request) => {
        const scoreInput = window.prompt('Rate this completed work from 1 to 5');
        const score = Number(scoreInput);
        if (!scoreInput) return;
        if (!Number.isFinite(score) || score < 1 || score > 5) {
            showError('Please enter a score between 1 and 5.');
            return;
        }

        const review = window.prompt('Optional review (max 300 characters)') || '';

        try {
            const res = await api.post(`/contacts/${request._id}/rate`, { score, review });
            updateRequestInState(res.data);
            success('Rating submitted');
        } catch (err) {
            console.error(err);
            showError(err.response?.data?.msg || 'Failed to submit rating.');
        }
    };



    const handleDelete = async (requestId) => {
        try {
            await api.delete(`/contacts/${requestId}`);
            if (activeTab === 'received') {
                setReceivedRequests(prev => prev.filter(req => req._id !== requestId));
            } else {
                setSentRequests(prev => prev.filter(req => req._id !== requestId));
            }
            success('Request removed');
        } catch (err) {
            console.error(err);
            showError('Failed to remove request');
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="mb-4" />

            {/* Tabs */}
            <div className="flex gap-1 glass-panel p-1 rounded-2xl mb-8 w-fit relative bg-card/50 backdrop-blur-md">
                <button
                    onClick={() => setActiveTab('received')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${activeTab === 'received'
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'text-text-muted hover:text-text-heading hover:bg-hover-bg'
                        }`}
                >
                    Received
                    {receivedRequests.filter(r => r.status === 'pending').length > 0 && (
                        <span className="bg-red-500 text-primary-foreground text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-lg shadow-red-500/20">
                            {receivedRequests.filter(r => r.status === 'pending').length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('sent')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === 'sent'
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'text-text-muted hover:text-text-heading hover:bg-hover-bg'
                        }`}
                >
                    Sent
                </button>
            </div>

            {/* Content */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-500 animate-pulse">Syncing requests...</p>
                    </div>
                ) : activeTab === 'received' ? (
                    receivedRequests.length === 0 ? (
                        <div className="text-center py-20 glass-panel rounded-3xl border border-dashed border-card-border">
                            <Layers className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-20" />
                            <p className="text-text-muted">No requests received yet.</p>
                        </div>
                    ) : (
                        receivedRequests.map((req) => (
                            <motion.div
                                key={req._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-hover-bg transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <img
                                            src={getAvatarUrl(req.requester)}
                                            alt={req.requester?.displayName}
                                            className="w-14 h-14 rounded-full bg-secondary ring-1 ring-white/10 object-cover"
                                        />
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-background shadow-md">
                                            <User className="w-3 h-3 text-primary-foreground" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-text-heading text-lg group-hover:text-primary transition-colors flex items-center gap-2">
                                            {req.requester?.displayName || 'Unknown User'}
                                            <span className="text-xs font-medium text-text-muted px-2 py-0.5 rounded-full bg-card/10 border border-card-border">Requester</span>
                                        </h3>

                                        {/* Enriched Post Preview */}
                                        <div className="flex bg-card/10 rounded-xl p-3 gap-3 border border-card-border mt-3 group/post hover:bg-card/20 transition-colors">
                                            {req.post?.images?.[0] ? (
                                                <img src={req.post.images[0]} alt="Post" className="w-16 h-16 rounded-lg object-cover bg-card/20 border border-card-border" />
                                            ) : (
                                                <div className="w-16 h-16 rounded-lg bg-card/20 flex items-center justify-center border border-dashed border-card-border">
                                                    <Package className="w-6 h-6 text-muted-foreground/50" />
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1 flex flex-col justify-center">
                                                <Link to={`/post/${req.post?._id}`} className="font-bold text-base text-text-heading group-hover/post:text-primary transition-colors line-clamp-1 block">
                                                    {req.post?.title || <span className="text-text-muted italic">Post Unavailable</span>}
                                                </Link>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-bold uppercase tracking-wider border border-card-border">{req.post?.type || 'N/A'}</span>
                                                    {req.post?.price && (
                                                        <span className="text-sm font-black text-foreground">₹{req.post.price}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {req.message && (
                                            <div className="mt-3 text-xs text-muted-foreground bg-card/5 px-3 py-2 rounded-lg border border-card-border italic flex gap-2">
                                                <span className="opacity-50 font-serif text-lg leading-none">"</span>
                                                {req.message}
                                                <span className="opacity-50 font-serif text-lg leading-none self-end">"</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {req.status === 'pending' ? (
                                        <>
                                            <Button
                                                variant="primary"
                                                onClick={() => handleAction(req._id, 'accepted')}
                                                className="h-10 px-4 text-sm"
                                            >
                                                <Check className="w-4 h-4 mr-2" /> Accept
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="h-10 px-4 text-sm text-red-400 border-red-400/20 hover:bg-red-500/10"
                                                onClick={() => handleAction(req._id, 'rejected')}
                                            >
                                                <X className="w-4 h-4 mr-2" /> Reject
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className={`px-4 py-1.5 rounded-xl text-xs font-bold border ${req.status === 'accepted' || req.status === 'completed'
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                }`}>
                                                {req.status.toUpperCase()}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                className="text-muted-foreground hover:bg-red-500/10 hover:text-red-400 p-2.5 h-auto rounded-xl"
                                                onClick={() => handleDelete(req._id)}
                                                title="Clear Request"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                            {(req.status === 'accepted' || req.status === 'completed') && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        className="text-primary hover:bg-primary/10 p-2.5 h-auto rounded-xl"
                                                        onClick={() => handleMessage(req.requester._id)}
                                                    >
                                                        <MessageCircle className="w-5 h-5" />
                                                    </Button>
                                                    {(req.requester?.contactPhone || req.requester?.contactWhatsapp) && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                className="text-green-400 hover:bg-green-500/10 p-2.5 h-auto rounded-xl"
                                                                onClick={() => handleCall(req.requester?.contactPhone || req.requester?.contactWhatsapp)}
                                                                title="Call"
                                                            >
                                                                <Phone className="w-5 h-5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                className="text-blue-400 hover:bg-blue-500/10 p-2.5 h-auto rounded-xl"
                                                                onClick={() => handleStartText(req.requester?.contactWhatsapp || req.requester?.contactPhone)}
                                                                title="Text Message"
                                                            >
                                                                <MessageSquare className="w-5 h-5" />
                                                            </Button>
                                                        </>
                                                    )}
                                                    {req.status === 'accepted' && (
                                                        <Button
                                                            variant="ghost"
                                                            className="text-green-400 hover:bg-green-500/10 p-2.5 h-auto rounded-xl"
                                                            onClick={() => handleComplete(req._id)}
                                                            title="Mark Completed"
                                                        >
                                                            <BadgeCheck className="w-5 h-5" />
                                                        </Button>
                                                    )}
                                                    {req.status === 'completed' && req.canRate && (
                                                        <Button
                                                            variant="ghost"
                                                            className="text-yellow-400 hover:bg-yellow-500/10 p-2.5 h-auto rounded-xl"
                                                            onClick={() => handleRate(req)}
                                                            title="Rate User"
                                                        >
                                                            <Star className="w-5 h-5" />
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )
                ) : (
                    sentRequests.length === 0 ? (
                        <div className="text-center py-20 glass-panel rounded-3xl border border-dashed border-card-border">
                            <ArrowRight className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-20" />
                            <p className="text-text-muted">You haven't sent any requests yet.</p>
                            <Button
                                variant="outline"
                                className="mt-4 border-primary/20 text-primary hover:bg-primary/10"
                                onClick={() => navigate('/feed')}
                            >
                                Explore Feed
                            </Button>
                        </div>
                    ) : (
                        sentRequests.map((req) => (
                            <motion.div
                                key={req._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-panel p-6 rounded-2xl flex flex-col gap-4 hover:bg-hover-bg transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={getAvatarUrl(req.recipient)}
                                            alt={req.recipient?.displayName}
                                            className="w-12 h-12 rounded-full ring-1 ring-white/10"
                                        />
                                        <div>
                                            {/* Rich Post Preview for Sent Requests */}
                                            <div className="flex items-center gap-4">
                                                {req.post?.images?.[0] ? (
                                                    <img src={req.post.images[0]} alt="Post" className="w-14 h-14 rounded-xl object-cover bg-card/20 border border-card-border" />
                                                ) : (
                                                    <div className="w-14 h-14 rounded-xl bg-card/20 flex items-center justify-center border border-dashed border-card-border">
                                                        <Package className="w-5 h-5 text-muted-foreground/50" />
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="font-bold text-text-heading text-lg leading-tight">
                                                        <Link to={`/post/${req.post?._id}`} className="hover:text-primary transition-colors">
                                                            {req.post?.title || 'Unknown Post'}
                                                        </Link>
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1 text-xs">
                                                        <span className="text-text-muted">To: <span className="font-semibold text-text-heading">{req.recipient?.displayName}</span></span>
                                                        {req.post?.price && (
                                                            <>
                                                                <span className="w-1 h-1 rounded-full bg-card-border" />
                                                                <span className="font-bold text-foreground">₹{req.post.price}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-4 py-1.5 rounded-xl text-xs font-bold border ${req.status === 'accepted' || req.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                            req.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                            }`}>
                                            {req.status.toUpperCase()}
                                        </span>
                                        {req.status === 'pending' ? (
                                            <Button
                                                variant="outline"
                                                className="h-auto py-1.5 px-3 text-xs border-red-500/20 text-red-400 hover:bg-red-500/10"
                                                onClick={() => handleDelete(req._id)}
                                            >
                                                Withdraw
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                className="text-muted-foreground hover:bg-red-500/10 hover:text-red-400 p-2 h-auto rounded-xl"
                                                onClick={() => handleDelete(req._id)}
                                                title="Clear Request"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Contact Reveal */}
                                {(req.status === 'accepted' || req.status === 'completed') && req.post && (
                                    <div className="bg-card/5 p-4 rounded-xl border border-card-border flex flex-col gap-4 mt-2">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <p className="text-green-500 text-sm font-medium">
                                                {req.status === 'completed'
                                                    ? 'Work completed. Finish the loop by rating each other.'
                                                    : 'Request accepted. You can now coordinate and complete the work.'}
                                            </p>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Button
                                                    variant="primary"
                                                    className="py-1.5 px-3 text-sm"
                                                    onClick={() => handleMessage(req.recipient?._id)}
                                                >
                                                    <MessageCircle className="w-4 h-4 mr-2" />
                                                    Chat
                                                </Button>
                                                {(req.recipient?.contactPhone || req.recipient?.contactWhatsapp) && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            className="py-1.5 px-3 text-sm border-green-500/20 text-green-400 hover:bg-green-500/10"
                                                            onClick={() => handleCall(req.recipient?.contactPhone || req.recipient?.contactWhatsapp)}
                                                        >
                                                            <Phone className="w-4 h-4 mr-2" />
                                                            Call
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            className="py-1.5 px-3 text-sm border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
                                                            onClick={() => handleStartText(req.recipient?.contactWhatsapp || req.recipient?.contactPhone)}
                                                        >
                                                            <MessageSquare className="w-4 h-4 mr-2" />
                                                            Text
                                                        </Button>
                                                    </>
                                                )}
                                                {req.status === 'accepted' && (
                                                    <Button
                                                        variant="outline"
                                                        className="py-1.5 px-3 text-sm border-green-500/20 text-green-400 hover:bg-green-500/10"
                                                        onClick={() => handleComplete(req._id)}
                                                    >
                                                        Mark Complete
                                                    </Button>
                                                )}
                                                {req.status === 'completed' && req.canRate && (
                                                    <Button
                                                        variant="outline"
                                                        className="py-1.5 px-3 text-sm border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10"
                                                        onClick={() => handleRate(req)}
                                                    >
                                                        Rate
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))
                    )
                )}
            </div>
        </div>
    );
};

export default Requests;
