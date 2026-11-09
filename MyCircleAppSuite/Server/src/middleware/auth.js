const { verifyToken } = require('../services/identity/tokenService');

function authMiddleware(req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        const err = new Error('No token, authorization denied');
        err.statusCode = 401;
        return next(err);
    }

    // Verify token
    try {
        const decoded = verifyToken(token);
        req.user = decoded.user;
        next();
    } catch (err) {
        const authErr = new Error('Token is not valid');
        authErr.statusCode = 401;
        return next(authErr);
    }
}

authMiddleware.auth = authMiddleware;
module.exports = authMiddleware;
