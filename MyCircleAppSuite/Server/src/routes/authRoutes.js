const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const router = express.Router();

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { hashPassword, verifyPassword } = require('../utils/password');

// @desc    Auth with Google
// @route   GET /auth/google
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account', // Forces account picker to allow switching accounts
    session: false  // Disable sessions, we're using JWT
}));

// @desc    Google auth callback
// @route   GET /auth/google/callback
router.get(
    '/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/',
        session: false  // Disable sessions, we're using JWT
    }),
    asyncHandler(async (req, res) => {
        // Successful authentication
        const payload = {
            user: {
                id: req.user.id,
                email: req.user.email,
                role: req.user.role,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '30d' },
            (err, token) => {
                if (err) {
                    throw new ApiError(500, 'Error generating authentication token');
                }
                const isProduction = process.env.NODE_ENV === 'production';
                const clientUrl = isProduction
                    ? process.env.CLIENT_URL
                    : process.env.CLIENT_URL_DEV;

                // Use hash fragment instead of query params to prevent token leakage in logs/referrer
                res.redirect(`${clientUrl}/login/success#token=${token}`);
            }
        );
    })
);

// @desc    Logout user
// @route   GET /auth/logout
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});

const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signAuthToken = (user) => new Promise((resolve, reject) => {
    const payload = {
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
        },
    };

    jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '30d' },
        (err, token) => {
            if (err) return reject(err);
            resolve(token);
        }
    );
});

// @desc    Register with email/password
// @route   POST /auth/register
// @access  Public
router.post('/register', asyncHandler(async (req, res) => {
    const displayName = String(req.body.displayName || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!displayName || !email || !password) {
        throw new ApiError(400, 'Display name, email, and password are required');
    }
    if (displayName.length > 50) {
        throw new ApiError(400, 'Display name must be 50 characters or fewer');
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        throw new ApiError(400, 'Please provide a valid email address');
    }
    if (password.length < 8) {
        throw new ApiError(400, 'Password must be at least 8 characters long');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError(409, 'An account with that email already exists');
    }

    const { hash, salt } = await hashPassword(password);
    const user = await User.create({
        displayName,
        email,
        passwordHash: hash,
        passwordSalt: salt,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`,
    });

    const token = await signAuthToken(user);
    res.status(201).json({ token, user: { id: user.id, email: user.email, displayName: user.displayName } });
}));

// @desc    Login with email/password
// @route   POST /auth/login
// @access  Public
router.post('/login', asyncHandler(async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
        throw new ApiError(400, 'Email and password are required');
    }

    const user = await User.findOne({ email });
    if (!user || !user.passwordHash || !user.passwordSalt) {
        throw new ApiError(401, 'Invalid credentials');
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!isValidPassword) {
        throw new ApiError(401, 'Invalid credentials');
    }

    const token = await signAuthToken(user);
    res.json({ token, user: { id: user.id, email: user.email, displayName: user.displayName } });
}));

// @desc    Development-only email login shortcut
// @route   POST /auth/dev-login
// @access  Public
router.post('/dev-login', asyncHandler(async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        throw new ApiError(404, 'Not found');
    }

    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email) {
        throw new ApiError(400, 'Email is required');
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    const token = await signAuthToken(user);
    res.json({ token });
}));

// @desc    Mobile Google Login (Verify ID Token)
// @route   POST /auth/google-mobile
// @access  Public
router.post('/google-mobile', asyncHandler(async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        throw new ApiError(400, 'No Google ID Token provided');
    }

    let ticket;
    try {
        ticket = await client.verifyIdToken({
            idToken,
            audience: [
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_ANDROID_CLIENT_ID,
                process.env.GOOGLE_IOS_CLIENT_ID
            ].filter(Boolean),
        });
    } catch (err) {
        throw new ApiError(401, `Google verification failed: ${err.message}`);
    }

    const { sub, email, name, picture } = ticket.getPayload();

    // Find or create user
    let user = await User.findOne({
        $or: [
            { googleId: sub },
            { email: email }
        ]
    });

    if (!user) {
        user = new User({
            googleId: sub,
            displayName: name,
            email,
            avatar: picture,
        });
        await user.save();
    } else if (!user.googleId) {
        // Update existing email-only user with googleId
        user.googleId = sub;
        user.avatar = user.avatar || picture;
        await user.save();
    }

    const token = await signAuthToken(user);
    res.json({ token });
}));

module.exports = router;
