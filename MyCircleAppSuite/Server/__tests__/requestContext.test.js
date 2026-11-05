const {
    REQUEST_ID_HEADER,
    getRequestId,
    requestContext,
} = require('../src/middleware/requestContext');

const createResponse = () => {
    const listeners = {};
    const response = {
        headers: {},
        statusCode: 200,
        on: jest.fn((event, callback) => {
            listeners[event] = callback;
        }),
        setHeader: jest.fn((name, value) => {
            response.headers[name] = value;
        }),
        finish: () => listeners.finish?.(),
    };

    return response;
};

describe('Request context middleware', () => {
    it('accepts a safe incoming request ID', () => {
        expect(getRequestId('trace-123.abc')).toBe('trace-123.abc');
    });

    it('replaces missing, oversized, and unsafe request IDs', () => {
        for (const value of [undefined, '', 'a'.repeat(129), 'trace id']) {
            const requestId = getRequestId(value);
            expect(requestId).toEqual(expect.any(String));
            expect(requestId).not.toBe(value);
            expect(requestId.length).toBeGreaterThan(0);
        }
    });

    it('attaches context, propagates the ID, and logs completion', () => {
        const childLogger = {
            info: jest.fn(),
        };
        const logger = {
            child: jest.fn(() => childLogger),
        };
        const req = {
            method: 'GET',
            originalUrl: '/health',
            get: jest.fn(() => 'trace-123'),
        };
        const res = createResponse();
        const next = jest.fn();

        requestContext(logger, 'api')(req, res, next);

        expect(req.requestId).toBe('trace-123');
        expect(req.service).toBe('api');
        expect(logger.child).toHaveBeenCalledWith({
            requestId: 'trace-123',
            service: 'api',
            method: 'GET',
            path: '/health',
        });
        expect(res.setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, 'trace-123');
        expect(next).toHaveBeenCalledTimes(1);

        res.finish();
        expect(childLogger.info).toHaveBeenCalledWith(
            expect.objectContaining({ status: 200 }),
            'Request completed',
        );
    });
});
