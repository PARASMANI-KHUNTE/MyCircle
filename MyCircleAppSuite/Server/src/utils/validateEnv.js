/**
 * Environment Variable Validation Utility
 * Validates that all required environment variables are present at startup
 */
const { cleanEnv, str, port, url } = require('envalid');

const validateEnv = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Validate JWT_SECRET strength
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        console.error('❌ JWT_SECRET is required but not set');
        process.exit(1);
    }
    if (jwtSecret.length < 32) {
        console.error(`❌ JWT_SECRET must be at least 32 characters. Current: ${jwtSecret.length}`);
        console.error('   Generate with: openssl rand -hex 32');
        process.exit(1);
    }
    if (jwtSecret === 'supersecretkey' || jwtSecret === 'your-secret-key') {
        console.error('❌ JWT_SECRET cannot be a default/weak value');
        console.error('   Generate with: openssl rand -hex 32');
        process.exit(1);
    }
    
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
        console.log(`   JWT_SECRET: ${'*'.repeat(20)} (length: ${jwtSecret.length})`);
    } catch (err) {
        console.error('❌ Environment validation failed:', err.message);
        process.exit(1);
    }
};

module.exports = validateEnv;
