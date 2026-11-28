import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import Button from '../../components/ui/Button';
import { useDialog } from '../../hooks/useDialog';
import { useToast } from '../../components/ui/Toast';

const MODERATION_STATUSES = ['visible', 'hidden', 'removed'];

const ACTIONS = [
    { status: 'visible', label: 'Restore', variant: 'success' },
    { status: 'hidden', label: 'Hide', variant: 'secondary' },
    { status: 'removed', label: 'Remove', variant: 'danger' },
];

export default function AdminPosts() {
    const { showAlert, showConfirm } = useDialog();
    const { success } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const statusParam = searchParams.get('moderationStatus');
    const [q, setQ] = useState('');
    const [moderationStatus, setModerationStatus] = useState(
        MODERATION_STATUSES.includes(statusParam) ? statusParam : ''
    );
    const [page, setPage] = useState(1);
    const [data, setData] = useState({ posts: [], total: 0, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (q.trim()) params.q = q.trim();
            if (moderationStatus) params.moderationStatus = moderationStatus;
            const res = await api.get('/admin/posts', { params });
            setData({
                posts: res.data.posts || [],
                total: res.data.total || 0,
                totalPages: res.data.totalPages || 1,
            });
        } catch (e) {
            showAlert(e?.response?.data?.msg || 'Failed to load posts', 'Error');
            setData((current) => ({ ...current, posts: [] }));
        } finally {
            setLoading(false);
        }
    }, [page, q, moderationStatus, showAlert]);

    useEffect(() => {
        load();
    }, [load]);

    const changeModeration = async (post, status) => {
        if (post.moderationStatus === status) return;

        const confirmed = await showConfirm(
            `${status === 'visible' ? 'Restore' : status === 'hidden' ? 'Hide' : 'Remove'} "${post.title || 'this post'}"?`,
            'Confirm moderation change'
        );
        if (!confirmed) return;

        setUpdating(post._id);
        try {
            await api.patch(`/admin/posts/${post._id}/moderation`, { moderationStatus: status });
            success(`Post marked ${status}`);
            await load();
        } catch (e) {
            showAlert(e?.response?.data?.msg || e?.response?.data?.errors?.[0]?.message || 'Failed to update moderation status', 'Error');
        } finally {
            setUpdating(null);
        }
    };

    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary, #e2e8f0)', marginBottom: '1rem' }}>Post moderation</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                <input
                    value={q}
                    onChange={(e) => { setQ(e.target.value); setPage(1); }}
                    placeholder="Search title or description"
                    style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', minWidth: 220 }}
                />
                <select
                    value={moderationStatus}
                    onChange={(e) => {
                        const value = e.target.value;
                        setModerationStatus(value);
                        setPage(1);
                        setSearchParams(value ? { moderationStatus: value } : {});
                    }}
                    style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0' }}
                >
                    <option value="">All statuses</option>
                    {MODERATION_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <Button type="button" onClick={() => load()}>Refresh</Button>
            </div>

            {loading ? (
                <p style={{ color: '#94a3b8' }}>Loading…</p>
            ) : (
                <>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e2e8f0', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #334155' }}>
                                    <th style={{ padding: '0.5rem' }}>Title</th>
                                    <th style={{ padding: '0.5rem' }}>Author</th>
                                    <th style={{ padding: '0.5rem' }}>Status</th>
                                    <th style={{ padding: '0.5rem' }}>Created</th>
                                    <th style={{ padding: '0.5rem' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.posts.map((post) => (
                                    <tr key={post._id} style={{ borderBottom: '1px solid #1e293b' }}>
                                        <td style={{ padding: '0.5rem', maxWidth: 320 }}>
                                            {post.title || '—'}
                                            <br />
                                            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                                                {(post.description || '').slice(0, 120)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.5rem' }}>
                                            {post.user?.displayName || '—'}
                                            <br />
                                            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{post.user?.email || ''}</span>
                                        </td>
                                        <td style={{ padding: '0.5rem' }}>{post.moderationStatus || 'visible'}</td>
                                        <td style={{ padding: '0.5rem' }}>
                                            {post.createdAt ? new Date(post.createdAt).toLocaleString() : '—'}
                                        </td>
                                        <td style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>
                                            {ACTIONS.map(({ status, label, variant }) => (
                                                <Button
                                                    key={status}
                                                    type="button"
                                                    variant={variant}
                                                    disabled={post.moderationStatus === status || updating === post._id}
                                                    onClick={() => changeModeration(post, status)}
                                                    style={{ marginRight: '0.4rem', marginBottom: '0.25rem' }}
                                                >
                                                    {label}
                                                </Button>
                                            ))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {data.posts.length === 0 && <p style={{ color: '#94a3b8', marginTop: '1rem' }}>No posts found.</p>}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
                        <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                        <span style={{ color: '#94a3b8' }}>Page {page} of {data.totalPages} · {data.total} posts</span>
                        <Button type="button" variant="secondary" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                    </div>
                </>
            )}
        </div>
    );
}
