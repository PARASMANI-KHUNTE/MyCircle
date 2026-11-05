const jwt = require('jsonwebtoken');

const getJwtExpiry = () => {
    const value = process.env.JWT_EXPIRY || '30d';

    if (/^\d+$/.test(value)) {
        return Number(value);
    }

    if (/^\d+[dhms]$/.test(value)) {
        return value;
    }

    return '30d';
};

const toClaims = (user) => ({
    user: {
        id: user.id,
        email: user.email,
        role: user.role,
    },
});

const issueToken = (user) => new Promise((resolve, reject) => {
    jwt.sign(
        toClaims(user),
        process.env.JWT_SECRET,
        { expiresIn: getJwtExpiry() },
        (error, token) => error ? reject(error) : resolve(token),
    );
});

const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

module.exports = {
    issueToken,
    verifyToken,
    toClaims,
};
