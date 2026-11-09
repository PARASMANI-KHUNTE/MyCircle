const request = require('supertest');
const app = require('../src/app');

describe('Identity Microservice Operational Contracts', () => {
    it('serves liveness health probe', async () => {
        const res = await request(app).get('/health/live');
        expect(res.status).toBe(200);
        expect(res.body.service).toBe('identity');
        expect(res.body.status).toBe('ok');
    });

    it('serves readiness probe', async () => {
        const res = await request(app).get('/health/ready');
        expect(res.status).toBe(200);
        expect(res.body.service).toBe('identity');
        expect(res.body.status).toBe('ready');
    });

    it('attaches and echoes correlation request IDs', async () => {
        const res = await request(app)
            .get('/health/live')
            .set('x-request-id', 'test-tracing-id-1234');
        expect(res.headers['x-request-id']).toBe('test-tracing-id-1234');
    });
});
