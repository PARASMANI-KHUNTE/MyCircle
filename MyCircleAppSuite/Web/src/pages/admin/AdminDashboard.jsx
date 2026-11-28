import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import Button from '../../components/ui/Button';
import { useDialog } from '../../hooks/useDialog';
import { useSocket } from '../../context/SocketContext';
import { getOverviewCards } from '../../utils/adminOverview';

const REFRESH_INTERVAL_MS = 30000;

const linkStyle = {
    padding: '1rem 1.25rem',
    borderRadius: 12,
    background: 'rgba(139,92,246,0.15)',
    border: '1px solid rgba(139,92,246,0.4)',
    color: '#c4b5fd',
    textDecoration: 'none',
    fontWeight: 600,
};

const cardStyle = {
    padding: '1rem 1.25rem',
    borderRadius: 12,
    border: '1px solid #334155',
    background: 'rgba(15,23,42,0.6)',
    textDecoration: 'none',
};

export default function AdminDashboard() {
    const { showAlert } = useDialog();
    const { socket } = useSocket();
    const [overview, setOverview] = useState(null);
    const [queues, setQueues] = useState({ hidden: 0, removed: 0 });
    const [loading, setLoading] = useState(true);
    const [updatedAt, setUpdatedAt] = useState(null);

    const load = useCallback(async ({ silent = false } = {}) => {
        if (!silent) setLoading(true);
        try {
            const [overviewRes, hiddenRes, removedRes] = await Promise.all([
                api.get('/admin/overview'),
                api.get('/admin/posts', { params: { moderationStatus: 'hidden', limit: 1 } }),
                api.get('/admin/posts', { params: { moderationStatus: 'removed', limit: 1 } }),
            ]);
            setOverview(overviewRes.data || {});
            setQueues({
                hidden: hiddenRes.data?.total || 0,
                removed: removedRes.data?.total || 0,
            });
            setUpdatedAt(new Date());
        } catch (e) {
            showAlert(e?.response?.data?.msg || 'Failed to load overview', 'Error');
            setOverview({});
        } finally {
            if (!silent) setLoading(false);
        }
    }, [showAlert]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        const interval = setInterval(() => load({ silent: true }), REFRESH_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [load]);

    useEffect(() => {
        if (!socket) return undefined;
        const refresh = () => load({ silent: true });
        socket.on('post_moderation_update', refresh);
        return () => socket.off('post_moderation_update', refresh);
    }, [socket, load]);

    const cards = getOverviewCards(overview || {});

    return (
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary, #e2e8f0)', margin: 0 }}>Admin</h1>
                <Button type="button" variant="secondary" onClick={() => load()} loading={loading}>Refresh</Button>
            </div>
            <p style={{ color: 'var(--text-secondary, #94a3b8)', marginBottom: '1.5rem' }}>
                Platform management (web).{updatedAt ? ` Updated ${updatedAt.toLocaleTimeString()}.` : ''}
            </p>

            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.75rem' }}>Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.75rem' }}>
                {cards.map((card) => (
                    <div key={card.key} style={cardStyle}>
                        <div style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</div>
                        <div style={{ color: '#e2e8f0', fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem' }}>{loading ? '—' : card.value}</div>
                    </div>
                ))}
            </div>

            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.75rem' }}>Moderation queues</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.75rem' }}>
                <Link to="/admin/posts?moderationStatus=hidden" style={cardStyle}>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hidden posts</div>
                    <div style={{ color: '#e2e8f0', fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem' }}>{queues.hidden}</div>
                </Link>
                <Link to="/admin/posts?moderationStatus=removed" style={cardStyle}>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Removed posts</div>
                    <div style={{ color: '#e2e8f0', fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem' }}>{queues.removed}</div>
                </Link>
            </div>

            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.75rem' }}>Manage</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                <Link to="/admin/posts" style={linkStyle}>Post moderation</Link>
                <Link to="/admin/users" style={linkStyle}>Users</Link>
                <Link to="/admin/reports" style={linkStyle}>Reports</Link>
                <Link to="/admin/submissions" style={linkStyle}>Support queue</Link>
            </div>
        </div>
    );
}
