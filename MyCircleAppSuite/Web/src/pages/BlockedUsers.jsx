import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserX, ArrowLeft } from 'lucide-react';
import api from '../utils/api';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import { useDialog } from '../hooks/useDialog';
import { getAvatarUrl } from '../utils/avatar';

const BlockedUsers = () => {
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const dialog = useDialog();

    useEffect(() => {
        let active = true;
        const fetchBlockedUsers = async () => {
            try {
                const res = await api.get('/user/blocked');
                if (active) setBlockedUsers(Array.isArray(res.data) ? res.data : []);
            } catch {
                if (active) setBlockedUsers([]);
            } finally {
                if (active) setLoading(false);
            }
        };
        void fetchBlockedUsers();
        return () => {
            active = false;
        };
    }, []);

    const handleUnblock = async (userId, displayName) => {
        const confirmed = await dialog.confirm(
            `Unblock ${displayName}? They will be able to message you again.`,
            'Unblock User'
        );
        if (!confirmed) return;

        try {
            await api.post(`/user/unblock/${userId}`);
            setBlockedUsers((prev) => prev.filter((u) => u._id !== userId));
        } catch {
            await dialog.alert('Failed to unblock user', 'Error');
        }
    };

    return (
        <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
            <Link
                to="/settings"
                className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to settings
            </Link>

            <header className="mb-5">
                <h1 className="text-xl font-semibold text-foreground">Blocked users</h1>
                <p className="mt-1 text-sm text-foreground-muted">
                    People you block cannot message or interact with you.
                </p>
            </header>

            {loading ? (
                <Loading text="Loading blocked users..." />
            ) : blockedUsers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-card-border px-6 py-16 text-center">
                    <UserX className="mx-auto mb-3 h-8 w-8 text-foreground-muted/50" />
                    <p className="text-sm font-medium text-foreground">No blocked users</p>
                    <p className="mt-1 text-sm text-foreground-muted">
                        Users you block will appear here. You can unblock them anytime.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {blockedUsers.map((user) => (
                        <div
                            key={user._id}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-card-border bg-card p-4"
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <img
                                    src={getAvatarUrl(user)}
                                    alt={user.displayName}
                                    className="h-10 w-10 rounded-full object-cover"
                                />
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-foreground">
                                        {user.displayName}
                                    </p>
                                    <p className="text-xs text-foreground-muted">Blocked</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnblock(user._id, user.displayName)}
                            >
                                Unblock
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BlockedUsers;
