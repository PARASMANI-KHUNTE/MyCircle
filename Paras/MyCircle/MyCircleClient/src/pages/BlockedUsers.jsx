import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Button from '../components/ui/Button';
import { useDialog } from '../hooks/useDialog';
import { UserX, ArrowLeft } from 'lucide-react';
import { getAvatarUrl } from '../utils/avatar';

const BlockedUsers = ({ onBack }) => {
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
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-red-50 text-red-500">
                    <UserX className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Blocked Users</h1>
                    <p className="text-slate-500 text-sm">Manage users you've blocked</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
                </div>
            ) : blockedUsers.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                    <UserX className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <h2 className="text-xl font-bold text-slate-900 mb-2">No Blocked Users</h2>
                    <p className="text-slate-500">
                        Users you block will appear here. You can unblock them anytime.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {blockedUsers.map(user => (
                        <div key={user._id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <img
                                    src={getAvatarUrl(user)}
                                    alt={user.displayName}
                                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                                />
                                <div>
                                    <h3 className="text-slate-900 font-semibold">{user.displayName}</h3>
                                    <p className="text-sm text-red-500">Blocked</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleUnblock(user._id, user.displayName)}
                                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                            >
                                Unblock
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BlockedUsers;

