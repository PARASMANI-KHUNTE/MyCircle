require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./src/app');

const PORT = process.env.PORT || 5002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mycircle_marketplace';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log(`[Marketplace Service] Connected to MongoDB at ${MONGO_URI}`);
        app.listen(PORT, () => {
            console.log(`[Marketplace Service] Microservice running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('[Marketplace Service] Failed to connect to database:', err);
        process.exit(1);
    });
