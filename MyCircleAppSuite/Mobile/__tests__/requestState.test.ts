import { applyCompletionResult } from '../src/utils/requestState';

const received = [
    { _id: 'request-1', status: 'accepted' },
    { _id: 'request-2', status: 'accepted' },
    { _id: 'request-3', status: 'accepted' },
];
const sent = [{ _id: 'request-4', status: 'accepted' }];

describe('applyCompletionResult', () => {
    it('keeps the completed request and removes only explicitly deleted ids', () => {
        const result = applyCompletionResult(received, sent, {
            removed: false,
            request: { _id: 'request-1', status: 'completed', canRate: true },
            deletedRequestIds: ['request-2', 'request-4'],
        });

        expect(result.receivedRequests.map((request) => request._id)).toEqual(['request-1', 'request-3']);
        expect(result.sentRequests).toEqual([]);
        expect(result.receivedRequests[0]).toMatchObject({
            status: 'completed',
            canRate: true,
        });
    });

    it('does not drop siblings when the server reports only a count', () => {
        const result = applyCompletionResult(received, sent, {
            removed: true,
            removedRequestsCount: 2,
        });

        expect(result.receivedRequests).toEqual(received);
        expect(result.sentRequests).toEqual(sent);
    });
});
