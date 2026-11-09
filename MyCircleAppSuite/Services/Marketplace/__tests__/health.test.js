const request = require('supertest');
const app = require('../src/app');

describe('Marketplace Microservice Operational Contracts', () => {
    it('serves liveness health probe', async () => {
        const res = await request(app).get('/health/live');
        expect(res.status).toBe(200);
        expect(res.body.service).toBe('marketplace');
        expect(res.body.status).toBe('ok');
    });

    it('serves readiness probe', async () => {
        const res = await request(app).get('/health/ready');
        expect(res.status).toBe(200);
        expect(res.body.service).toBe('marketplace');
        expect(res.body.status).toBe('ready');
    });

    it('attaches and echoes correlation request IDs', async () => {
        const res = await request(app)
            .get('/health/live')
            .set('x-request-id', 'marketplace-trace-5678');
        expect(res.headers['x-request-id']).toBe('marketplace-trace-5678');
    });
});
