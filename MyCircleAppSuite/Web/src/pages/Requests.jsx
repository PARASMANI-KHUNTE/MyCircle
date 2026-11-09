import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Check, X, Clock, MessageCircle, ArrowRight, User, Package,
    Trash2, Phone, MessageSquare, MapPin, RefreshCw, CheckCircle, XCircle, Send,
} from 'lucide-react';
import api from '../utils/api';
import { useToast } from '../components/ui/Toast';
import { useSocket } from '../context/SocketContext';
import Button from '../components/ui/Button';
import { getAvatarUrl } from '../utils/avatar';
import { useCurrencySymbol } from '../context/CurrencySymbolContext';
import { cn } from '../utils/cn';

const STATUS = {
    pending: { icon: Clock, className: 'bg-primary/10 text-primary border-primary/20', label: 'Pending' },
    accepted: { icon: CheckCircle, className: 'bg-success/10 text-success border-success/20', label: 'Accepted' },
    completed: { icon: CheckCircle, className: 'bg-info/10 text-info border-info/20', label: 'Completed' },
    rejected: { icon: XCircle, className: 'bg-error/10 text-error border-error/20', label: 'Rejected' },
    canceled: { icon: XCircle, className: 'bg-background-tertiary text-foreground-muted border-card-border', label: 'Canceled' },
};

const StatusBadge = ({ status }) => {
    const config = STATUS[status] || STATUS.pending;
    const Icon = config.icon;
    return (
        <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium', config.className)}>
            <Icon className="h-3 w-3" />
            {config.label}
        </span>
    );
};

const Requests = () => {
    const { success, error: showError } = useToast();
    const { currencySymbol } = useCurrencySymbol();
    const { socket } = useSocket();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('received');
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const refreshAllRequests = useCallback(async (showLoader = false) => {
        if (showLoader) setLoading(true);
        try {
            const [receivedRes, sentRes] = await Promise.all([
                api.get('/contacts/received'),
                api.get('/contacts/sent'),
            ]);
            setReceivedRequests(Array.isArray(receivedRes.data) ? receivedRes.data : []);
            setSentRequests(Array.isArray(sentRes.data) ? sentRes.data : []);
        } catch {
            showError('Could not load requests.');
        } finally {
            if (showLoader) setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        void refreshAllRequests(true);
    }, [refreshAllRequests]);

    useEffect(() => {
        if (!socket) return;
        const handleNewNotification = (notification) => {
            if (['request', 'approval', 'info'].includes(notification?.type)) {
                void refreshAllRequests(false);
            }
        };
        socket.on('new_notification', handleNewNotification);
        return () => socket.off('new_notification', handleNewNotification);
    }, [socket, refreshAllRequests]);

    const handleMessage = async (request) => {
        try {
            if (request?.conversationId) {
                navigate(`/chat?conversationId=${request.conversationId}`);
                return;
            }
            const targetUserId = activeTab === 'received' ? request?.requester?._id : request?.recipient?._id;
            const res = await api.post(`/chat/init/${targetUserId}`, { postId: request?.post?._id });
            if (!res.data?._id) throw new Error('Conversation was not created');
            navigate(`/chat?conversationId=${res.data._id}`);
        } catch (err) {
            showError(err.response?.data?.msg || 'Failed to start chat');
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
            setReceivedRequests((prev) =>
                prev.map((req) => (req._id === requestId ? { ...req, ...data } : req))
            );
            success(status === 'accepted' ? 'Request accepted.' : 'Request rejected.');
        } catch (err) {
            showError(err.response?.data?.msg || 'Action failed');
        } finally {
            setActionLoading(null);
        }
    };

    const handleComplete = async (requestId) => {
        setActionLoading(requestId);
        try {
            const { data } = await api.put(`/contacts/${requestId}/status`, { status: 'completed' });
            if (data?.removed) {
                setReceivedRequests((prev) => prev.filter((req) => req._id !== requestId));
                setSentRequests((prev) => prev.filter((req) => req.post?._id !== data.postId));
                success('Work completed. Post closed and chat removed.');
            } else {
                setReceivedRequests((prev) =>
                    prev.map((req) => (req._id === requestId ? { ...req, ...data } : req))
                );
                success('Marked as completed.');
            }
        } catch (err) {
            showError(err.response?.data?.msg || 'Failed to complete request');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancelRequest = async (requestId) => {
        setActionLoading(requestId);
        try {
            const { data } = await api.put(`/contacts/${requestId}/status`, { status: 'canceled' });
            setSentRequests((prev) =>
                prev.map((req) => (req._id === requestId ? { ...req, ...data } : req))
            );
            success('Request canceled.');
        } catch (err) {
            showError(err.response?.data?.msg || 'Failed to cancel request');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (requestId) => {
        try {
            await api.delete(`/contacts/${requestId}`);
            setReceivedRequests((prev) => prev.filter((req) => req._id !== requestId));
            setSentRequests((prev) => prev.filter((req) => req._id !== requestId));
            success('Request removed.');
        } catch {
            showError('Could not remove request.');
        }
    };

    const requests = activeTab === 'received' ? receivedRequests : sentRequests;
    const pendingCount = receivedRequests.filter((r) => r.status === 'pending').length;
    const sentPendingCount = sentRequests.filter((r) => r.status === 'pending').length;

    return (
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
            <header className="mb-5 flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">Requests</h1>
                    <p className="mt-1 text-sm text-foreground-muted">
                        {pendingCount > 0 ? `${pendingCount} pending` : 'No pending requests'}
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refreshAllRequests(true)} aria-label="Refresh requests">
                    <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                </Button>
            </header>

            <div className="mb-5 flex gap-1 rounded-xl border border-card-border bg-background-secondary p-1">
                {[
                    { id: 'received', label: 'Received', count: pendingCount, icon: User },
                    { id: 'sent', label: 'Sent', count: sentPendingCount, icon: Send },
                ].map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                active
                                    ? 'bg-card text-foreground shadow-sm'
                                    : 'text-foreground-muted hover:text-foreground'
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                            {tab.count > 0 && (
                                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <RefreshCw className="h-6 w-6 animate-spin text-foreground-muted" />
                </div>
            ) : requests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-card-border px-6 py-16 text-center">
                    <Package className="mx-auto mb-3 h-8 w-8 text-foreground-muted/50" />
                    <p className="text-sm font-medium text-foreground">
                        {activeTab === 'received' ? 'No requests received' : 'No requests sent'}
                    </p>
                    <p className="mt-1 text-sm text-foreground-muted">
                        {activeTab === 'received'
                            ? 'Requests from other users will appear here.'
                            : 'Requests you send will appear here.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {requests.map((req) => {
                        const otherUser = activeTab === 'received' ? req.requester : req.recipient;
                        const isPending = req.status === 'pending';
                        const isAccepted = req.status === 'accepted';

                        return (
                            <article
                                key={req._id}
                                className="overflow-hidden rounded-2xl border border-card-border bg-card"
                            >
                                {req.post && (
                                    <Link
                                        to={`/post/${req.post._id}`}
                                        className="flex items-center gap-3 border-b border-card-border px-4 py-3 transition-colors hover:bg-card-hover"
                                    >
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background-tertiary">
                                            {req.post.images?.[0] ? (
                                                <img src={req.post.images[0]} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <Package className="h-4 w-4 text-foreground-muted" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-foreground">{req.post.title}</p>
                                            <div className="mt-0.5 flex items-center gap-2 text-xs text-foreground-muted">
                                                {Number(req.post.price) > 0 && (
                                                    <span className="font-medium text-foreground">
                                                        {currencySymbol}
                                                        {Number(req.post.price).toLocaleString()}
                                                    </span>
                                                )}
                                                {req.post.location && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {req.post.location.split(',')[0]}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <ArrowRight className="h-4 w-4 shrink-0 text-foreground-muted" />
                                    </Link>
                                )}

                                <div className="flex items-start gap-3 p-4">
                                    <Link to={`/profile?userId=${otherUser?._id}`} className="shrink-0">
                                        <img
                                            src={getAvatarUrl(otherUser)}
                                            alt={otherUser?.displayName || 'User'}
                                            className="h-10 w-10 rounded-full object-cover"
                                        />
                                    </Link>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Link
                                                to={`/profile?userId=${otherUser?._id}`}
                                                className="text-sm font-semibold text-foreground hover:text-primary"
                                            >
                                                {otherUser?.displayName || 'User'}
                                            </Link>
                                            {otherUser?.isVerified && <CheckCircle className="h-3.5 w-3.5 text-primary" />}
                                        </div>

                                        {req.message && (
                                            <p className="mt-1 line-clamp-2 rounded-lg bg-background-secondary p-2 text-sm text-foreground-secondary">
                                                {req.message}
                                            </p>
                                        )}

                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
                                            <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                                            {req.post?.type && (
                                                <span className="rounded-full bg-primary/10 px-2 py-0.5 capitalize text-primary">
                                                    {req.post.type}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <StatusBadge status={req.status} />
                                </div>

                                <div className="flex flex-wrap gap-2 px-4 pb-4">
                                    {activeTab === 'received' && isPending && (
                                        <>
                                            <Button
                                                size="sm"
                                                onClick={() => handleAction(req._id, 'accepted')}
                                                disabled={actionLoading === req._id}
                                            >
                                                {actionLoading === req._id ? (
                                                    <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <Check className="mr-1.5 h-3.5 w-3.5" />
                                                )}
                                                Accept
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleAction(req._id, 'rejected')}
                                                disabled={actionLoading === req._id}
                                                className="text-error hover:bg-error/10 hover:text-error"
                                            >
                                                <X className="mr-1.5 h-3.5 w-3.5" />
                                                Reject
                                            </Button>
                                        </>
                                    )}

                                    {activeTab === 'sent' && isPending && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleCancelRequest(req._id)}
                                            disabled={actionLoading === req._id}
                                            className="text-error hover:bg-error/10 hover:text-error"
                                        >
                                            {actionLoading === req._id ? (
                                                <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <X className="mr-1.5 h-3.5 w-3.5" />
                                            )}
                                            Cancel
                                        </Button>
                                    )}

                                    {isAccepted && (
                                        <Button variant="outline" size="sm" onClick={() => handleMessage(req)}>
                                            <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                                            Message
                                        </Button>
                                    )}

                                    {(otherUser?.contactPhone || otherUser?.contactWhatsapp) && isAccepted && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleCall(otherUser.contactPhone || otherUser.contactWhatsapp)}
                                            >
                                                <Phone className="mr-1.5 h-3.5 w-3.5" />
                                                Call
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleStartText(otherUser.contactWhatsapp || otherUser.contactPhone)}
                                            >
                                                <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                                                Text
                                            </Button>
                                        </>
                                    )}

                                    {isAccepted && activeTab === 'received' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleComplete(req._id)}
                                            disabled={actionLoading === req._id}
                                        >
                                            {actionLoading === req._id ? (
                                                <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                                            )}
                                            Mark complete
                                        </Button>
                                    )}

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(req._id)}
                                        className="ml-auto text-foreground-muted hover:bg-error/10 hover:text-error"
                                        aria-label="Delete request"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Requests;
