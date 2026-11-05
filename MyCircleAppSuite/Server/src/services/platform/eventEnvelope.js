const crypto = require('crypto');

const EVENT_VERSION = 1;

const createEvent = ({ type, aggregateId, payload, context = {} }) => {
    if (!type || !aggregateId) {
        throw new Error('Event type and aggregate ID are required');
    }

    return {
        id: crypto.randomUUID(),
        version: EVENT_VERSION,
        type,
        aggregateId: String(aggregateId),
        occurredAt: new Date().toISOString(),
        context: {
            requestId: context.requestId || null,
            service: context.service || null,
        },
        payload: payload || {},
    };
};

const isValidEvent = (event) => Boolean(
    event
    && typeof event.id === 'string'
    && event.version === EVENT_VERSION
    && typeof event.type === 'string'
    && typeof event.aggregateId === 'string'
    && typeof event.occurredAt === 'string'
    && event.payload
    && typeof event.payload === 'object',
);

module.exports = {
    EVENT_VERSION,
    createEvent,
    isValidEvent,
};
