const pino = require('pino');

const isProduction = process.env.NODE_ENV === 'production';

const logger = isProduction
    ? pino({ level: 'info' })
    : pino({ level: 'debug', transport: { target: 'pino-pretty' } });

module.exports = logger;
