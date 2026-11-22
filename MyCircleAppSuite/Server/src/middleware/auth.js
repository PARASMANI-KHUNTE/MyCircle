const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        const err = new Error('No token, authorization denied');
        err.statusCode = 401;
        return next(err);
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.user?.id).select('accountStatus');
        if (!user) {
            const err = new Error('User no longer exists');
            err.statusCode = 401;
            return next(err);
        }
        if (['suspended', 'banned'].includes(user.accountStatus)) {
            const err = new Error('Account is suspended or banned');
            err.statusCode = 403;
            return next(err);
        }

        req.user = decoded.user;
        next();
    } catch (err) {
        const authErr = new Error('Token is not valid');
        authErr.statusCode = 401;
        return next(authErr);
    }
};
