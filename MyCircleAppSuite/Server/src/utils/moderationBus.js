const Redis = require('ioredis');

const MODERATION_CHANNEL = 'mycircle:moderation';
const listeners = new Set();

let publisher = null;
let subscriber = null;
let initialized = false;

const createConnection = () => {
    if (!process.env.REDIS_URL) return null;

    try {
        const connection = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 1,
            enableOfflineQueue: false,
        });

        connection.on('error', (err) => {
            if (global.appLogger) {
                global.appLogger.warn({ error: err.message }, 'Redis moderation bus unavailable');
            }
        });

        return connection;
    } catch (err) {
        if (global.appLogger) {
            global.appLogger.warn({ error: err.message }, 'Could not create Redis moderation bus');
        }
        return null;
    }
};

const ensureSubscriber = () => {
    if (initialized || !process.env.REDIS_URL) return;
    initialized = true;

    subscriber = createConnection();
    if (!subscriber) return;

    subscriber.subscribe(MODERATION_CHANNEL).catch((err) => {
        if (global.appLogger) {
            global.appLogger.warn({ error: err.message }, 'Could not subscribe to moderation channel');
        }
    });

    subscriber.on('message', (channel, rawMessage) => {
        if (channel !== MODERATION_CHANNEL) return;

        try {
            const payload = JSON.parse(rawMessage);
            if (!payload?.postId) return;
            listeners.forEach((listener) => {
                try {
                    listener(payload);
                } catch (err) {
                    if (global.appLogger) {
                        global.appLogger.warn({ error: err.message }, 'Moderation listener failed');
                    }
                }
            });
        } catch (err) {
            if (global.appLogger) {
                global.appLogger.warn({ error: err.message }, 'Malformed moderation bus message');
            }
        }
    });
};

const onModerationUpdate = (listener) => {
    if (typeof listener !== 'function') return () => undefined;
    ensureSubscriber();
    listeners.add(listener);
    return () => listeners.delete(listener);
};

const publishModerationUpdate = async (payload) => {
    if (!process.env.REDIS_URL) return false;

    try {
        if (!publisher) publisher = createConnection();
        if (!publisher) return false;

        await publisher.publish(MODERATION_CHANNEL, JSON.stringify(payload));
        return true;
    } catch (err) {
        if (global.appLogger) {
            global.appLogger.warn({ error: err.message }, 'Could not publish moderation update');
        }
        return false;
    }
};

module.exports = {
    MODERATION_CHANNEL,
    onModerationUpdate,
    publishModerationUpdate,
};
