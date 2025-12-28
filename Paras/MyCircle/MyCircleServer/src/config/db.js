const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const isProduction = process.env.NODE_ENV === 'production';
        const dbURI = isProduction
            ? process.env.MONGO_URI
            : process.env.MONGO_URI_DEV;

        if (isProduction && !process.env.MONGO_URI) {
            console.error('MONGO_URI is not defined in production environment!');
            process.exit(1);
        }

        if (!isProduction && !process.env.MONGO_URI_DEV) {
            console.error('MONGO_URI_DEV is not defined in development environment!');
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
