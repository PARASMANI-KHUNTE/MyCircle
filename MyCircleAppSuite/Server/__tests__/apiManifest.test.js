const { apiManifest, getApiManifest } = require('../src/config/apiManifest');

describe('API ownership manifest', () => {
    it('contains unique mounts and service owners', () => {
        const mounts = apiManifest.map((entry) => entry.mount);

        expect(new Set(mounts).size).toBe(mounts.length);
        expect(apiManifest).toEqual(expect.arrayContaining([
            expect.objectContaining({ mount: '/api/posts', owner: 'marketplace' }),
            expect.objectContaining({ mount: '/api/chat', owner: 'communication' }),
        ]));
        expect(apiManifest.every((entry) => entry.module && entry.owner)).toBe(true);
    });

    it('returns a copy so callers cannot mutate the manifest', () => {
        const manifest = getApiManifest();
        manifest[0].owner = 'unexpected-owner';

        expect(apiManifest[0].owner).toBe('identity');
    });
});
