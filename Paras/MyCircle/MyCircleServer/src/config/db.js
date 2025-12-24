const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const dbURI = process.env.MONGO_URI;

    if (!dbURI) {
      console.error('❌ MONGO_URI is not defined in environment variables');
      process.exit(1);
    }

    console.log('🌍 Connecting to MongoDB Atlas...');

    const conn = await mongoose.connect(dbURI, {
      autoIndex: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Failed');
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;