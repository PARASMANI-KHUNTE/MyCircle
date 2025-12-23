const mongoose = require('mongoose');

const connectDB = async () => {
    console.log("ConnectDB function called");
    try {
        console.log("Connecting to Mongo with URI:", process.env.MONGO_URI ? "DEFINED" : "UNDEFINED");
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mycircle', {
            // These options are no longer necessary in Mongoose 6+, but keeping for reference if using older versions
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
