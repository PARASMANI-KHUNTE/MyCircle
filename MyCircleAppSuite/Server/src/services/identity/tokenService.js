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

const getJwtRefreshExpiry = () => {
    const value = process.env.JWT_REFRESH_EXPIRY || '60d';

    if (/^\d+$/.test(value)) {
        return Number(value);
    }

    if (/^\d+[dhms]$/.test(value)) {
        return value;
    }

    return '60d';
};

const issueToken = (user) => new Promise((resolve, reject) => {
    jwt.sign(
        toClaims(user),
        process.env.JWT_SECRET,
        { expiresIn: getJwtExpiry() },
        (error, token) => error ? reject(error) : resolve(token),
    );
});

// Issue an access + refresh token pair for clients that use the
// { accessToken, refreshToken } contract (the mobile app).
const issueTokenPair = (user) => new Promise((resolve, reject) => {
    jwt.sign(
        toClaims(user),
        process.env.JWT_SECRET,
        { expiresIn: getJwtExpiry() },
        (accessError, accessToken) => {
            if (accessError) return reject(accessError);

            jwt.sign(
                { ...toClaims(user), type: 'refresh' },
                process.env.JWT_SECRET,
                { expiresIn: getJwtRefreshExpiry() },
                (refreshError, refreshToken) => {
                    if (refreshError) return reject(refreshError);
                    resolve({ accessToken, refreshToken });
                },
            );
        },
    );
});

const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

// Refresh tokens are verified like access tokens. Legacy clients (mobile
// versions that stored the access token as the refresh token) are still
// accepted so existing sessions keep working.
const verifyRefreshToken = (token) => verifyToken(token);

module.exports = {
    issueToken,
    issueTokenPair,
    verifyToken,
    verifyRefreshToken,
    toClaims,
};
