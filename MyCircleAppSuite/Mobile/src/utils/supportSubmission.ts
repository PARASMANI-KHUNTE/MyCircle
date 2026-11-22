export type SupportType = 'report' | 'help' | 'feedback';
export type SupportSubjectType = 'post' | 'comment' | 'chat' | 'profile' | 'image' | 'user' | 'other';

export type SupportDraft = {
    type: SupportType;
    message: string;
    category?: string;
    subjectType?: SupportSubjectType;
    subjectId?: string;
    reportedUserId?: string;
};

export const buildSupportPayload = (draft: SupportDraft) => {
    const payload: Record<string, string> = {
        type: draft.type,
        message: draft.message.trim(),
    };

    if (draft.type === 'report') {
        if (draft.category) payload.category = draft.category;
        if (draft.subjectType) payload.subjectType = draft.subjectType;
        if (draft.subjectId) payload.subjectId = draft.subjectId;
        if (draft.reportedUserId) payload.reportedUserId = draft.reportedUserId;
    }

    return payload;
};
