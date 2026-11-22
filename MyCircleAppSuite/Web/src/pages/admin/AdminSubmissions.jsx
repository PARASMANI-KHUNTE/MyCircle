import React, { useCallback, useEffect, useState } from 'react';
import api from '../../utils/api';
import Button from '../../components/ui/Button';
import { useDialog } from '../../hooks/useDialog';
import { SUBMISSION_STATUSES } from '../../utils/support';

const inputStyle = {
    padding: '0.45rem 0.6rem',
    borderRadius: 8,
    border: '1px solid #334155',
    background: '#0f172a',
    color: '#e2e8f0',
};

export default function AdminSubmissions() {
    const { showAlert, showConfirm } = useDialog();
    const [page, setPage] = useState(1);
    const [type, setType] = useState('');
    const [status, setStatus] = useState('');
    const [responses, setResponses] = useState({});
    const [data, setData] = useState({ submissions: [], totalPages: 1 });
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/submissions', {
                params: { page, limit: 20, ...(type ? { type } : {}), ...(status ? { status } : {}) },
            });
            setData({ submissions: res.data.submissions || [], totalPages: res.data.totalPages || 1 });
            setResponses({});
        } catch (error) {
            showAlert(error?.response?.data?.msg || 'Failed to load submissions', 'Error');
            setData((current) => ({ ...current, submissions: [] }));
        } finally {
            setLoading(false);
        }
    }, [page, type, status, showAlert]);

    useEffect(() => {
        load();
    }, [load]);

    const update = async (submission, nextStatus) => {
        if (['resolved', 'dismissed'].includes(nextStatus)) {
            const confirmed = await showConfirm(
                `Mark this ${submission.type} as ${nextStatus.replace('_', ' ')}?`,
                'Confirm moderation action'
            );
            if (!confirmed) return;
        }

        try {
            const res = await api.patch(`/admin/submissions/${submission._id}`, {
                status: nextStatus,
                response: responses[submission._id] || submission.response || '',
            });
            setData((current) => ({
                ...current,
                submissions: current.submissions.map((item) => item._id === submission._id ? res.data : item),
            }));
            showAlert('Submission updated.', 'Success');
        } catch (error) {
            showAlert(error?.response?.data?.msg || 'Failed to update submission', 'Error');
        }
    };

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem 1rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Support queue</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                <select value={type} onChange={(event) => { setType(event.target.value); setPage(1); }} style={inputStyle} aria-label="Filter by type">
                    <option value="">All types</option>
                    <option value="report">Reports</option>
                    <option value="help">Help</option>
                    <option value="feedback">Feedback</option>
                </select>
                <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} style={inputStyle} aria-label="Filter by status">
                    <option value="">All statuses</option>
                    {SUBMISSION_STATUSES.map((option) => <option key={option} value={option}>{option.replace('_', ' ')}</option>)}
                </select>
                <Button type="button" variant="secondary" onClick={load}>Refresh</Button>
            </div>

            {loading ? (
                <p style={{ color: '#94a3b8' }}>Loading…</p>
            ) : (
                <>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {data.submissions.map((submission) => (
                            <article key={submission._id} style={{ border: '1px solid #334155', borderRadius: 12, padding: '1rem', background: 'rgba(15,23,42,0.6)', color: '#e2e8f0' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <strong style={{ textTransform: 'capitalize' }}>{submission.type}</strong>
                                    <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{submission.category || submission.subjectType || 'general'}</span>
                                    <span style={{ color: '#c4b5fd', fontSize: '0.875rem' }}>{submission.status.replace('_', ' ')}</span>
                                    <span style={{ color: '#64748b', fontSize: '0.75rem', marginLeft: 'auto' }}>
                                        {new Date(submission.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{submission.message}</p>
                                <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                                    From: {submission.reporter?.displayName || submission.reporter?.email || 'Unknown'}
                                    {submission.reportedUser ? ` · Reported: ${submission.reportedUser.displayName || 'Unknown'}` : ''}
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                                    <input
                                        type="text"
                                        placeholder="Optional response to the user"
                                        value={responses[submission._id] ?? submission.response ?? ''}
                                        onChange={(event) => setResponses((current) => ({ ...current, [submission._id]: event.target.value }))}
                                        style={{ ...inputStyle, flex: '1 1 260px' }}
                                        aria-label="Response"
                                    />
                                    {SUBMISSION_STATUSES.filter((option) => option !== submission.status).map((option) => (
                                        <Button key={option} type="button" variant="secondary" onClick={() => update(submission, option)}>
                                            {option.replace('_', ' ')}
                                        </Button>
                                    ))}
                                </div>
                            </article>
                        ))}
                    </div>
                    {data.submissions.length === 0 && <p style={{ color: '#94a3b8', marginTop: '1rem' }}>No submissions found.</p>}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
                        <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Prev</Button>
                        <span style={{ color: '#94a3b8' }}>Page {page} of {data.totalPages}</span>
                        <Button type="button" variant="secondary" disabled={page >= data.totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
                    </div>
                </>
            )}
        </div>
    );
}
