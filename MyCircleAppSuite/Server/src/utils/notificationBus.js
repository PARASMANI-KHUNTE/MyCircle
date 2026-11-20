const Redis = require('ioredis');

const NOTIFICATION_CHANNEL = 'mycircle:notifications';
const listeners = new Set();

let publisher = null;
let subscriber = null;
let initialized = false;

const log = (level, message, meta) => {
    const logger = global.appLogger;
    if (logger && typeof logger[level] === 'function') {
        logger[level](meta || {}, message);
        return;
    }
    const prefix = `[NotificationBus] ${message}`;
    if (meta && Object.keys(meta).length) console[level === 'warn' ? 'warn' : 'log'](prefix, meta);
    else console[level === 'warn' ? 'warn' : 'log'](prefix);
};

const createConnection = () => {
    if (!process.env.REDIS_URL) return null;

    try {
        const connection = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 1,
            enableOfflineQueue: false,
        });

        connection.on('error', (err) => {
            log('warn', 'Redis notification bus unavailable', { error: err.message });
        });

        return connection;
    } catch (err) {
        log('warn', 'Could not create Redis notification bus', { error: err.message });
        return null;
    }
};

const ensureSubscriber = () => {
    if (initialized || !process.env.REDIS_URL) return;
    initialized = true;

    subscriber = createConnection();
    if (!subscriber) return;

    subscriber.subscribe(NOTIFICATION_CHANNEL).catch((err) => {
        log('warn', 'Could not subscribe to notification channel', { error: err.message });
    });

    subscriber.on('message', (channel, rawMessage) => {
        if (channel !== NOTIFICATION_CHANNEL) return;

        try {
            const payload = JSON.parse(rawMessage);
            if (!payload?.recipientId || !payload?.notification) return;
            listeners.forEach((listener) => {
                try {
                    listener(payload);
                } catch (err) {
                    log('warn', 'Notification listener failed', { error: err.message });
                }
            });
        } catch (err) {
            log('warn', 'Malformed notification bus message', { error: err.message });
        }
    });
};

// Register a handler for notifications published by any server/worker instance.
const onNotification = (listener) => {
    if (typeof listener !== 'function') return () => undefined;
    ensureSubscriber();
    listeners.add(listener);
    return () => listeners.delete(listener);
};

// Returns true when the message was published to Redis. Callers should fall back
// to a direct local emit when this is false (for example, in development).
const publishNotification = async (payload) => {
    if (!process.env.REDIS_URL) return false;

    try {
        if (!publisher) publisher = createConnection();
        if (!publisher) return false;

        await publisher.publish(NOTIFICATION_CHANNEL, JSON.stringify(payload));
        return true;
    } catch (err) {
        log('warn', 'Could not publish notification', { error: err.message });
        return false;
    }
};

module.exports = {
    NOTIFICATION_CHANNEL,
    onNotification,
    publishNotification,
};
