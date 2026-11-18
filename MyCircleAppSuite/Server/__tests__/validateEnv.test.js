jest.mock('envalid', () => ({
    cleanEnv: jest.fn((env) => env),
    str: jest.fn(() => ({})),
    port: jest.fn(() => ({})),
    url: jest.fn(() => ({})),
}));

const validateEnv = require('../src/utils/validateEnv');

describe('Environment Validation', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('should warn instead of exiting when JWT_SECRET is shorter than 32 characters', () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
            throw new Error('process.exit called');
        });

        process.env.JWT_SECRET = 'shortsecret123';
        process.env.CLOUDINARY_CLOUD_NAME = 'test';
        process.env.CLOUDINARY_API_KEY = 'test';
        process.env.CLOUDINARY_API_SECRET = 'test';
        process.env.MONGO_URI = 'mongodb://localhost:27017/test';

        expect(() => validateEnv()).not.toThrow();
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('JWT_SECRET should be at least 32 characters'));

        warnSpy.mockRestore();
        logSpy.mockRestore();
        exitSpy.mockRestore();
    });

    it('should exit when JWT_SECRET is missing', () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
            throw new Error('process.exit(1)');
        });

        delete process.env.JWT_SECRET;

        expect(() => validateEnv()).toThrow('process.exit(1)');
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('JWT_SECRET is required'));

        errorSpy.mockRestore();
        exitSpy.mockRestore();
    });
});
