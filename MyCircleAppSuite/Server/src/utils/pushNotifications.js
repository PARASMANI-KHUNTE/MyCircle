const User = require('../models/User');
const { admin } = require('../config/firebase');

const STALE_TOKEN_ERROR_CODES = new Set([
    'messaging/registration-token-not-registered',
    'messaging/invalid-registration-token',
]);

const extractToken = (entry) => (typeof entry === 'string' ? entry : entry?.token);

const toDataPayload = (data) => Object.entries(data || {}).reduce((payload, [key, value]) => {
    if (value !== undefined && value !== null) payload[key] = String(value);
    return payload;
}, {});

// Sends a Firebase Cloud Message to every registered device of the recipient.
// Stale tokens are removed so the user's device list stays usable over time.
const sendPushNotification = async ({ recipientId, title, body, data = {} }) => {
    const messaging = typeof admin.messaging === 'function' ? admin.messaging() : null;
    if (!messaging || !recipientId) return { sent: 0, removedTokens: 0 };

    const user = await User.findById(recipientId).select('pushTokens');
    const tokens = (user?.pushTokens || [])
        .map(extractToken)
        .filter((token) => typeof token === 'string' && token.length > 0);

    if (!tokens.length) return { sent: 0, removedTokens: 0 };

    let result;
    try {
        result = await messaging.sendEachForMulticast({
            tokens,
            notification: { title, body },
            data: toDataPayload(data),
        });
    } catch (err) {
        console.error('[Push] Failed to send FCM message:', err.message);
        return { sent: 0, removedTokens: 0 };
    }

    const staleTokens = (result.responses || [])
        .map((response, index) => (STALE_TOKEN_ERROR_CODES.has(response?.error?.code) ? tokens[index] : null))
        .filter(Boolean);

    if (staleTokens.length) {
        await User.findByIdAndUpdate(recipientId, {
            $pull: { pushTokens: { token: { $in: staleTokens } } },
        });
    }

    return { sent: result.successCount || 0, removedTokens: staleTokens.length };
};

module.exports = { sendPushNotification };
