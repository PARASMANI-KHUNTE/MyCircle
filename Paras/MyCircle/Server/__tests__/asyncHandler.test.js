const asyncHandler = require('../src/utils/asyncHandler');
const ApiError = require('../src/utils/ApiError');

describe('Async Handler', () => {
    it('should pass errors to next middleware', async () => {
        const mockFn = jest.fn(() => Promise.reject(new Error('Test error')));
        const req = {};
        const res = {};
        const next = jest.fn();

        const wrappedFn = asyncHandler(mockFn);
        await wrappedFn(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should call the async function', async () => {
        const mockFn = jest.fn().mockResolvedValue('result');
        const req = {};
        const res = {};
        const next = jest.fn();

        const wrappedFn = asyncHandler(mockFn);
        await wrappedFn(req, res, next);

        expect(mockFn).toHaveBeenCalledWith(req, res, next);
    });
});

describe('ApiError', () => {
    it('should create error with status and message', () => {
        const error = new ApiError(404, 'Not found');
        
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('Not found');
        expect(error.isOperational).toBe(true);
    });

    it('should have proper name', () => {
        const error = new ApiError(500, 'Server error');
        expect(error.name).toBe('ApiError');
    });
});