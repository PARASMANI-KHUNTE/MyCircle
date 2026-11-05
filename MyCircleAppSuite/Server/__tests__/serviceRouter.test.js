const { serviceRouter } = require('../src/middleware/serviceRouter');

const createRequest = (overrides = {}) => ({
    method: 'GET',
    originalUrl: '/api/posts?limit=10',
    requestId: 'trace-1',
    get: jest.fn((name) => name === 'authorization' ? 'Bearer token' : undefined),
    ...overrides,
});

const createResponse = () => ({
    headers: {},
    status: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
    send: jest.fn(),
    end: jest.fn(),
});

describe('Service router', () => {
    beforeEach(() => {
        process.env.MARKETPLACE_SERVICE_URL = 'http://marketplace:4002';
    });

    afterEach(() => {
        delete process.env.MARKETPLACE_SERVICE_URL;
        delete process.env.IDENTITY_SERVICE_URL;
    });

    it('proxies configured read traffic and preserves response metadata', async () => {
        const upstream = {
            status: 200,
            headers: new Map([['content-type', 'application/json']]),
            arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('{"items":[]}')),
        };
        const fetchImpl = jest.fn().mockResolvedValue(upstream);
        const req = createRequest();
        const res = createResponse();
        const next = jest.fn();

        await serviceRouter({ serviceName: 'marketplace', fetchImpl })(req, res, next);

        expect(fetchImpl).toHaveBeenCalledWith(
            new URL('/api/posts?limit=10', 'http://marketplace:4002'),
            expect.objectContaining({ method: 'GET' }),
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.setHeader).toHaveBeenCalledWith('content-type', 'application/json');
        expect(res.send).toHaveBeenCalledWith(Buffer.from('{"items":[]}'));
        expect(next).not.toHaveBeenCalled();
    });

    it('falls back to the monolith when the service URL is unset or method is unsupported', async () => {
        delete process.env.MARKETPLACE_SERVICE_URL;
        const next = jest.fn();
        await serviceRouter({
            serviceName: 'marketplace',
            fetchImpl: jest.fn(),
        })(createRequest(), createResponse(), next);

        expect(next).toHaveBeenCalledTimes(1);
    });

    it('does not silently fall back when an enabled service fails', async () => {
        const next = jest.fn();
        const req = createRequest();
        const res = createResponse();
        await serviceRouter({
            serviceName: 'marketplace',
            fetchImpl: jest.fn().mockRejectedValue(new Error('connection refused')),
        })(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: 503,
            message: 'marketplace service is unavailable',
        }));
    });

    it('forwards JSON write bodies when the method is explicitly enabled', async () => {
        process.env.IDENTITY_SERVICE_URL = 'http://identity:4001';
        const upstream = {
            status: 201,
            headers: new Map(),
            arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('{"token":"x"}')),
        };
        const fetchImpl = jest.fn().mockResolvedValue(upstream);
        const req = createRequest({
            method: 'POST',
            originalUrl: '/auth/login',
            body: { email: 'user@example.com', password: 'password' },
            get: jest.fn((name) => name === 'content-type' ? 'application/json' : undefined),
        });
        const res = createResponse();
        const next = jest.fn();

        await serviceRouter({
            serviceName: 'identity',
            fetchImpl,
            methods: ['POST'],
        })(req, res, next);

        const [, options] = fetchImpl.mock.calls[0];
        expect(options.body).toBe(JSON.stringify(req.body));
        expect(options.headers.get('content-type')).toBe('application/json');
        expect(res.status).toHaveBeenCalledWith(201);
        expect(next).not.toHaveBeenCalled();
    });

    it('keeps multipart writes on the monolith', async () => {
        process.env.MARKETPLACE_SERVICE_URL = 'http://marketplace:4002';
        const next = jest.fn();
        await serviceRouter({
            serviceName: 'marketplace',
            fetchImpl: jest.fn(),
            methods: ['POST'],
        })(
            createRequest({
                method: 'POST',
                get: jest.fn((name) => name === 'content-type' ? 'multipart/form-data; boundary=test' : undefined),
            }),
            createResponse(),
            next,
        );

        expect(next).toHaveBeenCalledTimes(1);
    });
});
