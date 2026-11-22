jest.mock('../src/models/SupportSubmission', () => ({
    create: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    findById: jest.fn(),
}));

jest.mock('../src/models/User', () => ({
    findById: jest.fn(),
}));

const SupportSubmission = require('../src/models/SupportSubmission');
const User = require('../src/models/User');
const {
    createSubmission,
    getMySubmissions,
    listSubmissions,
    updateSubmission,
} = require('../src/controllers/supportController');
const { reportUser } = require('../src/controllers/userController');

const flush = () => new Promise((resolve) => setImmediate(resolve));

const buildQuery = (result) => {
    const query = {};
    for (const method of ['populate', 'sort', 'skip', 'limit']) {
        query[method] = jest.fn().mockReturnValue(query);
    }
    query.lean = jest.fn().mockResolvedValue(result);
    return query;
};

describe('support submissions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('stores the authenticated reporter and an open status on submission', async () => {
        SupportSubmission.create.mockImplementation(async (fields) => ({ _id: 'sub-1', ...fields }));
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        createSubmission({
            body: { type: 'help', message: 'Need help with my account', subjectType: 'other' },
            user: { id: 'user-1' },
        }, res, jest.fn());
        await flush();

        expect(SupportSubmission.create).toHaveBeenCalledWith(expect.objectContaining({
            type: 'help',
            status: 'open',
            reporter: 'user-1',
            message: 'Need help with my account',
        }));
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('rejects a self-report', async () => {
        const next = jest.fn();

        createSubmission({
            body: { type: 'report', message: 'Bad user', reportedUserId: 'user-1' },
            user: { id: 'user-1' },
        }, { status: jest.fn(), json: jest.fn() }, next);
        await flush();

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
        expect(SupportSubmission.create).not.toHaveBeenCalled();
    });

    it('lists only the current user\'s submissions', async () => {
        SupportSubmission.find.mockReturnValue(buildQuery([]));

        getMySubmissions({ query: { page: '1' }, user: { id: 'user-1' } }, { json: jest.fn() }, jest.fn());
        await flush();

        expect(SupportSubmission.find).toHaveBeenCalledWith({ reporter: 'user-1' });
    });

    it('filters the admin queue by type and status with pagination', async () => {
        SupportSubmission.find.mockReturnValue(buildQuery([]));
        SupportSubmission.countDocuments.mockResolvedValue(25);

        listSubmissions(
            { query: { type: 'report', status: 'open', page: '2' } },
            { json: jest.fn() },
            jest.fn()
        );
        await flush();

        expect(SupportSubmission.find).toHaveBeenCalledWith({ type: 'report', status: 'open' });
        expect(SupportSubmission.find.mock.results[0].value.skip).toHaveBeenCalledWith(20);
    });

    it('updates status, response and responding admin on triage', async () => {
        const submission = {
            status: 'open',
            response: '',
            save: jest.fn().mockResolvedValue(undefined),
        };
        SupportSubmission.findById.mockResolvedValue(submission);
        const res = { json: jest.fn() };

        updateSubmission({
            params: { id: '507f1f77bcf86cd799439011' },
            body: { status: 'resolved', response: 'Thanks for reporting.' },
            user: { id: 'admin-1' },
        }, res, jest.fn());
        await flush();

        expect(submission.status).toBe('resolved');
        expect(submission.response).toBe('Thanks for reporting.');
        expect(String(submission.respondedBy)).toBe('admin-1');
        expect(submission.respondedAt).toBeInstanceOf(Date);
        expect(submission.save).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalled();
    });
});

describe('legacy report endpoint', () => {
    it('mirrors accepted reports into the support queue', async () => {
        User.findById.mockResolvedValue({ reports: [], save: jest.fn().mockResolvedValue(undefined) });
        SupportSubmission.create.mockResolvedValue({});

        await reportUser({
            body: { reportedUserId: '507f1f77bcf86cd799439012', reason: 'spam account', contentType: 'user' },
            user: { id: 'user-1' },
        }, { status: jest.fn().mockReturnThis(), json: jest.fn() }, jest.fn());

        expect(SupportSubmission.create).toHaveBeenCalledWith(expect.objectContaining({
            type: 'report',
            reporter: 'user-1',
            reportedUser: '507f1f77bcf86cd799439012',
            message: 'spam account',
        }));
    });
});
