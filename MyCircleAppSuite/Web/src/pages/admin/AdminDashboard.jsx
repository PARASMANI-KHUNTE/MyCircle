import React from 'react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
    return (
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem 1rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary, #e2e8f0)', marginBottom: '0.5rem' }}>Admin</h1>
            <p style={{ color: 'var(--text-secondary, #94a3b8)', marginBottom: '1.5rem' }}>Platform management (web).</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                <Link to="/admin/users" style={{ padding: '1rem 1.25rem', borderRadius: 12, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', color: '#c4b5fd', textDecoration: 'none', fontWeight: 600 }}>
                    Users
                </Link>
                <Link to="/admin/reports" style={{ padding: '1rem 1.25rem', borderRadius: 12, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', color: '#c4b5fd', textDecoration: 'none', fontWeight: 600 }}>
                    Reports
                </Link>
                <Link to="/admin/submissions" style={{ padding: '1rem 1.25rem', borderRadius: 12, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', color: '#c4b5fd', textDecoration: 'none', fontWeight: 600 }}>
                    Support queue
                </Link>
            </div>
        </div>
    );
}
