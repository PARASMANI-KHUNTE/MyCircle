import React, { useCallback, useEffect, useState } from 'react';
import api from '../../utils/api';
import Button from '../../components/ui/Button';
import { useDialog } from '../../hooks/useDialog';

export default function AdminReports() {
    const { showAlert } = useDialog();
    const [page, setPage] = useState(1);
    const [data, setData] = useState({ reports: [], total: 0, totalPages: 1 });
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/reports', { params: { page, limit: 20 } });
            setData({ reports: res.data.reports || [], total: res.data.total || 0, totalPages: res.data.totalPages || 1 });
        } catch (e) {
            showAlert(e?.response?.data?.msg || 'Failed to load reports', 'Error');
            setData((d) => ({ ...d, reports: [] }));
        } finally {
            setLoading(false);
        }
    }, [page, showAlert]);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary, #e2e8f0)', marginBottom: '1rem' }}>Reports</h1>
            {loading ? (
                <p style={{ color: '#94a3b8' }}>Loading…</p>
            ) : (
                <>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e2e8f0', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #334155' }}>
                                    <th style={{ padding: '0.5rem' }}>Reported user</th>
                                    <th style={{ padding: '0.5rem' }}>Category</th>
                                    <th style={{ padding: '0.5rem' }}>Content</th>
                                    <th style={{ padding: '0.5rem' }}>Reason</th>
                                    <th style={{ padding: '0.5rem' }}>When</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.reports.map((row, idx) => (
                                    <tr key={`${row.reportedUserId}-${row.report?._id || idx}`} style={{ borderBottom: '1px solid #1e293b' }}>
                                        <td style={{ padding: '0.5rem' }}>{row.reportedUserName || '—'}<br /><span style={{ color: '#64748b', fontSize: '0.75rem' }}>{row.reportedUserEmail || ''}</span></td>
                                        <td style={{ padding: '0.5rem' }}>{row.report?.category || '—'}</td>
                                        <td style={{ padding: '0.5rem' }}>{row.report?.contentType || '—'}</td>
                                        <td style={{ padding: '0.5rem', maxWidth: 320, whiteSpace: 'pre-wrap' }}>{row.report?.reason || '—'}</td>
                                        <td style={{ padding: '0.5rem' }}>{row.report?.createdAt ? new Date(row.report.createdAt).toLocaleString() : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {data.reports.length === 0 && <p style={{ color: '#94a3b8', marginTop: '1rem' }}>No reports found.</p>}
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