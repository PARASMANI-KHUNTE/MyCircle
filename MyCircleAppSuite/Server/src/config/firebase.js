const { initializeApp, cert, getApps, getApp } = require('firebase-admin/app');

let getAuth = null;
let getFirestore = null;
let getMessaging = null;
let Timestamp = null;
let FieldValue = null;

try {
    const authModule = require('firebase-admin/auth');
    getAuth = authModule.getAuth;
} catch (error) {
    console.warn('⚠️ Firebase Admin Auth module could not be loaded:', error.message);
}

try {
    const firestoreModule = require('firebase-admin/firestore');
    getFirestore = firestoreModule.getFirestore;
    Timestamp = firestoreModule.Timestamp;
    FieldValue = firestoreModule.FieldValue;
} catch (error) {
    console.warn('⚠️ Firebase Admin Firestore module could not be loaded. Firestore features will be disabled:', error.message);
}

try {
    const messagingModule = require('firebase-admin/messaging');
    getMessaging = messagingModule.getMessaging;
} catch (error) {
    console.warn('⚠️ Firebase Admin Messaging module could not be loaded. Push notifications will be disabled:', error.message);
}

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

const db = (getApps().length > 0 && typeof getFirestore === 'function')
    ? getFirestore(firebaseApp || undefined)
    : null;

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
    auth: (app = firebaseApp) => (typeof getAuth === 'function' ? getAuth(app || undefined) : null),
    messaging: (app = firebaseApp) => (typeof getMessaging === 'function' && getApps().length > 0
        ? getMessaging(app || undefined)
        : null),
    firestore: Object.assign(
        (app = firebaseApp) => ((getApps().length > 0 && typeof getFirestore === 'function') ? getFirestore(app || undefined) : null),
        {
            Timestamp: Timestamp || {
                fromDate: (date) => ({ toDate: () => date, toMillis: () => (date instanceof Date ? date.getTime() : Date.now()) }),
                now: () => ({ toDate: () => new Date(), toMillis: () => Date.now() }),
            },
            FieldValue: FieldValue || {
                serverTimestamp: () => new Date(),
            },
        }
    ),
};

module.exports = { admin, db };
