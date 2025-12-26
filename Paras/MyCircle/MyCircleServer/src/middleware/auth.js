const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        const authErr = new Error('Token is not valid');
        authErr.statusCode = 401;
        return next(authErr);
    }
};
