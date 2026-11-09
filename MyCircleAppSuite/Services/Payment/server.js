require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./src/app');

const PORT = process.env.PORT || 5006;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mycircle_payment';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log(`[Payment Service] Connected to MongoDB at ${MONGO_URI}`);
        app.listen(PORT, () => {
            console.log(`[Payment Service] Microservice running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('[Payment Service] Failed to connect to database:', err);
        process.exit(1);
    });
