const mockAggregate = jest.fn();

const mockPostModel = jest.fn();
mockPostModel.aggregate = mockAggregate;

jest.mock('../src/models/Post', () => mockPostModel);
jest.mock('../src/models/User', () => jest.fn());
jest.mock('../src/models/Conversation', () => jest.fn());
jest.mock('../src/models/ContactRequest', () => jest.fn());
jest.mock('../src/models/Notification', () => jest.fn());
jest.mock('../src/config/firebase', () => ({ db: {} }));
jest.mock('../src/controllers/notificationController', () => ({ createNotification: jest.fn() }));
jest.mock('../src/utils/queue', () => ({ addImageJob: jest.fn() }));
jest.mock('../src/utils/chatLifecycle', () => ({ deletePostScopedChats: jest.fn() }));

const { getPosts } = require('../src/controllers/postController');

describe('getPosts feed filters', () => {
    let res;

    beforeEach(() => {
        jest.clearAllMocks();
        mockAggregate.mockResolvedValue([{ items: [], totalCount: [{ count: 0 }] }]);
        res = {
            json: jest.fn(),
            set: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };
    });

    it('filters urgent posts on the server', async () => {
        await getPosts({ query: { urgentOnly: 'true' } }, res, jest.fn());

        const pipeline = mockAggregate.mock.calls[0][0];
        const matchStages = pipeline.filter((stage) => stage.$match).map((stage) => stage.$match);

        expect(matchStages.some((match) => match.isUrgent === true)).toBe(true);
    });

    it('projects the fields used by feed filters and badges', async () => {
        await getPosts({ query: {} }, res, jest.fn());

        const pipeline = mockAggregate.mock.calls[0][0];
        const facet = pipeline.find((stage) => stage.$facet);
        const project = facet.$facet.items.find((stage) => stage.$project).$project;

        expect(project).toMatchObject({
            subType: 1,
            isUrgent: 1,
            acceptsBarter: 1,
            exchangePreference: 1,
        });
    });
});
