const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const router = express.Router();

// @desc    Auth with Google
// @route   GET /auth/google
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
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
                if (err) throw err;
                // Redirect to frontend with token (HashRouter expects #)
                const frontendBase = process.env.FRONTEND_URL || 'http://localhost:3000';
                res.redirect(`${frontendBase}/#/login/success?token=${token}`);
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

// @desc    Dev Login (Get Token without Google)
// @route   POST /auth/dev-login
// @access  Public
router.post('/dev-login', async (req, res) => {
    try {
        const { email } = req.body;
        // Find or create a demo user
        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({
                googleId: 'dev_' + Date.now(),
                displayName: 'Demo User',
                email: email,
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo'
            });
        }

        const payload = { user: { id: user.id, email: user.email, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
