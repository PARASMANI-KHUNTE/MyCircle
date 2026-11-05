const { createEvent, isValidEvent } = require('../src/services/platform/eventEnvelope');
const {
    SERVICE_NAMES,
    getServiceTimeoutMs,
    getServiceUrl,
} = require('../src/services/platform/serviceRegistry');
const { createServiceClient } = require('../src/services/platform/serviceClient');

describe('Platform service primitives', () => {
    beforeEach(() => {
        delete process.env.MARKETPLACE_SERVICE_URL;
        delete process.env.SERVICE_TIMEOUT_MS;
    });

    it('creates and validates a versioned event envelope', () => {
        const event = createEvent({
            type: 'post.created',
            aggregateId: 'post-1',
            payload: { title: 'A post' },
            context: { requestId: 'trace-1', service: 'marketplace' },
        });

        expect(isValidEvent(event)).toBe(true);
        expect(event).toEqual(expect.objectContaining({
            version: 1,
            type: 'post.created',
            aggregateId: 'post-1',
            context: { requestId: 'trace-1', service: 'marketplace' },
        }));
    });

    it('resolves registered services and safe timeout defaults', () => {
        process.env.MARKETPLACE_SERVICE_URL = 'http://marketplace:4001';
        process.env.SERVICE_TIMEOUT_MS = '1500';

        expect(SERVICE_NAMES).toContain('marketplace');
        expect(getServiceUrl('marketplace')).toBe('http://marketplace:4001');
        expect(getServiceTimeoutMs()).toBe(1500);
        expect(() => getServiceUrl('unknown')).toThrow('Unknown service');
    });

    it('propagates request context through downstream calls', async () => {
        process.env.MARKETPLACE_SERVICE_URL = 'http://marketplace:4001';
        const fetchImpl = jest.fn().mockResolvedValue({ status: 200 });
        const client = createServiceClient({ fetchImpl, serviceName: 'marketplace' });

        await expect(client('/posts', {
            method: 'GET',
        }, {
            requestId: 'trace-2',
            authorization: 'Bearer token',
        })).resolves.toEqual({ status: 200 });

        const [url, options] = fetchImpl.mock.calls[0];
        expect(url).toEqual(new URL('/posts', 'http://marketplace:4001'));
        expect(options.method).toBe('GET');
        expect(options.headers.get('accept')).toBe('application/json');
        expect(options.headers.get('authorization')).toBe('Bearer token');
        expect(options.headers.get('x-request-id')).toBe('trace-2');
    });
});
