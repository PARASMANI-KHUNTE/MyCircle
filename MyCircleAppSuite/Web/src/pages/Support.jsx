import React, { useState } from 'react';
import api from '../utils/api';
import Button from '../components/ui/Button';
import { useDialog } from '../hooks/useDialog';
import { buildSubmissionPayload, SUBMISSION_TYPES } from '../utils/support';

const CATEGORIES = ['spam', 'harassment', 'scam', 'impersonation', 'hate_speech', 'nudity', 'violence', 'other'];
const SUBJECT_TYPES = ['user', 'post', 'chat', 'profile', 'comment', 'image', 'other'];

const fieldStyle = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '0.75rem',
    border: '1px solid var(--border-color, #334155)',
    background: 'var(--bg-secondary, #0f172a)',
    color: 'var(--text-primary, #e2e8f0)',
    marginTop: '0.4rem',
};

export default function Support() {
    const { showAlert } = useDialog();
    const [type, setType] = useState('help');
    const [message, setMessage] = useState('');
    const [category, setCategory] = useState('other');
    const [subjectType, setSubjectType] = useState('user');
    const [subjectId, setSubjectId] = useState('');
    const [reportedUserId, setReportedUserId] = useState('');
    const [sending, setSending] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        if (message.trim().length < 3) {
            showAlert('Please provide a little more detail.', 'Missing details');
            return;
        }

        setSending(true);
        try {
            await api.post('/support/submissions', buildSubmissionPayload({
                type,
                message,
                category,
                subjectType,
                subjectId,
                reportedUserId,
            }));
            showAlert('Thanks! Our team will review your submission.', 'Submitted');
            setMessage('');
            setSubjectId('');
            setReportedUserId('');
        } catch (error) {
            showAlert(error?.response?.data?.msg || 'Could not submit your request. Please try again.', 'Error');
        } finally {
            setSending(false);
        }
    };

    const label = type === 'report' ? 'Report a problem' : type === 'feedback' ? 'Share feedback' : 'Get help';

    return (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '1.5rem 1rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Support</h1>
            <p style={{ color: 'var(--text-muted, #94a3b8)', marginBottom: '1.5rem' }}>
                Send a report, ask for help, or tell us what you think. Only admins can review submissions.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {SUBMISSION_TYPES.map((option) => (
                    <button
                        key={option}
                        type="button"
                        onClick={() => setType(option)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '999px',
                            border: '1px solid var(--border-color, #334155)',
                            background: type === option ? 'var(--primary, #8b5cf6)' : 'transparent',
                            color: type === option ? '#fff' : 'var(--text-muted, #94a3b8)',
                            textTransform: 'capitalize',
                            cursor: 'pointer',
                        }}
                    >
                        {option}
                    </button>
                ))}
            </div>

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    {label}
                    <textarea
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        rows={6}
                        maxLength={2000}
                        placeholder={type === 'report' ? 'What happened? Please include any useful details.' : 'Tell us what you need…'}
                        style={{ ...fieldStyle, resize: 'vertical' }}
                    />
                </label>

                {type === 'report' && (
                    <>
                        <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                            Category
                            <select value={category} onChange={(event) => setCategory(event.target.value)} style={fieldStyle}>
                                {CATEGORIES.map((option) => <option key={option} value={option}>{option.replace('_', ' ')}</option>)}
                            </select>
                        </label>
                        <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                            What are you reporting?
                            <select value={subjectType} onChange={(event) => setSubjectType(event.target.value)} style={fieldStyle}>
                                {SUBJECT_TYPES.map((option) => <option key={option} value={option}>{option}</option>)}
                            </select>
                        </label>
                        <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                            Reported user ID (optional if you have a content ID)
                            <input value={reportedUserId} onChange={(event) => setReportedUserId(event.target.value)} style={fieldStyle} />
                        </label>
                        <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                            Content ID (optional)
                            <input value={subjectId} onChange={(event) => setSubjectId(event.target.value)} style={fieldStyle} />
                        </label>
                    </>
                )}

                <Button type="submit" disabled={sending}>
                    {sending ? 'Submitting…' : 'Submit'}
                </Button>
            </form>
        </div>
    );
}
