const request = require('supertest');
const { app } = require('../src/app');

describe('Communication Microservice Operational Contracts', () => {
    it('serves liveness health probe', async () => {
        const res = await request(app).get('/health/live');
        expect(res.status).toBe(200);
        expect(res.body.service).toBe('communication');
        expect(res.body.status).toBe('ok');
    });

    it('serves readiness probe', async () => {
        const res = await request(app).get('/health/ready');
        expect(res.status).toBe(200);
        expect(res.body.service).toBe('communication');
        expect(res.body.status).toBe('ready');
    });

    it('attaches and echoes correlation request IDs', async () => {
        const res = await request(app)
            .get('/health/live')
            .set('x-request-id', 'comm-trace-9999');
        expect(res.headers['x-request-id']).toBe('comm-trace-9999');
    });
});
