const { getServiceName } = require('../src/config/serviceIdentity');

describe('Service identity', () => {
    afterEach(() => {
        delete process.env.SERVICE_NAME;
    });

    it('defaults to the compatibility API service', () => {
        expect(getServiceName()).toBe('api');
    });

    it('accepts registered service names and rejects unknown values', () => {
        process.env.SERVICE_NAME = 'marketplace';
        expect(getServiceName()).toBe('marketplace');

        process.env.SERVICE_NAME = 'unregistered';
        expect(getServiceName()).toBe('api');
    });
});
