export const SUBMISSION_TYPES = ['report', 'help', 'feedback'];
export const SUBMISSION_STATUSES = ['open', 'in_progress', 'resolved', 'dismissed'];

export const buildSubmissionPayload = ({ type, message, category, subjectType, subjectId, reportedUserId }) => {
    const payload = { type, message: String(message || '').trim() };

    if (type === 'report') {
        if (category) payload.category = category;
        if (subjectType) payload.subjectType = subjectType;
        if (subjectId) payload.subjectId = subjectId;
        if (reportedUserId) payload.reportedUserId = reportedUserId;
    }

    return payload;
};
