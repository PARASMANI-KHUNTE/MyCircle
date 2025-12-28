const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Path to service account key file
// The user provided the filename in the root directory
const serviceAccountPath = path.join(__dirname, '../../mycircle-8c36a-firebase-adminsdk-fbsvc-826bc9410a.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error('Firebase service account key file not found at:', serviceAccountPath);
} else {
    try {
        const serviceAccount = require(serviceAccountPath);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        console.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
        console.error('Error initializing Firebase Admin SDK:', error.message);
    }
}

const db = admin.apps.length > 0 ? admin.firestore() : null;

module.exports = { admin, db };
