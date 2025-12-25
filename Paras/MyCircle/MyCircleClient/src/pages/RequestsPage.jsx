import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Bell, CheckCircle, MessageCircle, X,
    Trash2, Heart, MessageSquare
} from 'lucide-react';
import api from '../utils/api';
import { useToast } from '../components/ui/Toast';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { getAvatarUrl } from '../utils/avatar';
import { useNavigate } from 'react-router-dom';

const RequestsPage = () => {
    const { user } = useAuth();
    const { notifications, markAsRead, markAllRead, refresh, handleNotificationClick } = useNotifications();
    const { success, error: showError } = useToast();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('notifications');
    const [requestsTab, setRequestsTab] = useState('received');
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch data based on active tab
    useEffect(() => {
        if (user) {
            if (activeTab === 'requests') fetchRequests();
            if (activeTab === 'comments') fetchComments();
        }
    }, [activeTab, requestsTab, user]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const endpoint = requestsTab === 'received' ? '/contacts/received' : '/contacts/sent';
            const res = await api.get(endpoint);
            if (requestsTab === 'received') setReceivedRequests(res.data);
            else setSentRequests(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        setLoading(true);
        try {
            // Fetch user's posts and extract comments
            const res = await api.get('/posts/my-posts');
            const allComments = [];
            res.data.forEach(post => {
                if (post.comments && post.comments.length > 0) {
                    post.comments.forEach(comment => {
                        // Only show comments from others, not own comments
                        if (comment.user?._id !== user._id && comment.user?.id !== user.id) {
                            allComments.push({
                                ...comment,
                                postTitle: post.title,
                                postId: post._id
                            });
                        }
                    });
                }
            });
            // Sort by date, newest first
            allComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setComments(allComments);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestAction = async (requestId, status) => {
        try {
            await api.put(`/contacts/${requestId}/status`, { status });
            setReceivedRequests(prev => prev.map(req =>
                req._id === requestId ? { ...req, status } : req
            ));
            success(`Request ${status} successfully`);
        } catch (err) {
            console.error(err);
            showError("Action failed. Please try again.");
        }
    };

    const handleDeleteRequest = async (requestId) => {
        try {
            await api.delete(`/contacts/${requestId}`);
            if (requestsTab === 'received') {
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

    const handleDeleteNotification = async (id) => {
        try {
            await api.delete(`/notifications/${id}`);
            refresh();
        } catch (err) {
            showError('Failed to delete');
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'request': return <MessageCircle className="w-5 h-5 text-blue-500" />;
            case 'approval': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'like': return <Heart className="w-5 h-5 text-pink-500" />;
            case 'comment': return <MessageSquare className="w-5 h-5 text-indigo-500" />;
            default: return <Bell className="w-5 h-5 text-slate-400" />;
        }
    };

    const getStatusBadge = (status, recipientId) => {
        if (status === 'approved') {
            return (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/dashboard?tab=chats&recipientId=${recipientId}`);
                    }}
                    className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 transition-colors flex items-center gap-1"
                >
                    <MessageCircle size={14} />
                    Chat
                </button>
            );
        }

        const styles = {
            pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            rejected: 'bg-red-100 text-red-700 border-red-200',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
                {status}
            </span>
        );
    };

    const currentRequests = requestsTab === 'received' ? receivedRequests : sentRequests;

    // Filter out comment and request notifications from the main notifications list
    // Comments show in Comments tab, Requests show in Requests tab
    const filteredNotifications = notifications.filter(n => n.type !== 'comment' && n.type !== 'request' && n.type !== 'contact_request');
    const unreadNotifications = filteredNotifications.filter(n => !n.read).length;

    // Get comment notifications only
    const commentNotifications = notifications.filter(n => n.type === 'comment');
    const unreadComments = commentNotifications.filter(n => !n.read).length;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Activity</h1>
                    <p className="text-slate-500 text-sm mt-1">Your notifications, requests, and comments</p>
                </div>
                {activeTab === 'notifications' && unreadNotifications > 0 && (
                    <button
                        onClick={markAllRead}
                        className="text-sm text-slate-600 hover:text-slate-900 font-medium"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Main Tabs */}
            <div className="inline-flex items-center bg-slate-100 rounded-lg p-1 gap-1">
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`px-5 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 ${activeTab === 'notifications'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                >
                    Notifications
                    {unreadNotifications > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                            {unreadNotifications}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-5 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 ${activeTab === 'requests'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                >
                    Requests
                </button>
                <button
                    onClick={() => setActiveTab('comments')}
                    className={`px-5 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 ${activeTab === 'comments'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                >
                    Comments
                    {unreadComments > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-indigo-500 text-white text-xs rounded-full">
                            {unreadComments}
                        </span>
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                {activeTab === 'notifications' && (
                    /* Notifications Tab */
                    <div className="divide-y divide-slate-100">
                        {filteredNotifications.length === 0 ? (
                            <div className="p-12 text-center">
                                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">No notifications yet</p>
                            </div>
                        ) : (
                            filteredNotifications.map((n) => (
                                <motion.div
                                    key={n._id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50/30' : ''}`}
                                >
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 relative">
                                            <img
                                                src={getAvatarUrl(n.sender)}
                                                alt=""
                                                className="w-12 h-12 rounded-full object-cover border border-slate-200"
                                            />
                                            <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full border border-slate-200">
                                                {getNotificationIcon(n.type)}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <h3 className={`font-semibold text-sm ${!n.read ? 'text-slate-900' : 'text-slate-600'}`}>
                                                    {n.title}
                                                </h3>
                                                <span className="text-xs text-slate-500 whitespace-nowrap">
                                                    {new Date(n.createdAt).toLocaleString(undefined, {
                                                        dateStyle: 'short',
                                                        timeStyle: 'short'
                                                    })}
                                                </span>
                                            </div>
                                            <p className="text-slate-600 text-sm mt-1">{n.message}</p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteNotification(n._id);
                                            }}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'requests' && (
                    /* Requests Tab */
                    <div>
                        {/* Sub-tabs for Requests */}
                        <div className="border-b border-slate-200 px-6 pt-4">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setRequestsTab('received')}
                                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${requestsTab === 'received'
                                        ? 'border-slate-900 text-slate-900'
                                        : 'border-transparent text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    Received
                                </button>
                                <button
                                    onClick={() => setRequestsTab('sent')}
                                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${requestsTab === 'sent'
                                        ? 'border-slate-900 text-slate-900'
                                        : 'border-transparent text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    Sent
                                </button>
                            </div>
                        </div>

                        {/* Requests List */}
                        <div className="divide-y divide-slate-100">
                            {loading ? (
                                <div className="p-12 text-center text-slate-500">Loading...</div>
                            ) : currentRequests.length === 0 ? (
                                <div className="p-12 text-center">
                                    <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500">No {requestsTab} requests</p>
                                </div>
                            ) : (
                                currentRequests.map((req) => (
                                    <div key={req._id} className="p-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <img
                                                src={getAvatarUrl(requestsTab === 'received' ? req.requester : req.post?.author)}
                                                alt=""
                                                className="w-12 h-12 rounded-full object-cover border border-slate-200"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h3 className="font-semibold text-slate-900 text-sm">
                                                            {requestsTab === 'received'
                                                                ? req.requester?.displayName
                                                                : req.post?.title}
                                                        </h3>
                                                        <p className="text-slate-600 text-sm mt-1">
                                                            {requestsTab === 'received'
                                                                ? `Interested in: ${req.post?.title}`
                                                                : `To: ${req.post?.author?.displayName}`}
                                                        </p>
                                                    </div>
                                                    {getStatusBadge(req.status, requestsTab === 'received' ? req.requester?._id : req.post?.author?._id)}
                                                </div>

                                                {requestsTab === 'received' && req.status === 'pending' && (
                                                    <div className="flex gap-2 mt-3">
                                                        <button
                                                            onClick={() => handleRequestAction(req._id, 'approved')}
                                                            className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                                                        >
                                                            <CheckCircle size={16} className="inline mr-1" />
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleRequestAction(req._id, 'rejected')}
                                                            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                                                        >
                                                            <X size={16} className="inline mr-1" />
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleDeleteRequest(req._id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'comments' && (
                    /* Comments Tab */
                    <div className="divide-y divide-slate-100">
                        {commentNotifications.length === 0 ? (
                            <div className="p-12 text-center">
                                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">No comments on your posts yet</p>
                            </div>
                        ) : (
                            commentNotifications.map((n) => (
                                <motion.div
                                    key={n._id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    onClick={() => {
                                        if (!n.read) markAsRead(n._id);
                                        if (n.relatedId) navigate(`/post/${n.relatedId}`);
                                    }}
                                    className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${!n.read ? 'bg-indigo-50/30' : ''}`}
                                >
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 relative">
                                            <img
                                                src={getAvatarUrl(n.sender)}
                                                alt=""
                                                className="w-12 h-12 rounded-full object-cover border border-slate-200"
                                            />
                                            <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full border border-slate-200">
                                                <MessageSquare className="w-4 h-4 text-indigo-500" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <div>
                                                    <h3 className={`font-semibold text-sm ${!n.read ? 'text-slate-900' : 'text-slate-600'}`}>
                                                        {n.title}
                                                    </h3>
                                                </div>
                                                <span className="text-xs text-slate-500 whitespace-nowrap">
                                                    {new Date(n.createdAt).toLocaleString(undefined, {
                                                        dateStyle: 'short',
                                                        timeStyle: 'short'
                                                    })}
                                                </span>
                                            </div>
                                            <p className="text-slate-600 text-sm mt-1">{n.message}</p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteNotification(n._id);
                                            }}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RequestsPage;
