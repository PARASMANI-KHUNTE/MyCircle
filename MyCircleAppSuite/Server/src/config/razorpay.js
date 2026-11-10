const crypto = require('crypto');
const Razorpay = require('razorpay');

const key_id = process.env.RAZORPAY_KEY_ID || '';
const key_secret = process.env.RAZORPAY_KEY_SECRET || '';

let razorpayInstance = null;

if (key_id && key_secret) {
    try {
        razorpayInstance = new Razorpay({
            key_id,
            key_secret,
        });
    } catch (err) {
        console.warn('Failed to initialize Razorpay SDK:', err.message);
    }
}

/**
 * Check if real Razorpay credentials are configured
 */
const isRazorpayConfigured = () => {
    return Boolean(key_id && key_secret);
};

/**
 * Mock orders/signatures are only allowed outside production. A production
 * deployment without credentials must fail closed instead of "verifying"
 * payments that never moved any money.
 */
const isMockMode = () => !key_secret && process.env.NODE_ENV !== 'production';

/**
 * Returns public key to send to frontend
 */
const getPublicKey = () => {
    return key_id || 'rzp_test_mock_circle';
};

/**
 * Create a new Razorpay Order (supports real API with mock fallback for local dev)
 * @param {Object} options
 * @param {number} options.amountInPaise - Amount in paise (1 INR = 100 paise)
 * @param {string} [options.currency='INR']
 * @param {string} [options.receipt]
 * @param {Object} [options.notes]
 */
const createOrder = async ({ amountInPaise, currency = 'INR', receipt, notes = {} }) => {
    if (razorpayInstance) {
        return await razorpayInstance.orders.create({
            amount: Math.round(amountInPaise),
            currency,
            receipt: receipt || `rcpt_${Date.now()}`,
            notes,
        });
    }

    // Mock order for sandbox development when credentials aren't provided
    if (!isMockMode()) {
        throw new Error('Razorpay is not configured and mock orders are disabled in production');
    }

    const mockOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return {
        id: mockOrderId,
        entity: 'order',
        amount: Math.round(amountInPaise),
        amount_paid: 0,
        amount_due: Math.round(amountInPaise),
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        status: 'created',
        attempts: 0,
        notes,
        created_at: Math.floor(Date.now() / 1000),
        isMock: true,
    };
};

/**
 * Verify Razorpay payment signature
 * @param {Object} params
 * @param {string} params.orderId
 * @param {string} params.paymentId
 * @param {string} params.signature
 */
const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
    if (!orderId || !paymentId) return false;

    // In mock/test mode without production secret
    if (!key_secret) {
        if (!isMockMode()) return false;
        return Boolean(signature && !signature.startsWith('fail_'));
    }

    const hmac = crypto.createHmac('sha256', key_secret);
    hmac.update(`${orderId}|${paymentId}`);
    const generatedSignature = hmac.digest('hex');
    return generatedSignature === signature;
};

module.exports = {
    isRazorpayConfigured,
    getPublicKey,
    createOrder,
    verifyPaymentSignature,
    razorpayInstance,
};
