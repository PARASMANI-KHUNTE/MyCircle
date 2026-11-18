const { initializeApp, cert, getApps, getApp } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

let firebaseApp = null;

if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    console.warn('⚠️ Firebase Admin SDK environment variables missing. Firebase features may be disabled.');
} else {
    try {
        if (getApps().length === 0) {
            firebaseApp = initializeApp({
                credential: cert({
                    projectId: FIREBASE_PROJECT_ID,
                    clientEmail: FIREBASE_CLIENT_EMAIL,
                    privateKey: FIREBASE_PRIVATE_KEY,
                }),
            });
        } else {
            firebaseApp = getApps()[0];
        }

        console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing Firebase Admin SDK:', error.message);
    }
}

const db = getApps().length > 0 ? getFirestore(firebaseApp || undefined) : null;

// Backward-compatible admin wrapper for existing codebase usage
const admin = {
    initializeApp,
    getApps,
    getApp,
    get apps() {
        return getApps();
    },
    credential: {
        cert,
    },
    auth: (app = firebaseApp) => getAuth(app || undefined),
    firestore: Object.assign((app = firebaseApp) => (getApps().length > 0 ? getFirestore(app || undefined) : null), {
        Timestamp,
        FieldValue,
    }),
};

module.exports = { admin, db };
