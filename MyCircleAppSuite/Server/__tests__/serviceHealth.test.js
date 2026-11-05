const {
    checkConfiguredServices,
    checkService,
} = require('../src/services/platform/serviceHealth');

describe('Service health checks', () => {
    beforeEach(() => {
        process.env.MARKETPLACE_SERVICE_URL = 'http://marketplace:4002';
        delete process.env.IDENTITY_SERVICE_URL;
    });

    afterEach(() => {
        delete process.env.MARKETPLACE_SERVICE_URL;
        delete process.env.IDENTITY_SERVICE_URL;
    });

    it('checks configured services using their declared health contract', async () => {
        const fetchImpl = jest.fn().mockResolvedValue({ ok: true, status: 200 });

        await expect(checkService('marketplace', fetchImpl)).resolves.toEqual({
            status: 'ok',
            httpStatus: 200,
        });
        expect(fetchImpl).toHaveBeenCalledWith(
            new URL('/health/live', 'http://marketplace:4002'),
            expect.objectContaining({ method: 'GET' }),
        );
    });

    it('marks unavailable configured services unhealthy and leaves others unconfigured', async () => {
        const fetchImpl = jest.fn().mockRejectedValue(new Error('connection refused'));

        await expect(checkConfiguredServices(fetchImpl)).resolves.toEqual(expect.objectContaining({
            allHealthy: false,
            services: expect.objectContaining({
                marketplace: expect.objectContaining({ status: 'error' }),
                identity: { status: 'not_configured' },
            }),
        }));
    });

    it('does not make readiness depend on absent extracted services', async () => {
        delete process.env.MARKETPLACE_SERVICE_URL;

        await expect(checkConfiguredServices(jest.fn())).resolves.toEqual(expect.objectContaining({
            allHealthy: true,
        }));
    });
});
