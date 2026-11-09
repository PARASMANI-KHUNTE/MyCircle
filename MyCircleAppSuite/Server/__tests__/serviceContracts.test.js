const {
    getServiceContract,
    serviceContracts,
} = require('../src/config/serviceContracts');

describe('Service contracts', () => {
    it('defines an operational contract for every migration boundary', () => {
        expect(Object.keys(serviceContracts)).toEqual([
            'identity',
            'marketplace',
            'contact',
            'communication',
            'safety',
            'notifications',
            'payment',
        ]);

        for (const contract of Object.values(serviceContracts)) {
            expect(contract.owner).toBeTruthy();
            expect(contract.healthPath).toBe('/health/live');
            expect(contract.persistence).toBeTruthy();
            expect(contract.events.length).toBeGreaterThan(0);
        }
    });

    it('returns a defensive copy of event definitions', () => {
        const contract = getServiceContract('marketplace');
        contract.events.push('unexpected.event');

        expect(serviceContracts.marketplace.events).not.toContain('unexpected.event');
        expect(() => getServiceContract('unknown')).toThrow('Unknown service');
    });
});
