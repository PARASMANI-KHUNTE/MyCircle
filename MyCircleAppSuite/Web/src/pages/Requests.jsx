import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useToast } from '../components/ui/Toast';
import { useSocket } from '../context/SocketContext';
import Button from '../components/ui/Button';
import { getAvatarUrl } from '../utils/avatar';
import { 
    Check, X, Clock, MessageCircle, ArrowRight, User, Package, 
    Trash2, Star, Phone, MessageSquare, MapPin, DollarSign,
    RefreshCw, CheckCircle, XCircle, Send
} from 'lucide-react';

const Requests = () => {
    const { success, error: showError } = useToast();
    const { socket } = useSocket();
    const [activeTab, setActiveTab] = useState('received');
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const refreshAllRequests = useCallback(async (showLoader = false) => {
        if (showLoader) {
            setLoading(true);
        }
        try {
            const [receivedRes, sentRes] = await Promise.all([
                api.get('/contacts/received'),
                api.get('/contacts/sent')
            ]);
            setReceivedRequests(receivedRes.data);
            setSentRequests(sentRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            if (showLoader) {
                setLoading(false);
            }
        }
    }, []);

    const fetchRequests = useCallback(async () => {
        await refreshAllRequests(true);
    }, [refreshAllRequests]);

    useEffect(() => {
        void fetchRequests();
    }, [fetchRequests]);

    // Real-time: listen for request-related notifications
    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (notification) => {
            if (['request', 'approval', 'info'].includes(notification?.type)) {
                console.log('[Requests] Real-time update received');
                void refreshAllRequests(false);
                void fetchRequests();
            }
        };

        socket.on('new_notification', handleNewNotification);

        return () => {
            socket.off('new_notification', handleNewNotification);
        };
    }, [socket, refreshAllRequests, fetchRequests]);

    const navigate = useNavigate();

    const handleMessage = async (userId) => {
        try {
            const res = await api.post(`/chat/init/${userId}`);
            const targetConversationId = res.data?._id;
            navigate(targetConversationId ? `/chat?conversationId=${targetConversationId}` : `/chat?recipientId=${userId}`);
        } catch (err) {
            console.error(err);
            showError(err.response?.data?.msg || "Failed to start chat");
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
        setActionLoading(requestId);
        try {
            const { data } = await api.put(`/contacts/${requestId}/status`, { status });
            setReceivedRequests(prev => prev.map(req =>
                req._id === requestId ? { ...req, ...data } : req
            ));
            success(status === 'accepted' ? 'Request accepted!' : 'Request rejected');
        } catch (err) {
            console.error(err);
            showError(err.response?.data?.msg || "Action failed");
        } finally {
            setActionLoading(null);
        }
    };

    const handleComplete = async (requestId) => {
        setActionLoading(requestId);
        try {
            const { data } = await api.put(`/contacts/${requestId}/status`, { status: 'completed' });
            setReceivedRequests(prev => prev.map(req =>
                req._id === requestId ? { ...req, ...data } : req
            ));
            success('Marked as completed!');
        } catch (err) {
            console.error(err);
            showError(err.response?.data?.msg || "Failed to complete");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (requestId) => {
        try {
            await api.delete(`/contacts/${requestId}`);
            setReceivedRequests(prev => prev.filter(req => req._id !== requestId));
            setSentRequests(prev => prev.filter(req => req._id !== requestId));
            success('Request removed');
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusBadge = (status) => {
        const config = {
            pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: Clock, label: 'Pending' },
            accepted: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle, label: 'Accepted' },
            completed: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: CheckCircle, label: 'Completed' },
            rejected: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle, label: 'Rejected' },
        };
        const c = config[status] || config.pending;
        const Icon = c.icon;
        return { ...c, Icon };
    };

    const requests = activeTab === 'received' ? receivedRequests : sentRequests;
    const pendingCount = receivedRequests.filter(r => r.status === 'pending').length;
    const sentPendingCount = sentRequests.filter(r => r.status === 'pending').length;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-16 md:top-20 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                {pendingCount > 0 ? `${pendingCount} pending` : 'No pending requests'}
                            </p>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={fetchRequests}
                            className="gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-4 bg-card-border/50 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('received')}
                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                                activeTab === 'received' 
                                    ? 'bg-background shadow-sm text-foreground' 
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <User className="w-4 h-4" />
                                Received
                                {pendingCount > 0 && (
                                    <span className="w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {pendingCount}
                                    </span>
                                )}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('sent')}
                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                                activeTab === 'sent' 
                                    ? 'bg-background shadow-sm text-foreground' 
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <Send className="w-4 h-4" />
                                Sent
                                {sentPendingCount > 0 && (
                                    <span className="w-5 h-5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {sentPendingCount}
                                    </span>
                                )}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-6 max-w-2xl">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-card-border/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold mb-1">
                            {activeTab === 'received' ? 'No requests received' : 'No requests sent'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {activeTab === 'received' 
                                ? 'Requests from users will appear here'
                                : 'Your sent requests will appear here'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence>
                            {requests.map((req, index) => {
                                const otherUser = activeTab === 'received' ? req.requester : req.recipient;
                                const badge = getStatusBadge(req.status);
                                const BadgeIcon = badge.Icon;
                                const isPending = req.status === 'pending';
                                const isAccepted = req.status === 'accepted' || req.status === 'completed';

                                return (
                                    <motion.div
                                        key={req._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-card border border-border rounded-2xl overflow-hidden"
                                    >
                                        {/* Post Info */}
                                        {req.post && (
                                            <Link 
                                                to={`/post/${req.post._id}`}
                                                className="flex items-center gap-3 p-4 bg-background/50 border-b border-border hover:bg-background transition-colors"
                                            >
                                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-lg overflow-hidden">
                                                    {req.post.images?.[0] ? (
                                                        <img src={req.post.images[0]} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span>📌</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm truncate">{req.post.title}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        {req.post.price > 0 && (
                                                            <span className="font-medium text-green-400">
                                                                ₹{req.post.price.toLocaleString()}
                                                            </span>
                                                        )}
                                                        <MapPin className="w-3 h-3" />
                                                        <span>{req.post.location?.split(',')[0] || 'Unknown'}</span>
                                                    </div>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                            </Link>
                                        )}

                                        {/* User Info */}
                                        <div className="p-4 flex items-start gap-4">
                                            <Link to={`/profile?userId=${otherUser?._id}`} className="shrink-0">
                                                <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/10">
                                                    <img 
                                                        src={getAvatarUrl(otherUser)} 
                                                        alt="" 
                                                        className="w-full h-full object-cover" 
                                                    />
                                                </div>
                                            </Link>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Link to={`/profile?userId=${otherUser?._id}`} className="font-semibold hover:text-primary">
                                                        {otherUser?.displayName || 'User'}
                                                    </Link>
                                                    {otherUser?.isVerified && (
                                                        <span className="text-blue-400">✓</span>
                                                    )}
                                                </div>
                                                
                                                {req.message && (
                                                    <p className="text-sm text-muted-foreground italic line-clamp-2 bg-background/50 p-2 rounded-lg">
                                                        "{req.message}"
                                                    </p>
                                                )}

                                                {/* Timeline */}
                                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                                    <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                                                    {req.post?.type && (
                                                        <span className="px-2 py-0.5 bg-primary/10 rounded-full capitalize">
                                                            {req.post.type}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div className={`px-2 py-1 rounded-full flex items-center gap-1 text-xs font-medium ${badge.bg} ${badge.text}`}>
                                                <BadgeIcon className="w-3 h-3" />
                                                {badge.label}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="p-4 pt-0 flex flex-wrap gap-2">
                                            {activeTab === 'received' && isPending && (
                                                <>
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => handleAction(req._id, 'accepted')}
                                                        disabled={actionLoading === req._id}
                                                        className="gap-1.5"
                                                    >
                                                        {actionLoading === req._id ? (
                                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            <Check className="w-3 h-3" />
                                                        )}
                                                        Accept
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleAction(req._id, 'rejected')}
                                                        disabled={actionLoading === req._id}
                                                        className="gap-1.5 text-red-400 border-red-400/30 hover:bg-red-500/10"
                                                    >
                                                        <X className="w-3 h-3" />
                                                        Reject
                                                    </Button>
                                                </>
                                            )}

                                            {isAccepted && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleMessage(otherUser?._id)}
                                                    className="gap-1.5"
                                                >
                                                    <MessageCircle className="w-3 h-3" />
                                                    Message
                                                </Button>
                                            )}

                                            {(otherUser?.contactPhone || otherUser?.contactWhatsapp) && isAccepted && (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleCall(otherUser.contactPhone || otherUser.contactWhatsapp)}
                                                        className="gap-1.5 text-green-400 border-green-400/30"
                                                    >
                                                        <Phone className="w-3 h-3" />
                                                        Call
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleStartText(otherUser.contactWhatsapp || otherUser.contactPhone)}
                                                        className="gap-1.5 text-blue-400 border-blue-400/30"
                                                    >
                                                        <MessageSquare className="w-3 h-3" />
                                                        Text
                                                    </Button>
                                                </>
                                            )}

                                            {req.status === 'accepted' && activeTab === 'received' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleComplete(req._id)}
                                                    disabled={actionLoading === req._id}
                                                    className="gap-1.5 text-blue-400 border-blue-400/30"
                                                >
                                                    {actionLoading === req._id ? (
                                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <CheckCircle className="w-3 h-3" />
                                                    )}
                                                    Mark Complete
                                                </Button>
                                            )}

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(req._id)}
                                                className="text-muted-foreground hover:text-red-400"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Requests;
