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
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-zinc-900" />
                            New Message
                        </h3>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="p-4 bg-slate-50/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search connections..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Connections List */}
                    <div className="max-h-[400px] overflow-y-auto p-2 scroll-smooth">
                        {loading ? (
                            <div className="p-8 text-center text-slate-400">Loading connections...</div>
                        ) : filteredConnections.length > 0 ? (
                            <div className="grid gap-1">
                                {filteredConnections.map(user => (
                                    <button
                                        key={user._id}
                                        onClick={() => onSelectUser(user)}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all group text-left w-full border border-transparent hover:border-slate-100"
                                    >
                                        <div className="relative">
                                            <div className="w-11 h-11 rounded-full overflow-hidden border border-slate-200 group-hover:border-slate-300 transition-colors bg-slate-100">
                                                <img
                                                    src={getAvatarUrl(user)}
                                                    alt={user.displayName}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-slate-900 truncate">{user.displayName}</h4>
                                            <p className="text-xs text-slate-500 truncate">Connected via Request</p>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="primary" size="sm" className="h-8 px-3 text-xs bg-zinc-900 text-white hover:bg-black">
                                                Chat
                                            </Button>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <UserIcon className="w-8 h-8 text-slate-300" />
                                </div>
                                <p className="text-slate-900 font-bold mb-1">No connections found</p>
                                <p className="text-xs text-slate-500 max-w-[200px] mx-auto leading-relaxed">
                                    You can only chat with users who have accepted your contact requests.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <Button variant="outline" size="sm" onClick={onClose} className="bg-white border-slate-200 hover:bg-slate-50 text-slate-600">
                            Cancel
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default NewMessageModal;
