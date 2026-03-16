import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Button from '../components/ui/Button';
import { useDialog } from '../hooks/useDialog';
import { UserX, ArrowLeft } from 'lucide-react';
import { getAvatarUrl } from '../utils/avatar';

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
                <Link to="/settings" className="inline-flex items-center gap-2 text-text-muted hover:text-text-heading mb-6 transition-colors font-medium">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Settings
                </Link>

                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 rounded-xl bg-red-500/10 text-red-500">
                        <UserX className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-text-heading">Blocked Users</h1>
                        <p className="text-text-muted">Manage users you've blocked</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : blockedUsers.length === 0 ? (
                    <div className="glass-panel p-12 text-center shadow-card">
                        <UserX className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-20" />
                        <h2 className="text-xl font-bold text-text-heading mb-2">No Blocked Users</h2>
                        <p className="text-text-muted">
                            Users you block will appear here. You can unblock them anytime.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {blockedUsers.map(user => (
                            <div key={user._id} className="glass-panel p-6 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={getAvatarUrl(user)}
                                        alt={user.displayName}
                                        className="w-12 h-12 rounded-full object-cover border border-card-border"
                                    />
                                    <div>
                                        <h3 className="text-text-heading font-semibold">{user.displayName}</h3>
                                        <p className="text-sm text-red-500 font-medium">Blocked</p>
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
