const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const isProduction = process.env.NODE_ENV === 'production';
        const dbURI = isProduction
            ? process.env.MONGO_URI
            : (process.env.MONGO_URI_DEV || 'mongodb://localhost:27017/mycircle');

        if (isProduction && !process.env.MONGO_URI) {
            console.error('MONGO_URI is not defined in production environment!');
            process.exit(1);
        }

        console.log(`Connecting to ${isProduction ? 'Production' : 'Development'} Database...`);

        const conn = await mongoose.connect(dbURI);

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
