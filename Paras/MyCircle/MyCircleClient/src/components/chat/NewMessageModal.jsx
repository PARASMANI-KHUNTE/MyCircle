import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, User as UserIcon, MessageSquare } from 'lucide-react';
import api from '../../utils/api';
import { getAvatarUrl } from '../../utils/avatar';
import Button from '../ui/Button';

const NewMessageModal = ({ isOpen, onClose, onSelectUser }) => {
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchConnections();
        }
    }, [isOpen]);

    const fetchConnections = async () => {
        try {
            setLoading(true);
            const res = await api.get('/user/connections');
            setConnections(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch connections:', err);
            setLoading(false);
        }
    };

    const filteredConnections = connections.filter(user =>
        user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md glass border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            New Message
                        </h3>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="p-4 bg-white/5">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search connections..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-secondary/50 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Connections List */}
                    <div className="max-h-[400px] overflow-y-auto p-2">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">Loading connections...</div>
                        ) : filteredConnections.length > 0 ? (
                            <div className="grid gap-1">
                                {filteredConnections.map(user => (
                                    <button
                                        key={user._id}
                                        onClick={() => onSelectUser(user)}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group text-left w-full"
                                    >
                                        <div className="relative">
                                            <div className="w-11 h-11 rounded-full overflow-hidden border border-white/10 group-hover:border-primary/50 transition-colors">
                                                <img
                                                    src={getAvatarUrl(user)}
                                                    alt={user.displayName}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-semibold text-white truncate">{user.displayName}</h4>
                                            <p className="text-xs text-gray-500 truncate">Connected via Request</p>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="primary" size="sm" className="h-8 px-3">
                                                Chat
                                            </Button>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center">
                                <UserIcon className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                                <p className="text-gray-400 font-medium">No connections found</p>
                                <p className="text-xs text-gray-600 mt-1 px-4">You can only chat with users who have accepted your contact requests.</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-white/5 border-t border-white/5 flex justify-end">
                        <Button variant="outline" size="sm" onClick={onClose}>
                            Cancel
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default NewMessageModal;
