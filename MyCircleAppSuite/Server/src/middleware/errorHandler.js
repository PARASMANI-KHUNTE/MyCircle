/**
 * Centralized Error Handling Middleware
 * Provides consistent error responses across the application
 */

const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
    let error = err;

    // Log error for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
        console.error('Error Details:', {
            message: error.message,
            stack: error.stack,
            url: req.originalUrl,
            method: req.method,
            timestamp: new Date().toISOString()
        });
    }

    // Default error status and message
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal Server Error';

    // Handle specific Mongoose/Database error types if not already an ApiError
    if (!(error instanceof ApiError)) {
        if (error.name === 'ValidationError') {
            statusCode = 400;
            message = Object.values(error.errors).map(e => e.message).join(', ');
        } else if (error.name === 'CastError') {
            statusCode = 400;
            message = `Invalid format for ${error.path}: ${error.value}`;
        } else if (error.code === 11000) {
            statusCode = 400;
            message = 'Duplicate field value entered';
        } else if (error.name === 'JsonWebTokenError') {
            statusCode = 401;
            message = 'Invalid authentication token';
        } else if (error.name === 'TokenExpiredError') {
            statusCode = 401;
            message = 'Authentication token expired';
        } else if (error.name === 'MulterError') {
            statusCode = 400;
            if (error.code === 'LIMIT_FILE_SIZE') message = 'File size too large. Max 5MB';
            else message = `File upload error: ${error.message}`;
        }

        // Wrap in ApiError for consistency
        error = new ApiError(statusCode, message, false, err.stack);
    }

    // Send structured error response
    res.status(error.statusCode).json({
        success: false,
        msg: error.message,
        error: error.message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: error.stack,
            details: error.isOperational ? 'Operational' : 'Programmatic/Unknown'
        })
    });
};

module.exports = errorHandler;
