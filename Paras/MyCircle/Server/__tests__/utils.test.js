const { validate, schemas } = require('../src/middleware/validation');
const { containsProfanity } = require('../src/utils/profanityFilter');

describe('Validation Middleware', () => {
    describe('sendMessage schema', () => {
        const validateSendMessage = validate(schemas.sendMessage);

        it('should pass with valid data', () => {
            const req = {
                body: {
                    recipientId: '507f1f77bcf86cd799439011',
                    text: 'Hello, world!',
                },
            };
            const res = {};
            const next = jest.fn();
            
            validateSendMessage(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('should fail with missing recipientId', () => {
            const req = { body: { text: 'Hello' } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
            const next = jest.fn();
            
            validateSendMessage(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should fail with message too long', () => {
            const req = {
                body: {
                    recipientId: '507f1f77bcf86cd799439011',
                    text: 'a'.repeat(5001),
                },
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
            const next = jest.fn();
            
            validateSendMessage(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('blockUser schema', () => {
        const validateBlockUser = validate(schemas.blockUser);

        it('should pass with valid userId', () => {
            const req = { body: { userId: '507f1f77bcf86cd799439011' } };
            const res = {};
            const next = jest.fn();
            
            validateBlockUser(req, res, next);
            expect(next).toHaveBeenCalled();
        });
    });
});

describe('Profanity Filter', () => {
    it('should detect profanity', () => {
        expect(containsProfanity('badword')).toBe(true);
    });

    it('should allow clean text', () => {
        expect(containsProfanity('hello world')).toBe(false);
    });
});