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
                    proxy: true,
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

                        const avatar = (profile.photos && profile.photos.length > 0)
                            ? profile.photos[0].value
                            : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile.displayName)}`;

                        if (user) {
                            // Update existing user with latest Google info
                            user.displayName = profile.displayName;
                            user.firstName = profile.name.givenName;
                            user.lastName = profile.name.familyName;
                            // Only update avatar if Google provides one, or if current is missing
                            // Use the calculated robust avatar
                            if (!user.avatar || (profile.photos && profile.photos.length > 0)) {
                                user.avatar = avatar;
                            }
                            await user.save();
                            done(null, user);
                        } else {
                            const newUser = {
                                googleId: profile.id,
                                displayName: profile.displayName,
                                firstName: profile.name.givenName,
                                lastName: profile.name.familyName,
                                email: profile.emails[0].value,
                                avatar: avatar,
                            };
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

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
};
