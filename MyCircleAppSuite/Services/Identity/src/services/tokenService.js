const jwt = require('jsonwebtoken');

const getJwtSecret = () => process.env.JWT_SECRET || 'identity_service_default_secret_key_12345';
const getExpiresIn = () => process.env.JWT_EXPIRES_IN || '7d';

const createIdentityClaims = (user) => {
    if (!user?._id) {
        throw new Error('User entity with _id is required to create identity claims');
    }

    return {
        sub: String(user._id),
        email: user.email,
        displayName: user.displayName,
        service: 'identity-service',
    };
};

const issueToken = (user, options = {}) => {
    const claims = createIdentityClaims(user);
    return jwt.sign(claims, getJwtSecret(), {
        expiresIn: options.expiresIn || getExpiresIn(),
    });
};

const verifyToken = (token) => {
    if (!token) {
        throw new Error('No token provided');
    }
    return jwt.verify(token, getJwtSecret());
};

module.exports = {
    createIdentityClaims,
    issueToken,
    verifyToken,
};
