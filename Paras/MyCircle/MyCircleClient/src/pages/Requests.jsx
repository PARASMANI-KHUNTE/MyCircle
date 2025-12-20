import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import Button from '../components/ui/Button';
import { Check, X, Clock, Phone, MessageCircle } from 'lucide-react';

const Requests = () => {
    const [activeTab, setActiveTab] = useState('received'); // 'received' or 'sent'
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, [activeTab]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const endpoint = activeTab === 'received' ? '/contact/received' : '/contact/sent';
            const res = await api.get(endpoint);
            if (activeTab === 'received') setReceivedRequests(res.data);
            else setSentRequests(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (requestId, status) => {
        try {
            await api.put(`/contact/${requestId}/status`, { status });
            // Optimistic update
            setReceivedRequests(prev => prev.map(req =>
                req._id === requestId ? { ...req, status } : req
            ));
        } catch (err) {
            console.error(err);
            alert("Action failed");
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">Manage Requests</h1>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-white/10 pb-4">
                <button
                    onClick={() => setActiveTab('received')}
                    className={`text-lg font-medium transition-colors ${activeTab === 'received' ? 'text-primary' : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Received Requests
                </button>
                <button
                    onClick={() => setActiveTab('sent')}
                    className={`text-lg font-medium transition-colors ${activeTab === 'sent' ? 'text-primary' : 'text-gray-400 hover:text-white'
                        }`}
                >
                    My Applications
                </button>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-4">
                {loading ? (
                    <div className="text-white">Loading...</div>
                ) : activeTab === 'received' ? (
                    receivedRequests.length === 0 ? <p className="text-gray-400">No requests received.</p> :
                        receivedRequests.map((req) => (
                            <motion.div
                                key={req._id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="glass p-6 rounded-2xl flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <img
                                        src={req.requester?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.requester?.displayName}`}
                                        className="w-12 h-12 rounded-full bg-secondary"
                                    />
                                    <div>
                                        <h3 className="font-semibold text-white">{req.requester?.displayName || 'User'}</h3>
                                        <p className="text-sm text-gray-400">wants to contact for: <span className="text-primary">{req.post?.title}</span></p>
                                        {req.message && <p className="text-xs text-gray-500 mt-1">"{req.message}"</p>}
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    {req.status === 'pending' ? (
                                        <>
                                            <Button variant="primary" onClick={() => handleAction(req._id, 'approved')}>
                                                <Check className="w-4 h-4" /> Approve
                                            </Button>
                                            <Button variant="outline" className="text-red-400 hover:bg-red-500/10 hover:text-red-400" onClick={() => handleAction(req._id, 'rejected')}>
                                                <X className="w-4 h-4" /> Reject
                                            </Button>
                                        </>
                                    ) : (
                                        <span className={`px-3 py-1 rounded-full text-xs border ${req.status === 'approved'
                                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>
                                            {req.status.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        ))
                ) : (
                    sentRequests.length === 0 ? <p className="text-gray-400">No requests sent.</p> :
                        sentRequests.map((req) => (
                            <motion.div
                                key={req._id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="glass p-6 rounded-2xl flex flex-col gap-4"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-white">{req.post?.title || 'Unknown Post'}</h3>
                                        <p className="text-sm text-gray-400">Owner: {req.recipient?.displayName}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs border ${req.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                        req.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                            'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                        }`}>
                                        {req.status.toUpperCase()}
                                    </span>
                                </div>

                                {/* Contact Reveal */}
                                {req.status === 'approved' && req.post && (
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col md:flex-row gap-6 mt-2">
                                        {req.post.contactPhone && (
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                                    <Phone className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400">Phone</p>
                                                    <p className="font-mono text-white select-all">{req.post.contactPhone}</p>
                                                </div>
                                            </div>
                                        )}
                                        {req.post.contactWhatsapp && (
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                                    <MessageCircle className="w-5 h-5 text-green-500" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400">WhatsApp</p>
                                                    <a href={`https://wa.me/${req.post.contactWhatsapp}`} target="_blank" rel="noreferrer" className="font-mono text-green-400 hover:underline">
                                                        {req.post.contactWhatsapp}
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                        {!req.post.contactPhone && !req.post.contactWhatsapp && (
                                            <p className="text-sm text-gray-400 italic">No specific contact info provided by owner.</p>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        ))
                )}
            </div>
        </div>
    );
};

export default Requests;
