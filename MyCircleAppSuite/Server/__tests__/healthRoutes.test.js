const healthRoutes = require('../src/routes/healthRoutes');

const findRoute = (path) => {
    const layer = healthRoutes.stack.find((candidate) => candidate.route?.path === path);
    return layer?.route;
};

describe('Health routes', () => {
    it('exposes the standard health endpoints', () => {
        expect(findRoute('/')).toBeTruthy();
        expect(findRoute('/live')).toBeTruthy();
        expect(findRoute('/ready')).toBeTruthy();
        expect(findRoute('/services')).toBeTruthy();
    });

    it('GET / returns an aggregate status even when dependencies are down', async () => {
        const route = findRoute('/');
        const res = { json: jest.fn() };

        await route.stack[route.stack.length - 1].handle({}, res, jest.fn());

        const payload = res.json.mock.calls[0][0];
        expect(payload.status).toMatch(/^(ok|degraded)$/);
        expect(typeof payload.uptime).toBe('number');
        expect(payload.services).toEqual(
            expect.objectContaining({
                database: expect.any(String),
                redis: expect.any(String),
            })
        );
    });

    it('GET /services returns the admin dashboard card shape', async () => {
        const route = findRoute('/services');
        const res = { json: jest.fn() };

        await route.stack[route.stack.length - 1].handle({}, res, jest.fn());

        const payload = res.json.mock.calls[0][0];
        expect(Array.isArray(payload.services)).toBe(true);

        const names = payload.services.map((service) => service.name);
        expect(names).toEqual(expect.arrayContaining(['database', 'redis', 'firebase']));

        for (const service of payload.services) {
            expect(service).toEqual(
                expect.objectContaining({
                    name: expect.any(String),
                    status: expect.stringMatching(/^(healthy|degraded|down|unknown)$/),
                    uptime: expect.any(String),
                    lastCheck: expect.any(String),
                })
            );
        }

        // Core infrastructure cards carry latency measurements; downstream
        // extracted-service cards do not.
        for (const name of ['database', 'redis', 'firebase']) {
            const card = payload.services.find((service) => service.name === name);
            expect(card).toBeTruthy();
            expect(card.latency).toEqual(expect.any(Number));
        }
    });

    it('GET /live is trivially healthy', async () => {
        const route = findRoute('/live');
        const res = { json: jest.fn() };

        await route.stack[route.stack.length - 1].handle({}, res, jest.fn());

        expect(res.json).toHaveBeenCalledWith({ status: 'ok' });
    });
});
