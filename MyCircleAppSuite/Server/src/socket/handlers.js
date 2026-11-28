const User = require('../models/User');
const { authorizeConversationAccess } = require('./authorization');

const registerSocketHandlers = (io, { logger } = {}) => {
    const log = logger || console;

    io.on('connection', (socket) => {
        log.info({ socketId: socket.id }, 'User connected');

        if (socket.user?.id) {
            socket.userId = socket.user.id;
            socket.join(`user:${socket.user.id}`);
            log.info({ userId: socket.user.id, room: `user:${socket.user.id}` }, 'User auto-joined room');
            socket.broadcast.emit('user_online', socket.user.id);
            User.findByIdAndUpdate(socket.user.id, {
                $set: { isOnline: true, lastSeenAt: new Date() }
            }).catch((error) => {
                log.warn({ userId: socket.user.id, error: error.message }, 'Failed to update online status');
            });
        }

        socket.on('join', (requestedUserId) => {
            try {
                if (!socket.user?.id) {
                    log.warn({ socketId: socket.id }, 'Join rejected for unauthenticated socket');
                    return;
                }
                if (requestedUserId && String(requestedUserId) !== String(socket.user.id)) {
                    log.warn({ socketId: socket.id, claimedUserId: requestedUserId, authenticatedUserId: socket.user.id }, 'Ignoring mismatched join userId');
                }
                socket.join(`user:${socket.user.id}`);
                socket.userId = socket.user.id;
            } catch (error) {
                log.error({ error: error.message }, 'Error in join event');
            }
        });

        socket.on('join_conversation', async (conversationId) => {
            try {
                const userId = socket.user?.id || socket.userId;
                if (!userId || !conversationId) {
                    return;
                }

                const { allowed, reason } = await authorizeConversationAccess({ conversationId, userId });
                if (!allowed) {
                    log.warn({ socketId: socket.id, userId, conversationId, reason }, 'Rejected join_conversation');
                    return;
                }

                socket.join(`conversation:${conversationId}`);
                log.debug({ conversationId }, 'User joined conversation');
            } catch (error) {
                log.error({ error: error.message }, 'Error in join_conversation');
            }
        });

        socket.on('leave_conversation', (conversationId) => {
            try {
                if (conversationId) {
                    socket.leave(`conversation:${conversationId}`);
                }
            } catch (error) {
                log.error({ error: error.message }, 'Error in leave_conversation');
            }
        });

        socket.on('typing_start', async (data) => {
            try {
                const userId = socket.user?.id || socket.userId;
                if (!userId || !data?.recipientId || !data?.conversationId) {
                    return;
                }

                const { allowed, reason } = await authorizeConversationAccess({
                    conversationId: data.conversationId,
                    userId,
                    recipientId: data.recipientId,
                });
                if (!allowed) {
                    log.warn({ socketId: socket.id, userId, conversationId: data.conversationId, reason }, 'Rejected typing_start');
                    return;
                }

                io.to(`user:${data.recipientId}`).emit('user_typing', {
                    userId,
                    conversationId: data.conversationId
                });
            } catch (error) {
                log.error({ error: error.message }, 'Error in typing_start');
            }
        });

        socket.on('typing_stop', async (data) => {
            try {
                const userId = socket.user?.id || socket.userId;
                if (!userId || !data?.recipientId || !data?.conversationId) {
                    return;
                }

                const { allowed, reason } = await authorizeConversationAccess({
                    conversationId: data.conversationId,
                    userId,
                    recipientId: data.recipientId,
                });
                if (!allowed) {
                    log.warn({ socketId: socket.id, userId, conversationId: data.conversationId, reason }, 'Rejected typing_stop');
                    return;
                }

                io.to(`user:${data.recipientId}`).emit('user_stop_typing', {
                    userId,
                    conversationId: data.conversationId
                });
            } catch (error) {
                log.error({ error: error.message }, 'Error in typing_stop');
            }
        });

        socket.on('disconnect', () => {
            try {
                log.info({ socketId: socket.id }, 'User disconnected');
                if (socket.userId) {
                    socket.broadcast.emit('user_offline', socket.userId);
                    User.findByIdAndUpdate(socket.userId, {
                        $set: { isOnline: false, lastSeenAt: new Date() }
                    }).catch((error) => {
                        log.warn({ userId: socket.userId, error: error.message }, 'Failed to update offline status');
                    });
                }
            } catch (error) {
                log.error({ error: error.message }, 'Error in disconnect');
            }
        });
    });
};

module.exports = { registerSocketHandlers };
