import React, { useCallback, useEffect, useState } from 'react';
import api from '../../utils/api';
import Button from '../../components/ui/Button';
import { useDialog } from '../../hooks/useDialog';

const ROLES = ['user', 'admin', 'moderator'];

export default function AdminUsers() {
    const { showConfirm, showAlert } = useDialog();
    const [q, setQ] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [page, setPage] = useState(1);
    const [data, setData] = useState({ users: [], total: 0, totalPages: 1 });
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (q.trim()) params.q = q.trim();
            if (roleFilter) params.role = roleFilter;
            const res = await api.get('/admin/users', { params });
            setData({ users: res.data.users || [], total: res.data.total || 0, totalPages: res.data.totalPages || 1 });
        } catch (e) {
            showAlert(e?.response?.data?.msg || 'Failed to load users', 'Error');
            setData((d) => ({ ...d, users: [] }));
        } finally {
            setLoading(false);
        }
    }, [page, q, roleFilter, showAlert]);

    useEffect(() => {
        load();
    }, [load]);

    const changeRole = async (user) => {
        const next = prompt(`Set role for ${user.displayName || user.email} (user, admin, moderator):`, user.role || 'user');
        if (next == null) return;
        const trimmed = String(next).trim().toLowerCase();
        if (!ROLES.includes(trimmed)) {
            showAlert('Invalid role. Use user, admin, or moderator.', 'Error');
            return;
        }
        const ok = await showConfirm(`Change role to "${trimmed}" for ${user.email || user.displayName}?`, 'Confirm role change');
        if (!ok) return;
        try {
            await api.patch(`/admin/users/${user._id}/role`, { role: trimmed });
            await load();
        } catch (e) {
            showAlert(e?.response?.data?.msg || e?.response?.data?.errors?.[0]?.message || 'Failed to update role', 'Error');
        }
    };

    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary, #e2e8f0)', marginBottom: '1rem' }}>Users</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                <input
                    value={q}
                    onChange={(e) => { setQ(e.target.value); setPage(1); }}
                    placeholder="Search name or email"
                    style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', minWidth: 200 }}
                />
                <select
                    value={roleFilter}
                    onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                    style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0' }}
                >
                    <option value="">All roles</option>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
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
                                    <th style={{ padding: '0.5rem' }}>Name</th>
                                    <th style={{ padding: '0.5rem' }}>Email</th>
                                    <th style={{ padding: '0.5rem' }}>Role</th>
                                    <th style={{ padding: '0.5rem' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.users.map((u) => (
                                    <tr key={u._id} style={{ borderBottom: '1px solid #1e293b' }}>
                                        <td style={{ padding: '0.5rem' }}>{u.displayName || '—'}</td>
                                        <td style={{ padding: '0.5rem' }}>{u.email || '—'}</td>
                                        <td style={{ padding: '0.5rem' }}>{u.role}</td>
                                        <td style={{ padding: '0.5rem' }}>
                                            <Button type="button" variant="secondary" onClick={() => changeRole(u)}>Change role</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {data.users.length === 0 && <p style={{ color: '#94a3b8', marginTop: '1rem' }}>No users found.</p>}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
                        <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                        <span style={{ color: '#94a3b8' }}>Page {page} of {data.totalPages}</span>
                        <Button type="button" variant="secondary" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                    </div>
                </>
            )}
        </div>
    );
}
