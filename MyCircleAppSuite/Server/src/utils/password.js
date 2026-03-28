const crypto = require('crypto');

const SCRYPT_KEYLEN = 64;

const normalizePassword = (password) => String(password || '');

const hashPassword = async (password) => {
    const normalized = normalizePassword(password);
    const salt = crypto.randomBytes(16).toString('hex');

    const derivedKey = await new Promise((resolve, reject) => {
        crypto.scrypt(normalized, salt, SCRYPT_KEYLEN, (err, key) => {
            if (err) return reject(err);
            resolve(key.toString('hex'));
        });
    });

    return { salt, hash: derivedKey };
};

const verifyPassword = async (password, passwordHash, passwordSalt) => {
    if (!passwordHash || !passwordSalt) return false;

    const normalized = normalizePassword(password);
    const derivedKey = await new Promise((resolve, reject) => {
        crypto.scrypt(normalized, passwordSalt, SCRYPT_KEYLEN, (err, key) => {
            if (err) return reject(err);
            resolve(key);
        });
    });

    const expectedBuffer = Buffer.from(passwordHash, 'hex');
    if (derivedKey.length !== expectedBuffer.length) return false;

    return crypto.timingSafeEqual(derivedKey, expectedBuffer);
};

module.exports = {
    hashPassword,
    verifyPassword,
};
