import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Button from '../components/ui/Button';
import { useDialog } from '../hooks/useDialog';
import { UserX, ArrowLeft } from 'lucide-react';

const BlockedUsers = () => {
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const dialog = useDialog();

    useEffect(() => {
        fetchBlockedUsers();
    }, []);

    const fetchBlockedUsers = async () => {
        try {
            const res = await api.get('/user/blocked');
            setBlockedUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUnblock = async (userId, displayName) => {
        const confirmed = await dialog.confirm(
            `Unblock ${displayName}? They will be able to message you again.`,
            'Unblock User'
        );

        if (!confirmed) return;

        try {
            await api.post(`/user/unblock/${userId}`);
            setBlockedUsers(prev => prev.filter(u => u._id !== userId));
        } catch (err) {
            console.error(err);
            await dialog.alert('Failed to unblock user', 'Error');
        }
    };

    return (
        <div className="container mx-auto px-6 py-24 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <Link to="/settings" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Settings
                </Link>

                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 rounded-xl bg-red-500/10 text-red-500">
                        <UserX className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Blocked Users</h1>
                        <p className="text-gray-400">Manage users you've blocked</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : blockedUsers.length === 0 ? (
                    <div className="glass rounded-2xl p-12 text-center">
                        <UserX className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                        <h2 className="text-xl font-bold text-white mb-2">No Blocked Users</h2>
                        <p className="text-gray-400">
                            Users you block will appear here. You can unblock them anytime.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {blockedUsers.map(user => (
                            <div key={user._id} className="glass rounded-2xl p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName}`}
                                        alt={user.displayName}
                                        className="w-12 h-12 rounded-full"
                                    />
                                    <div>
                                        <h3 className="text-white font-semibold">{user.displayName}</h3>
                                        <p className="text-sm text-red-400">Blocked</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => handleUnblock(user._id, user.displayName)}
                                    className="border-primary/20 text-primary hover:bg-primary/10"
                                >
                                    Unblock
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlockedUsers;
