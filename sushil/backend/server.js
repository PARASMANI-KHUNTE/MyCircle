const path = require('path');
const dotenvPath = path.resolve(__dirname, '.env');
const result = require('dotenv').config({ path: dotenvPath, debug: true });
console.log("Dotenv loading from:", dotenvPath);
if (result.error) {
    console.error("Dotenv Error:", result.error);
} else {
    console.log("Dotenv Parsed:", result.parsed);
}
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const connectDB = require('./src/config/db');

// Passport config
require('./src/config/passport')(passport);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
connectDB();

// Passport middleware
app.use(passport.initialize());

// Routes
app.use('/auth', require('./src/routes/authRoutes'));
app.use('/api/posts', require('./src/routes/postRoutes'));
app.use('/api/contact', require('./src/routes/contactRoutes'));
app.use('/api/user', require('./src/routes/userRoutes'));

app.get('/', (req, res) => {
    res.send('MyCircle API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
