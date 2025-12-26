/**
 * Environment Variable Validation Utility
 * Validates that all required environment variables are present at startup
 */

const validateEnv = () => {
    const isProduction = process.env.NODE_ENV === 'production';

    const requiredVars = [
        'JWT_SECRET',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET'
    ];

    if (isProduction) {
        requiredVars.push('MONGO_URI');
        requiredVars.push('CLIENT_URL');
    } else {
        requiredVars.push('MONGO_URI_DEV');
        requiredVars.push('CLIENT_URL_DEV');
    }

    const optionalVars = [
        'GEMINI_API_KEY',
        'CLIENT_URL',
        'CLIENT_URL_DEV',
        'CORS_ORIGINS',
        'MONGO_URI_DEV',
        'GOOGLE_ANDROID_CLIENT_ID',
        'GOOGLE_IOS_CLIENT_ID',
        'PORT',
        'NODE_ENV'
    ];

    const missing = [];
    const warnings = [];

    // Check required variables
    requiredVars.forEach(varName => {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    });

    // Check optional variables and warn
    optionalVars.forEach(varName => {
        if (!process.env[varName]) {
            warnings.push(varName);
        }
    });

    // Report results
    if (missing.length > 0) {
        console.error('❌ CRITICAL: Missing required environment variables:');
        missing.forEach(varName => console.error(`   - ${varName}`));
        console.error('\nPlease set these variables in your .env file');
        process.exit(1);
    }

    if (isProduction && !process.env.CORS_ORIGINS && !process.env.CLIENT_URL) {
        console.error('❌ CRITICAL: In production you must set CORS_ORIGINS or CLIENT_URL');
        process.exit(1);
    }

    if (warnings.length > 0) {
        console.warn('⚠️  Optional environment variables not set:');
        warnings.forEach(varName => console.warn(`   - ${varName}`));
        console.warn('Some features may be disabled.\n');
    }

    console.log('✅ Environment variables validated successfully\n');
};

module.exports = validateEnv;
