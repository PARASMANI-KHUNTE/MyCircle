jest.mock('../src/utils/logger', () => ({
    error: jest.fn(),
}));

const errorHandler = require('../src/middleware/errorHandler');
const logger = require('../src/utils/logger');
const ApiError = require('../src/utils/ApiError');

const createResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
});

describe('Error handler contract', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns a stable error shape with the request ID', () => {
        const res = createResponse();
        const req = {
            requestId: 'trace-123',
            service: 'api',
            method: 'GET',
            originalUrl: '/api/posts',
        };

        errorHandler(new ApiError(404, 'Post not found'), req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            msg: 'Post not found',
            error: 'Post not found',
            requestId: 'trace-123',
        }));
        expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({
            requestId: 'trace-123',
            service: 'api',
            statusCode: 404,
        }), 'Request failed');
    });

    it('uses the request logger when request context is available', () => {
        const res = createResponse();
        const requestLogger = { error: jest.fn() };
        const req = {
            requestId: 'trace-456',
            service: 'marketplace',
            method: 'POST',
            originalUrl: '/api/posts',
            log: requestLogger,
        };

        errorHandler(new Error('Unexpected failure'), req, res);

        expect(requestLogger.error).toHaveBeenCalledWith(expect.objectContaining({
            requestId: 'trace-456',
            service: 'marketplace',
            statusCode: 500,
        }), 'Request failed');
        expect(logger.error).not.toHaveBeenCalled();
    });
});
