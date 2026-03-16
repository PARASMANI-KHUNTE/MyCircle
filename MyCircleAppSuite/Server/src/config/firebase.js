const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined;

if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    console.error('❌ Firebase Admin SDK environment variables missing. Firebase features may be disabled.');
} else {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: FIREBASE_PROJECT_ID,
                clientEmail: FIREBASE_CLIENT_EMAIL,
                privateKey: FIREBASE_PRIVATE_KEY,
            })
        });

        console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing Firebase Admin SDK:', error.message);
    }
}

const db = admin.apps.length > 0 ? admin.firestore() : null;

module.exports = { admin, db };
