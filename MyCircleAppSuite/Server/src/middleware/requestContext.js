const crypto = require('crypto');

const REQUEST_ID_HEADER = 'x-request-id';
const MAX_REQUEST_ID_LENGTH = 128;
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]+$/;

const getRequestId = (value) => {
    if (
        typeof value === 'string'
        && value.length > 0
        && value.length <= MAX_REQUEST_ID_LENGTH
        && REQUEST_ID_PATTERN.test(value)
    ) {
        return value;
    }

    return crypto.randomUUID();
};

const requestContext = (logger, service = 'api') => (req, res, next) => {
    const requestId = getRequestId(req.get(REQUEST_ID_HEADER));
    const context = {
        requestId,
        service,
        method: req.method,
        path: req.originalUrl,
    };

    req.requestId = requestId;
    req.service = service;
    req.log = logger.child(context);
    req.startTime = process.hrtime.bigint();
    res.setHeader(REQUEST_ID_HEADER, requestId);

    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - req.startTime) / 1e6;
        req.log.info({
            status: res.statusCode,
            durationMs: Number(durationMs.toFixed(2)),
            userId: req.user?.id,
        }, 'Request completed');
    });

    next();
};

module.exports = {
    REQUEST_ID_HEADER,
    getRequestId,
    requestContext,
};
