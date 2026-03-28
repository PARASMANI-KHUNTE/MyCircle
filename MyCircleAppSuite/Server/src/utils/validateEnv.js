/**
 * Environment Variable Validation Utility
 * Validates that all required environment variables are present at startup
 */
const { cleanEnv, str, port, url } = require('envalid');

const validateEnv = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    try {
        cleanEnv(process.env, {
            NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }),
            PORT: port({ default: 5000 }),
            JWT_SECRET: str(),
            GOOGLE_CLIENT_ID: str({ default: undefined }),
            GOOGLE_CLIENT_SECRET: str({ default: undefined }),
            CLOUDINARY_CLOUD_NAME: str(),
            CLOUDINARY_API_KEY: str(),
            CLOUDINARY_API_SECRET: str(),
            MONGO_URI: url(),
            MONGO_URI_DEV: url({ default: undefined }),
            CLIENT_URL: url({ default: undefined }),
            CLIENT_URL_DEV: url({ default: undefined }),
            CORS_ORIGINS: str({ default: undefined }),
            GROQ_API_KEY: str({ default: undefined }),
            GOOGLE_ANDROID_CLIENT_ID: str({ default: undefined }),
            GOOGLE_IOS_CLIENT_ID: str({ default: undefined }),
            REDIS_URL: url({ default: isProduction ? undefined : 'redis://localhost:6379' }),
        });
        
        console.log('✅ Environment variables validated successfully');
    } catch (err) {
        console.error('❌ Environment validation failed:', err.message);
        process.exit(1);
    }
};

module.exports = validateEnv;
