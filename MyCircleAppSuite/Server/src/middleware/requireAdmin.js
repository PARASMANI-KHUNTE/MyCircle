const User = require('../models/User');

const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user?.id) {
            const err = new Error('Unauthorized');
            err.statusCode = 401;
            return next(err);
        }
        const user = await User.findById(req.user.id).select('role');
        if (!user || user.role !== 'admin') {
            const err = new Error('Admin access required');
            err.statusCode = 403;
            return next(err);
        }
        req.adminUser = user;
        return next();
    } catch (e) {
        return next(e);
    }
};

module.exports = requireAdmin;
