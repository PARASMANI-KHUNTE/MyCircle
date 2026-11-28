import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import Button from '../../components/ui/Button';
import { useDialog } from '../../hooks/useDialog';
import { getOverviewCards } from '../../utils/adminOverview';

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
};

export default function AdminDashboard() {
    const { showAlert } = useDialog();
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/overview');
            setOverview(res.data || {});
        } catch (e) {
            showAlert(e?.response?.data?.msg || 'Failed to load overview', 'Error');
            setOverview({});
        } finally {
            setLoading(false);
        }
    }, [showAlert]);

    useEffect(() => {
        load();
    }, [load]);

    const cards = getOverviewCards(overview || {});

    return (
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary, #e2e8f0)', margin: 0 }}>Admin</h1>
                <Button type="button" variant="secondary" onClick={load} loading={loading}>Refresh</Button>
            </div>
            <p style={{ color: 'var(--text-secondary, #94a3b8)', marginBottom: '1.5rem' }}>Platform management (web).</p>

            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.75rem' }}>Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.75rem' }}>
                {cards.map((card) => (
                    <div key={card.key} style={cardStyle}>
                        <div style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</div>
                        <div style={{ color: '#e2e8f0', fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem' }}>{loading ? '—' : card.value}</div>
                    </div>
                ))}
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
