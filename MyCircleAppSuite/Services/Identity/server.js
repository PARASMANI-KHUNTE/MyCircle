require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./src/app');

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mycircle_identity';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log(`[Identity Service] Connected to MongoDB at ${MONGO_URI}`);
        app.listen(PORT, () => {
            console.log(`[Identity Service] Microservice running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('[Identity Service] Failed to connect to database:', err);
        process.exit(1);
    });
