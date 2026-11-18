const healthRoutes = require('../src/routes/healthRoutes');

describe('App Download Routes', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        mockReq = {};
        mockRes = {
            redirect: jest.fn(),
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };
    });

    const getRouteHandler = (path) => {
        const route = healthRoutes.stack.find(
            (layer) => layer.route && layer.route.path === path && layer.route.methods.get
        );
        return route ? route.route.stack[0].handle : null;
    };

    it('should redirect /download/apk to official release APK with 302', () => {
        const handler = getRouteHandler('/download/apk');
        expect(handler).toBeDefined();

        handler(mockReq, mockRes);
        expect(mockRes.redirect).toHaveBeenCalledWith(
            302,
            expect.stringContaining('releases/latest/download/mycircle.apk')
        );
    });

    it('should redirect /app/download to official release APK with 302', () => {
        const handler = getRouteHandler('/app/download');
        expect(handler).toBeDefined();

        handler(mockReq, mockRes);
        expect(mockRes.redirect).toHaveBeenCalledWith(
            302,
            expect.stringContaining('releases/latest/download/mycircle.apk')
        );
    });
});
