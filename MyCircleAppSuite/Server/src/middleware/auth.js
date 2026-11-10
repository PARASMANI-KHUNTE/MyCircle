const { verifyToken } = require('../services/identity/tokenService');
const User = require('../models/User');

// Extract the JWT from either the x-auth-token header (web client)
// or an Authorization: Bearer header (mobile client / service-to-service calls).
const extractToken = (req) => {
    const authToken = req.header('x-auth-token');
    if (authToken) return authToken.trim();

    const authorization = req.header('authorization');
    if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
        return authorization.slice(7).trim();
    }

    return null;
};

function authMiddleware(req, res, next) {
    // Get token from header
    const token = extractToken(req);

    // Check if not token
    if (!token) {
        const err = new Error('No token, authorization denied');
        err.statusCode = 401;
        return next(err);
    }

    // Verify token
    let decoded;
    try {
        decoded = verifyToken(token);
    } catch (err) {
        // Preserve the original error name so the central error handler can
        // distinguish expired tokens from invalid ones.
        const authErr = new Error(
            err && err.name === 'TokenExpiredError' ? 'Authentication token expired' : 'Token is not valid'
        );
        authErr.statusCode = 401;
        authErr.name = (err && err.name) || 'JsonWebTokenError';
        return next(authErr);
    }

    if (!decoded?.user?.id) {
        const err = new Error('Token is not valid');
        err.statusCode = 401;
        err.name = 'JsonWebTokenError';
        return next(err);
    }

    // Load fresh user state so bans, deletions, and role changes take effect
    // immediately instead of when the JWT expires.
    User.findById(decoded.user.id)
        .select('email role displayName banned banReason')
        .then((user) => {
            if (!user) {
                const err = new Error('User no longer exists');
                err.statusCode = 401;
                return next(err);
            }

            if (user.banned) {
                const err = new Error(
                    user.banReason ? `Account banned: ${user.banReason}` : 'Your account has been banned'
                );
                err.statusCode = 403;
                return next(err);
            }

            req.user = {
                id: String(user._id),
                email: user.email,
                role: user.role,
            };
            next();
        })
        .catch(next);
}

authMiddleware.auth = authMiddleware;
module.exports = authMiddleware;
