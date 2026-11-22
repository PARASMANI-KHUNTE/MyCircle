import api from './api';
import { buildSupportPayload, SupportDraft } from '../utils/supportSubmission';

export const submitSupportRequest = async (draft: SupportDraft) => {
    const response = await api.post('/support/submissions', buildSupportPayload(draft));
    return response.data;
};
