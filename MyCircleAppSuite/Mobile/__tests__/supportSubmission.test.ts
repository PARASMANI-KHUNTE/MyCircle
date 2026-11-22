import { buildSupportPayload } from '../src/utils/supportSubmission';

describe('buildSupportPayload', () => {
    it('trims the message for help requests', () => {
        expect(buildSupportPayload({ type: 'help', message: '  Reset my password  ' })).toEqual({
            type: 'help',
            message: 'Reset my password',
        });
    });

    it('keeps report context and category', () => {
        expect(buildSupportPayload({
            type: 'report',
            message: 'Spam post',
            category: 'spam',
            subjectType: 'post',
            subjectId: 'post-1',
            reportedUserId: 'user-2',
        })).toEqual({
            type: 'report',
            message: 'Spam post',
            category: 'spam',
            subjectType: 'post',
            subjectId: 'post-1',
            reportedUserId: 'user-2',
        });
    });

    it('does not leak report-only fields into feedback', () => {
        const payload = buildSupportPayload({
            type: 'feedback',
            message: 'Love it',
            reportedUserId: 'user-2',
            subjectId: 'post-1',
        });

        expect(payload).not.toHaveProperty('reportedUserId');
        expect(payload).not.toHaveProperty('subjectId');
    });
});
