const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const router = express.Router();

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

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
                // Redirect to frontend with token
                const isProduction = process.env.NODE_ENV === 'production';
                const clientUrl = isProduction
                    ? process.env.CLIENT_URL
                    : process.env.CLIENT_URL_DEV;

                res.redirect(`${clientUrl}/login/success?token=${token}`);
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
            if (err) {
                throw new ApiError(500, 'Error generating authentication token');
            }
            res.json({ token });
        }
    );
}));

module.exports = router;
