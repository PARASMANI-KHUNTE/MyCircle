const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const User = require('../models/User');

module.exports = function (passport) {
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        passport.use(
            new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    callbackURL: '/auth/google/callback',
                },
                async (accessToken, refreshToken, profile, done) => {
                    const newUser = {
                        googleId: profile.id,
                        displayName: profile.displayName,
                        firstName: profile.name.givenName,
                        lastName: profile.name.familyName,
                        email: profile.emails[0].value,
                        avatar: profile.photos[0].value,
                    };

                    try {
                        let user = await User.findOne({ googleId: profile.id });

                        if (user) {
                            done(null, user);
                        } else {
                            user = await User.create(newUser);
                            done(null, user);
                        }
                    } catch (err) {
                        console.error(err);
                        done(err, null);
                    }
                }
            )
        );
    } else {
        console.warn('⚠️ Google Client ID/Secret missing. Google Auth disabled.');
    }

    // Serialization (not needed for JWT-only flow but good practice if session is used later)
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => done(err, user));
    });
};
