const jwt = require('jsonwebtoken');

/**
 * Validates and retrieves the JWT Secret securely.
 * Throws in production if no secret is explicitly configured.
 */
const getSecureJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('FATAL: JWT_SECRET environment variable is missing in production!');
        }
        return 'identity_service_default_secret_key_12345';
    }
    return secret;
};

/**
 * Standard authentication middleware for all microservices.
 */
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            code: 'UNAUTHORIZED',
            message: 'Authentication token required',
            requestId: req.requestId,
        });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, getSecureJwtSecret());
        req.user = {
            id: decoded.sub,
            email: decoded.email,
            displayName: decoded.displayName,
            role: decoded.role || 'user',
        };
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            code: 'INVALID_TOKEN',
            message: err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token signature',
            requestId: req.requestId,
        });
    }
};

/**
 * Standard correlation ID middleware.
 */
const attachRequestContext = (req, res, next) => {
    const incomingId = req.headers['x-request-id'];
    const safeId = incomingId && /^[a-zA-Z0-9_-]{1,64}$/.test(incomingId)
        ? incomingId
        : `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    req.requestId = safeId;
    res.setHeader('x-request-id', safeId);
    next();
};

/**
 * Standard centralized error response handler.
 */
const handleServiceError = (res, err, req, defaultStatus = 500) => {
    const status = err.status || defaultStatus;
    const isProduction = process.env.NODE_ENV === 'production';

    res.status(status).json({
        success: false,
        code: err.code || (status === 404 ? 'NOT_FOUND' : status === 400 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR'),
        message: err.message || 'An unexpected error occurred',
        requestId: req?.requestId,
        ...(isProduction ? {} : { stack: err.stack }),
    });
};

/**
 * Safe pagination helper to prevent DoS attacks via huge limit params.
 */
const parsePagination = (query, defaultLimit = 20, maxLimit = 100) => {
    const rawPage = parseInt(query.page, 10);
    const rawLimit = parseInt(query.limit, 10);

    const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isInteger(rawLimit) && rawLimit > 0
        ? Math.min(rawLimit, maxLimit)
        : defaultLimit;

    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

module.exports = {
    getSecureJwtSecret,
    requireAuth,
    attachRequestContext,
    handleServiceError,
    parsePagination,
};
