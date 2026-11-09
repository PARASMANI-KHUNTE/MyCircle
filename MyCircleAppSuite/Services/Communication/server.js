require('dotenv').config();
const mongoose = require('mongoose');
const { server } = require('./src/app');

const PORT = process.env.PORT || 5003;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mycircle_communication';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log(`[Communication Service] Connected to MongoDB at ${MONGO_URI}`);
        server.listen(PORT, () => {
            console.log(`[Communication Service] Microservice & WebSockets running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('[Communication Service] Failed to connect to database:', err);
        process.exit(1);
    });
