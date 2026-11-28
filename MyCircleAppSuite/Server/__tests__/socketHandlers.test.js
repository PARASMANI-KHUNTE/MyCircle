jest.mock('../src/socket/authorization', () => ({
    authorizeConversationAccess: jest.fn(),
}));

jest.mock('../src/models/User', () => ({
    findByIdAndUpdate: jest.fn(() => Promise.resolve()),
}));

const { authorizeConversationAccess } = require('../src/socket/authorization');
const { registerSocketHandlers } = require('../src/socket/handlers');

const silentLogger = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

const conversationId = '64b000000000000000000001';
const userId = '64b000000000000000000002';
const recipientId = '64b000000000000000000003';

const createSocket = () => {
    const handlers = {};
    const socket = {
        id: 'socket-1',
        user: { id: userId },
        join: jest.fn(),
        leave: jest.fn(),
        broadcast: { emit: jest.fn() },
        on: jest.fn((event, handler) => {
            handlers[event] = handler;
        }),
    };

    return { socket, handlers };
};

const createIo = () => {
    let connectionHandler;
    const emit = jest.fn();
    const to = jest.fn(() => ({ emit }));
    const io = {
        on: jest.fn((event, handler) => {
            if (event === 'connection') {
                connectionHandler = handler;
            }
        }),
        to,
    };

    return { io, to, emit, getConnectionHandler: () => connectionHandler };
};

describe('socket handlers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('joins a conversation room only when access is authorized', async () => {
        const { io, getConnectionHandler } = createIo();
        registerSocketHandlers(io, { logger: silentLogger });
        const { socket, handlers } = createSocket();
        getConnectionHandler()(socket);
        socket.join.mockClear();

        authorizeConversationAccess.mockResolvedValue({ allowed: false, reason: 'not_a_participant' });
        await handlers.join_conversation(conversationId);
        expect(socket.join).not.toHaveBeenCalled();

        authorizeConversationAccess.mockResolvedValue({ allowed: true, reason: null });
        await handlers.join_conversation(conversationId);
        expect(socket.join).toHaveBeenCalledWith(`conversation:${conversationId}`);
    });

    it('does not relay typing events for unauthorized conversations', async () => {
        const { io, to, emit, getConnectionHandler } = createIo();
        registerSocketHandlers(io, { logger: silentLogger });
        const { socket, handlers } = createSocket();
        getConnectionHandler()(socket);

        authorizeConversationAccess.mockResolvedValue({ allowed: false, reason: 'blocked' });

        await handlers.typing_start({ conversationId, recipientId });
        await handlers.typing_stop({ conversationId, recipientId });

        expect(to).not.toHaveBeenCalled();
        expect(emit).not.toHaveBeenCalled();
    });

    it('relays typing events to the recipient when access is authorized', async () => {
        const { io, to, emit, getConnectionHandler } = createIo();
        registerSocketHandlers(io, { logger: silentLogger });
        const { socket, handlers } = createSocket();
        getConnectionHandler()(socket);

        authorizeConversationAccess.mockResolvedValue({ allowed: true, reason: null });

        await handlers.typing_start({ conversationId, recipientId });
        expect(to).toHaveBeenCalledWith(`user:${recipientId}`);
        expect(emit).toHaveBeenCalledWith('user_typing', {
            userId,
            conversationId,
        });

        await handlers.typing_stop({ conversationId, recipientId });
        expect(emit).toHaveBeenCalledWith('user_stop_typing', {
            userId,
            conversationId,
        });
    });

    it('ignores typing events without a conversation or recipient', async () => {
        const { io, getConnectionHandler } = createIo();
        registerSocketHandlers(io, { logger: silentLogger });
        const { socket, handlers } = createSocket();
        getConnectionHandler()(socket);

        await handlers.typing_start({ recipientId });
        await handlers.typing_stop({ conversationId });

        expect(authorizeConversationAccess).not.toHaveBeenCalled();
    });
});
