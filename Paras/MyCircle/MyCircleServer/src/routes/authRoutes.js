const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const router = express.Router();

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
    (req, res) => {
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
                    console.error('JWT signing error:', err);
                    return res.status(500).json({ msg: 'Error generating token' });
                }
                // Redirect to frontend with token
                const isProduction = process.env.NODE_ENV === 'production';
                const clientUrl = isProduction
                    ? process.env.CLIENT_URL
                    : process.env.CLIENT_URL_DEV;

                res.redirect(`${clientUrl}/login/success?token=${token}`);
            }
        );
    }
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

// @desc    Dev Login (Get Token without Google)
// @route   POST /auth/dev-login
// @access  Public
// @desc    Mobile Google Login (Verify ID Token)
// @route   POST /auth/google-mobile
// @access  Public
router.post('/google-mobile', async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({ msg: 'No token provided' });
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: [
                process.env.GOOGLE_CLIENT_ID,
                // Add Android/iOS client IDs if they differ from the Web/Server client ID
                process.env.GOOGLE_ANDROID_CLIENT_ID,
                process.env.GOOGLE_IOS_CLIENT_ID
            ].filter(Boolean),
        });

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
                    console.error('JWT signing error:', err);
                    return res.status(500).json({ msg: 'Error generating token' });
                }
                res.json({ token });
            }
        );
    } catch (err) {
        console.error('Google verification error:', err);
        res.status(401).json({ msg: 'Invalid Google token' });
    }
});

module.exports = router;
